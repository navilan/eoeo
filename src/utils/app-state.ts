// Application state management for Fractal Web
import { ObservableV2 as Observable } from "lib0/observable"
import { buildActiveGraph, createDefaultState } from "./data-loader.js"
import nodes from "../data/nodes.json"
import colors from "../data/group-colors.json"
import type { GraphState, Node, Edge, Transform, MetricType, LayerCap } from "../types/fractal-types.js"


// Helper function to get religion options for UI components
export function getReligionOptions(): Array<{id: string, label: string, color: string}> {
  const religionGroups = new Set<string>()
  const groupNodes = new Map<string, any>()

  // Get all unique religion groups and sample nodes for labels
  for (const node of nodes) {
    if (node.kind === 'religion') {
      religionGroups.add(node.group)
      if (!groupNodes.has(node.group)) {
        groupNodes.set(node.group, node)
      }
    }
  }

  // Use imported group colors

  return Array.from(religionGroups).map(group => ({
    id: group,
    label: capitalizeGroup(group),
    color: (colors as any)[group] || '#9ca3af'
  })).sort((a, b) => a.label.localeCompare(b.label))
}

// Helper to capitalize group names for display
function capitalizeGroup(group: string): string {
  const groupMap: Record<string, string> = {
    'buddhism': 'Buddhism',
    'christianity': 'Christianity',
    'confucian': 'Confucianism',
    'core': 'Core',
    'hinduism': 'Hinduism',
    'islam': 'Islam',
    'jain': 'Jainism',
    'judaism': 'Judaism',
    'sikh': 'Sikhism',
    'taoism': 'Taoism',
    'zoro': 'Zoroastrianism'
  }
  return groupMap[group] || group.charAt(0).toUpperCase() + group.slice(1)
}

export interface AppStateEvents extends Record<string, any> {
  stateChange: (state: GraphState) => void
  graphChange: (nodes: Node[], edges: Edge[]) => void
  transformChange: (transform: Transform) => void
  searchChange: (query: string) => void
  resetLayout: () => void
}

export class AppState {
  private state: GraphState
  private transform: Transform = { x: 0, y: 0, k: 1 }
  private currentNodes: Node[] = []
  private currentEdges: Edge[] = []
  private observable = new Observable<AppStateEvents>()

  constructor(initialState?: Partial<GraphState>) {
    this.state = {
      ...createDefaultState(),
      ...initialState
    }

    // Build initial graph
    this.updateGraph()
  }

  // Event subscription
  on<K extends keyof AppStateEvents>(event: K, callback: AppStateEvents[K]): void {
    this.observable.on(event as string, callback)
  }

  off<K extends keyof AppStateEvents>(event: K, callback: AppStateEvents[K]): void {
    this.observable.off(event as string, callback)
  }

  // Getters
  getState(): GraphState {
    return { ...this.state }
  }

  getTransform(): Transform {
    return { ...this.transform }
  }

  getNodes(): Node[] {
    return [...this.currentNodes]
  }

  getEdges(): Edge[] {
    return [...this.currentEdges]
  }

  // State updates
  setSearchQuery(query: string): void {
    if (this.state.searchQuery !== query) {
      this.state.searchQuery = query
      this.emitStateChange()
      this.observable.emit('searchChange', [query])
    }
  }

  setPerspective(perspective: string): void {
    if (this.state.perspective !== perspective) {
      this.state.perspective = perspective
      this.emitStateChange()
      this.updateGraph()
    }
  }

  setWavePerspective(wavePerspective: string): void {
    if (this.state.wavePerspective !== wavePerspective) {
      this.state.wavePerspective = wavePerspective
      this.emitStateChange()
      this.updateGraph()
    }
  }

  setLayerCap(layerCap: LayerCap): void {
    if (this.state.layerCap !== layerCap) {
      this.state.layerCap = layerCap
      this.emitStateChange()
      this.updateGraph()
    }
  }

  setMetric(metric: MetricType): void {
    if (this.state.metric !== metric) {
      this.state.metric = metric
      this.emitStateChange()
      this.updateGraph()
    }
  }

  setToggle(toggleId: string, checked: boolean): void {
    let changed = false

    switch (toggleId) {
      case 'religions':
        if (this.state.showReligions !== checked) {
          this.state.showReligions = checked
          changed = true
        }
        break
      case 'science':
        if (this.state.showScience !== checked) {
          this.state.showScience = checked
          changed = true
        }
        break
      case 'resonances':
        if (this.state.showResonances !== checked) {
          this.state.showResonances = checked
          changed = true
        }
        break
      case 'waves':
        if (this.state.showWaves !== checked) {
          this.state.showWaves = checked
          changed = true
        }
        break
      case 'archetypes':
        if (this.state.showArchetypes !== checked) {
          this.state.showArchetypes = checked
          changed = true
        }
        break
      case 'metaphysics':
        if (this.state.showMetaphysics !== checked) {
          this.state.showMetaphysics = checked
          changed = true
        }
        break
    }

    if (changed) {
      this.emitStateChange()
      this.updateGraph()
    }
  }

  setReligions(religions: Record<string, boolean>): void {
    this.state.religions = { ...religions }
    this.emitStateChange()
    this.updateGraph()
  }

  setTransform(transform: Transform): void {
    this.transform = { ...transform }
    this.observable.emit('transformChange', [this.transform])
  }

  resetView(): void {
    this.setTransform({ x: 0, y: 0, k: 1 })
    this.observable.emit('resetLayout', [])
  }

  // Batch state update
  updateState(updates: Partial<GraphState>): void {
    let changed = false

    Object.entries(updates).forEach(([key, value]) => {
      if (this.state[key as keyof GraphState] !== value) {
        (this.state as any)[key] = value
        changed = true
      }
    })

    if (changed) {
      this.emitStateChange()
      this.updateGraph()
    }
  }

  // Internal methods
  private updateGraph(): void {
    const { nodes, edges } = buildActiveGraph(this.state)
    this.currentNodes = nodes
    this.currentEdges = edges
    this.observable.emit('graphChange', [nodes, edges])
  }

  private emitStateChange(): void {
    this.observable.emit('stateChange', [this.getState()])
  }

  // Cleanup
  destroy(): void {
    this.observable.destroy()
  }
}

// Create singleton instance
let appStateInstance: AppState | null = null

export function createAppState(initialState?: Partial<GraphState>): AppState {
  if (appStateInstance) {
    appStateInstance.destroy()
  }
  appStateInstance = new AppState(initialState)
  return appStateInstance
}

export function getAppState(): AppState | null {
  return appStateInstance
}

export function getGlobalAppState(): AppState {
  if (!appStateInstance) {
    throw new Error('App state not initialized. Call createAppState first.')
  }
  return appStateInstance
}