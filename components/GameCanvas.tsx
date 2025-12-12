import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { StateFeature, GeoJSONData } from '../types';
import { COLOR_LAND, COLOR_PLACED, COLOR_BORDER } from '../constants';

interface GameCanvasProps {
  geoData: GeoJSONData | null;
  placedStates: Set<string>;
  highlightedStateId?: string | null;
  droppedFeature: StateFeature | null; // Used to trigger check
  dropPosition: { x: number; y: number } | null;
  onValidDrop: (feature: StateFeature) => void;
  width: number;
  height: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  geoData,
  placedStates,
  droppedFeature,
  dropPosition,
  onValidDrop,
  width,
  height
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Setup projection once dimensions or data change
  const { projection, pathGenerator } = useMemo(() => {
    const projection = d3.geoAlbersUsa()
      .scale(width * 1.3) // Scale relative to width
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);
    return { projection, pathGenerator };
  }, [width, height]);

  // Handle Drop Check
  useEffect(() => {
    if (droppedFeature && dropPosition && geoData) {
      const { x, y } = dropPosition;
      
      // Calculate centroid of the target state on screen
      // Fix: cast droppedFeature to any to satisfy D3 types
      const centroid = pathGenerator.centroid(droppedFeature as any);
      
      if (!centroid || isNaN(centroid[0])) return;

      // Distance check: Simple Euclidean distance
      // If the mouse drop position is within N pixels of the state's center
      const dist = Math.sqrt(Math.pow(x - centroid[0], 2) + Math.pow(y - centroid[1], 2));
      
      // Threshold can depend on state size, but a fixed reasonable pixel amount works for a game
      // Larger states are easier, smaller states (RI, DE) might need generous thresholds
      const threshold = 100; // 100px radius

      if (dist < threshold) {
        onValidDrop(droppedFeature);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [droppedFeature, dropPosition]);

  if (!geoData) return null;

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height} 
      className="w-full h-full select-none"
    >
      <defs>
        <filter id="inner-shadow">
          <feOffset dx="0" dy="1" />
          <feGaussianBlur stdDeviation="2" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="black" floodOpacity="0.2" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* Background / Empty Slots */}
      <g>
        {geoData.features.map((feature) => {
            const isPlaced = placedStates.has(feature.id.toString());
            return (
                <path
                    key={`bg-${feature.id}`}
                    // Fix: cast feature to any to satisfy D3 types
                    d={pathGenerator(feature as any) || ""}
                    fill={isPlaced ? COLOR_PLACED : COLOR_LAND}
                    stroke={COLOR_BORDER}
                    strokeWidth={1}
                    className={`transition-colors duration-500 ease-out ${isPlaced ? 'opacity-100' : 'opacity-50'}`}
                />
            );
        })}
      </g>
      
      {/* Labels for placed states */}
      <g pointerEvents="none">
        {geoData.features.map((feature) => {
            if (!placedStates.has(feature.id.toString())) return null;
            // Fix: cast feature to any to satisfy D3 types
            const centroid = pathGenerator.centroid(feature as any);
            if (!centroid || isNaN(centroid[0])) return null;
            
            // Only show label if state is large enough or just show 2-letter code if available
            // For now, full name with small font
            return (
              <text
                key={`label-${feature.id}`}
                x={centroid[0]}
                y={centroid[1]}
                textAnchor="middle"
                className="text-[10px] font-bold fill-green-900 opacity-0 animate-fadeIn"
                style={{ animation: 'fadeIn 0.5s forwards' }}
              >
                {feature.properties.name}
              </text>
            );
        })}
      </g>
    </svg>
  );
};