import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"
import { createRef } from "@duct-ui/core"
import { createAppState } from "../utils/app-state.js"
import { buildActiveGraph, config } from "../utils/data-loader.js"
import Sidebar, { type SidebarLogic } from "./Sidebar.js"
import SVGVisualization, { type SVGVisualizationLogic } from "./SVGVisualization.js"
import Button from "@duct-ui/components/button/button"
import Drawer, { type DrawerLogic } from "@duct-ui/components/layout/drawer"
import { createTutorial, tutorialSteps } from "../utils/tutorial.js"
import type { GraphState, Node, Edge, Transform, LayerCap } from "../types/fractal-types.js"

export interface FractalWebAppEvents extends BaseComponentEvents {
  // App-level events if needed
}

export interface FractalWebAppLogic {
  getState: () => GraphState
  setState: (updates: Partial<GraphState>) => void
  startTutorial: () => void
}

export interface FractalWebAppProps {
  initialState?: Partial<GraphState>
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

const sidebarRef = createRef<SidebarLogic>()
const visualizationRef = createRef<SVGVisualizationLogic>()
const drawerRef = createRef<DrawerLogic>()

// Initialize drawer when it becomes available - default to open
let isDrawerOpen: boolean = true

drawerRef.on('set', (drawerLogic) => {
  if (drawerLogic) {
    isDrawerOpen = true  // Start open by default
    drawerLogic.open()
  }
})

function handleMenuToggle(_el: HTMLElement): void {
  if (drawerRef.current) {
    drawerRef.current.toggle()
    isDrawerOpen = !isDrawerOpen
  }
}

function render(props: BaseProps<FractalWebAppProps>) {
  const {
    initialState = {},
    ...moreProps
  } = props

  // Build the initial graph data synchronously for server-side rendering
  const defaultState = {
    layerCap: config.defaultState.layerCap as LayerCap,
    showReligions: true,
    showScience: true,
    showResonances: true,
    showWaves: true,
    perspective: 'oneness',
    wavePerspective: '',
    metric: 'combined' as const,
    searchQuery: '',
    ...initialState
  }

  // Get initial data for server-side rendering
  const { nodes: initialNodes, edges: initialEdges } = buildActiveGraph(defaultState)

  return (
    <div
      class="relative h-screen w-screen overflow-hidden bg-base-100 text-base-content"
      data-fractal-app
      {...renderProps(moreProps)}
    >
      {/* Toggle Button */}
      <Button
        label="☰"
        class="fixed top-4 left-4 z-30 btn btn-square btn-sm bg-base-200 hover:bg-base-300 border-base-300 text-base-content shadow-lg lg:hidden"
        title="Toggle sidebar"
        data-drawer-trigger
        on:click={handleMenuToggle}
      />

      {/* Help Button */}
      <Button
        label="?"
        class="fixed top-4 right-4 z-30 btn btn-square btn-sm bg-primary hover:opacity-90 border-primary text-primary-content shadow-lg"
        title="Start tutorial"
        data-tutorial-trigger
        data-drawer-trigger
        on:click={() => {
          const event = new CustomEvent('start-tutorial')
          document.dispatchEvent(event)
        }}
      />

      {/* Drawer with Sidebar and Main Content */}
      <Drawer
        ref={drawerRef}
        isOpen={true}
        side="left"
        persistent={false}
        class="flex-1 min-h-0 h-full"
        drawerClass="h-full z-50"
        contentClass="h-full"
        drawerContent={
          <Sidebar
            ref={sidebarRef}
            state={defaultState}
            isVisible={true}
          />
        }
        mainContent={
          <div class="relative h-full w-full overflow-hidden">
            {/* Main Visualization */}
            <SVGVisualization
              ref={visualizationRef}
              width={1200}
              height={800}
              nodes={initialNodes}
              edges={initialEdges}
              state={defaultState}
              transform={{ x: 0, y: 0, k: 1 }}
              on:nodeClick={(el: HTMLElement, nodeId: string) => {
                const event = new CustomEvent('app-node-click', { detail: nodeId })
                el.dispatchEvent(event)
              }}
              on:edgeClick={(el: HTMLElement, edge: Edge) => {
                const event = new CustomEvent('app-edge-click', { detail: edge })
                el.dispatchEvent(event)
              }}
              on:transform={(el: HTMLElement, transform: Transform) => {
                const event = new CustomEvent('app-transform', { detail: transform })
                el.dispatchEvent(event)
              }}
            />

            {/* Info */}
            <div class="fixed right-4 bottom-4 z-10 text-xs px-3 py-2 rounded-lg bg-base-200/80 text-base-content border border-base-300 backdrop-blur-sm">
              Zoom: pinch/scroll • Pan: drag • ☰ to toggle controls
            </div>

            {/* Built with Duct Attribution */}
            <div class="fixed left-4 bottom-4 z-10 text-xs px-3 py-2 rounded-lg bg-base-200/80 text-base-content border border-base-300 backdrop-blur-sm">
              Built with <a href="https://duct-ui.com" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary-focus underline">Duct UI</a>
            </div>
          </div>
        }
      />
    </div>
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<FractalWebAppEvents>,
  props: BaseProps<FractalWebAppProps>
): BindReturn<FractalWebAppLogic> {
  const container = el as HTMLElement

  // Initialize global app state
  const appState = createAppState(props.initialState)
  let currentState = appState.getState()
  let currentNodes = appState.getNodes()
  let currentEdges = appState.getEdges()

  // Initialize tutorial
  const tutorial = createTutorial({
    steps: tutorialSteps,
    onComplete: () => {
      // Save that user has completed tutorial
      localStorage.setItem('fractal-tutorial-completed', 'true')
      // Make drawer non-persistent again
      const drawerElement = container.querySelector('.drawer') as HTMLElement
      if (drawerElement) {
        drawerElement.setAttribute('data-drawer-persistent', 'false')
        drawerElement.classList.remove('drawer-persistent')
      }
    },
    onCancel: () => {
      // Save that user has dismissed tutorial
      localStorage.setItem('fractal-tutorial-dismissed', 'true')
      // Make drawer non-persistent again
      const drawerElement = container.querySelector('.drawer') as HTMLElement
      if (drawerElement) {
        drawerElement.setAttribute('data-drawer-persistent', 'false')
        drawerElement.classList.remove('drawer-persistent')
      }
    }
  })

  function getState(): GraphState {
    return appState.getState()
  }

  function setState(updates: Partial<GraphState>): void {
    appState.updateState(updates)
  }

  function startTutorial(): void {
    // Make drawer persistent during tutorial
    const drawerElement = container.querySelector('.drawer') as HTMLElement
    if (drawerElement) {
      drawerElement.setAttribute('data-drawer-persistent', 'true')
      drawerElement.classList.add('drawer-persistent')
    }

    // Always ensure sidebar is visible before starting tutorial
    if (drawerRef.current) {
      drawerRef.current.open()
      isDrawerOpen = true
    }
    tutorial.start()
  }

  // App state event handlers
  appState.on('stateChange', (state: GraphState) => {
    currentState = state

    // Update sidebar
    if (sidebarRef.current) {
      sidebarRef.current.updateState(state)
    }

    // Update visualization
    if (visualizationRef.current) {
      visualizationRef.current.updateState(state)
    }
  })

  appState.on('graphChange', (nodes: Node[], edges: Edge[]) => {
    currentNodes = nodes
    currentEdges = edges

    // Update visualization with new graph data
    if (visualizationRef.current) {
      visualizationRef.current.updateGraph(nodes, edges)
    }
  })

  appState.on('transformChange', (transform: Transform) => {
    if (visualizationRef.current) {
      visualizationRef.current.setTransform(transform)
    }
  })

  appState.on('searchChange', (query: string) => {
    if (visualizationRef.current) {
      if (query.trim()) {
        visualizationRef.current.highlightSearch(query)
      } else {
        visualizationRef.current.resetHighlight()
      }
    }
  })

  // UI event handlers - simplified since components use global app state directly

  function handleResize(): void {
    // Update visualization dimensions
    if (visualizationRef.current) {
      visualizationRef.current.updateDimensions(window.innerWidth, window.innerHeight)
    }
  }

  function handleNodeClick(e: CustomEvent): void {
    const nodeId = e.detail
    // Could implement node focus or details view here
  }

  function handleEdgeClick(e: CustomEvent): void {
    const edge = e.detail
    // Could implement edge details view here
  }

  function handleTransform(e: CustomEvent): void {
    appState.setTransform(e.detail)
  }

  function handleStartTutorial(): void {
    startTutorial()
  }

  function handleEnsureSidebar(): void {
    if (drawerRef.current && !isDrawerOpen) {
      drawerRef.current.open()
      isDrawerOpen = true
    }
  }

  // Event listeners for visualization events only
  container.addEventListener('app-node-click', handleNodeClick as EventListener)
  container.addEventListener('app-edge-click', handleEdgeClick as EventListener)
  container.addEventListener('app-transform', handleTransform as EventListener)

  // Tutorial event listeners
  document.addEventListener('start-tutorial', handleStartTutorial as EventListener)
  document.addEventListener('tutorial-ensure-sidebar', handleEnsureSidebar as EventListener)

  // Window resize listener for responsive drawer behavior
  window.addEventListener('resize', handleResize)

  // Auto-start tutorial for first-time users
  setTimeout(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const hasSeenTutorial = localStorage.getItem('fractal-tutorial-completed') || localStorage.getItem('fractal-tutorial-dismissed')
      if (!hasSeenTutorial) {
        startTutorial()
      }
    }
  }, 1000)

  // Initial updates to components
  setTimeout(() => {
    if (sidebarRef.current) {
      sidebarRef.current.updateState(currentState)
    }
    if (visualizationRef.current) {
      visualizationRef.current.updateGraph(currentNodes, currentEdges)
      visualizationRef.current.updateState(currentState)
      // Set initial dimensions based on actual window size
      visualizationRef.current.updateDimensions(window.innerWidth, window.innerHeight)
    }
  }, 100)

  return {
    getState,
    setState,
    startTutorial,
    release: () => {
      appState.destroy()
      tutorial.complete()
      container.removeEventListener('app-node-click', handleNodeClick as EventListener)
      container.removeEventListener('app-edge-click', handleEdgeClick as EventListener)
      container.removeEventListener('app-transform', handleTransform as EventListener)
      document.removeEventListener('start-tutorial', handleStartTutorial as EventListener)
      document.removeEventListener('tutorial-ensure-sidebar', handleEnsureSidebar as EventListener)
      window.removeEventListener('resize', handleResize)
    }
  }
}

const id = { id: "fractal/app" }

const FractalWebApp = createBlueprint<FractalWebAppProps, FractalWebAppEvents, FractalWebAppLogic>(
  id,
  render,
  { bind }
)

export default FractalWebApp