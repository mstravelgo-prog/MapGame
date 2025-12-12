import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { StateFeature } from '../types';

interface DraggableStateProps {
  feature: StateFeature;
  onMouseDown: (e: React.MouseEvent, feature: StateFeature) => void;
}

export const DraggableState: React.FC<DraggableStateProps> = ({ feature, onMouseDown }) => {
  const pathData = useMemo(() => {
    // We need to normalize the path to fit in a small box
    const projection = d3.geoAlbersUsa();
    const pathGenerator = d3.geoPath().projection(projection);
    
    // First, just get bounds to center it locally
    // Since we can't easily re-project a single feature centered at 0,0 without complex transforms,
    // we will rely on SVG viewBox to crop to the feature's bounds.
    
    // However, d3.geoAlbersUsa returns null for points outside US. 
    // The raw feature coordinates are lat/long.
    
    // Strategy: Render the full path, but calculate the bounding box of the projected path
    // and use that for the viewBox.
    // Fix: cast feature to any to satisfy D3 types
    const bounds = pathGenerator.bounds(feature as any);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const x = bounds[0][0];
    const y = bounds[0][1];
    
    // Add some padding
    const padding = 5;
    const viewBox = `${x - padding} ${y - padding} ${dx + padding * 2} ${dy + padding * 2}`;
    
    // Fix: cast feature to any to satisfy D3 types
    return { d: pathGenerator(feature as any) || "", viewBox };
  }, [feature]);

  return (
    <div 
      className="flex flex-col items-center justify-center p-2 cursor-grab active:cursor-grabbing hover:bg-slate-50 rounded-lg transition-colors group w-32 shrink-0"
      onMouseDown={(e) => onMouseDown(e, feature)}
      onTouchStart={(e) => {
        // Simple touch support adapter
         const touch = e.touches[0];
         // We construct a synthetic mouse event for simplicity or handle in parent
         // ideally we just bubble up
      }}
    >
      <div className="w-24 h-24 relative">
         <svg 
           viewBox={pathData.viewBox} 
           className="w-full h-full drop-shadow-sm group-hover:drop-shadow-md transition-all text-blue-500 fill-current"
           style={{ overflow: 'visible' }}
         >
           <path d={pathData.d} stroke="white" strokeWidth="1" vectorEffect="non-scaling-stroke" />
         </svg>
      </div>
      <span className="text-xs font-semibold text-slate-600 mt-2 text-center truncate w-full">
        {feature.properties.name}
      </span>
    </div>
  );
};