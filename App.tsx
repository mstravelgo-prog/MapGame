import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { GeoJSONData, StateFeature } from './types';
import { GEOJSON_URL } from './constants';
import { GameCanvas } from './components/GameCanvas';
import { DraggableState } from './components/DraggableState';
import { FloatingDragLayer } from './components/FloatingDragLayer';

const App: React.FC = () => {
  // Data State
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState(true);

  // Game State
  const [placedStates, setPlacedStates] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [isWon, setIsWon] = useState(false);

  // Drag State
  const [draggingFeature, setDraggingFeature] = useState<StateFeature | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Dimensions for map
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 500 });

  // Drop Trigger
  const [droppedState, setDroppedState] = useState<{feature: StateFeature, pos: {x:number, y:number}} | null>(null);

  // Initialization
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then(res => res.json())
      .then((data) => {
        // Add random IDs if missing, though us-states.json usually has IDs
        setGeoData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load map data", err);
        setLoading(false);
      });

    const handleResize = () => {
        if (containerRef.current) {
            setDims({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial size
    setTimeout(handleResize, 100);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global Drag Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingFeature) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (draggingFeature) {
        // Determine the drop position relative to the SVG container
        if (containerRef.current) {
           const rect = containerRef.current.getBoundingClientRect();
           const x = e.clientX - rect.left;
           const y = e.clientY - rect.top;
           
           // Trigger a drop check in the GameCanvas
           setDroppedState({ feature: draggingFeature, pos: { x, y } });
        }
        setDraggingFeature(null);
      }
    };

    if (draggingFeature) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingFeature]);

  const handleStartDrag = (e: React.MouseEvent, feature: StateFeature) => {
    e.preventDefault();
    setDraggingFeature(feature);
    setMousePos({ x: e.clientX, y: e.clientY });
    setDroppedState(null); // Reset previous drop
  };

  const handleValidDrop = useCallback((feature: StateFeature) => {
    const id = feature.id.toString();
    if (!placedStates.has(id)) {
      // Success!
      const newSet = new Set(placedStates);
      newSet.add(id);
      setPlacedStates(newSet);
      setScore(prev => prev + 100);
      
      // Check Win
      if (geoData && newSet.size === geoData.features.length) {
          setIsWon(true);
      }
    }
  }, [placedStates, geoData]);

  // Derived Inventory List
  const inventoryList = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.filter(f => !placedStates.has(f.id.toString()));
  }, [geoData, placedStates]);

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10 shrink-0">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">🇺🇸</span> USA Map Puzzle
        </h1>
        <div className="flex items-center gap-6">
            <div className="bg-slate-100 px-4 py-2 rounded-lg">
                <span className="text-slate-500 text-sm font-medium uppercase tracking-wide">States</span>
                <span className="ml-2 text-lg font-bold text-slate-900">{placedStates.size} / {geoData?.features.length || 50}</span>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                <span className="text-blue-500 text-sm font-medium uppercase tracking-wide">Score</span>
                <span className="ml-2 text-lg font-bold text-blue-700">{score}</span>
            </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
        
        {/* Map Board */}
        <div className="flex-grow relative bg-black m-4 rounded-xl shadow-inner overflow-hidden border border-slate-800" ref={containerRef}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    Loading Map Data...
                </div>
            )}
            <GameCanvas 
                geoData={geoData}
                placedStates={placedStates}
                droppedFeature={droppedState?.feature || null}
                dropPosition={droppedState?.pos || null}
                onValidDrop={handleValidDrop}
                width={dims.width}
                height={dims.height}
            />
            
            {isWon && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 animate-scaleUp">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Congratulations!</h2>
                        <p className="text-slate-600 mb-6">You've completed the USA map puzzle.</p>
                        <div className="text-2xl font-bold text-blue-600 mb-8">Final Score: {score}</div>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105"
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </div>

      </main>

      {/* Inventory Bar */}
      <div className="h-48 shrink-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex flex-col">
        <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory</span>
             <span className="text-xs text-slate-400">Drag states to the map above</span>
        </div>
        <div className="flex-grow overflow-x-auto overflow-y-hidden p-4">
            <div className="flex gap-4 min-w-min h-full items-center">
                {inventoryList.length === 0 && !loading && (
                    <div className="w-full text-center text-slate-400 italic">Inventory empty - Good job!</div>
                )}
                {inventoryList.map(feature => (
                    <DraggableState 
                        key={feature.id} 
                        feature={feature} 
                        onMouseDown={handleStartDrag} 
                    />
                ))}
            </div>
        </div>
      </div>

      {/* Dragging Overlay */}
      <FloatingDragLayer 
        feature={draggingFeature} 
        x={mousePos.x} 
        y={mousePos.y} 
      />

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default App;