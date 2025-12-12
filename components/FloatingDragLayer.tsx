import React from 'react';
import * as d3 from 'd3';
import { StateFeature } from '../types';

interface FloatingDragLayerProps {
  feature: StateFeature | null;
  x: number;
  y: number;
}

export const FloatingDragLayer: React.FC<FloatingDragLayerProps> = ({ feature, x, y }) => {
  if (!feature) return null;

  // We reuse the same logic to render the path "in hand"
  // But we want it to look like the shape itself
  const projection = d3.geoAlbersUsa();
  const pathGenerator = d3.geoPath().projection(projection);
  
  // Fix: cast feature to any to satisfy D3 types
  const bounds = pathGenerator.bounds(feature as any);
  const dx = bounds[1][0] - bounds[0][0];
  const dy = bounds[1][1] - bounds[0][1];
  const bx = bounds[0][0];
  const by = bounds[0][1];
  
  const padding = 2;
  const viewBox = `${bx - padding} ${by - padding} ${dx + padding * 2} ${dy + padding * 2}`;
  // Fix: cast feature to any to satisfy D3 types
  const d = pathGenerator(feature as any) || "";

  // Center the shape on the mouse
  const width = 150; // Fixed width for the dragged item
  const height = 150;

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width: `${width}px`,
        height: `${height}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0.9,
      }}
    >
      <svg 
        viewBox={viewBox} 
        width="100%" 
        height="100%"
        className="drop-shadow-xl filter"
      >
        <path d={d} fill="#3b82f6" stroke="white" strokeWidth="2" />
      </svg>
    </div>
  );
};