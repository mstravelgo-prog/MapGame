export interface Geometry {
  type: string;
  coordinates: any[];
}

export interface StateFeature {
  type: 'Feature';
  id: string | number;
  properties: {
    name: string;
    density?: number;
    [key: string]: any;
  };
  geometry: Geometry;
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  features: StateFeature[];
}

export interface GameState {
  placedStates: Set<string>; // Set of IDs of correctly placed states
  score: number;
  message: string;
  isLoading: boolean;
  activeFact?: string;
}

export interface DragItem {
  feature: StateFeature;
  startX: number;
  startY: number;
}
