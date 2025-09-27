// Type definitions for Fractal Web visualization
export interface Node {
  id: string
  label: string
  group: string
  kind: 'religion' | 'science' | 'wave' | 'archetype' | 'philosophy'
  layer: number | 'archetypes'
}

export interface Edge {
  source: string
  target: string
  type: 'lineage' | 'cross' | 'wave' | 'archetype'
  meaning?: number
  influence?: number
  chronology?: number
}

export interface SimulationNode extends Node {
  x: number
  y: number
  vx: number
  vy: number
}

export type MetricType = 'combined' | 'meaning' | 'influence' | 'chronology'
export type LayerCap = '0' | '1' | '2' | '3' | '4' | '5' | '6'
export type GroupType = keyof typeof import('../data/group-colors.json')

export interface GraphState {
  layerCap: LayerCap
  showReligions: boolean
  religions: Record<string, boolean>
  showScience: boolean
  showResonances: boolean
  showWaves: boolean
  showArchetypes: boolean
  showPhilosophy: boolean
  perspective: string
  wavePerspective: string
  metric: MetricType
  searchQuery: string
}

export interface Transform {
  x: number
  y: number
  k: number
}

export interface LegendItem {
  label: string
  color?: string
  shape: 'dot' | 'hex' | 'wave' | 'square' | 'triangle' | 'diamond'
}

export interface PerspectiveOption {
  value: string
  label: string
}

export interface WaveOption {
  value: string
  label: string
}