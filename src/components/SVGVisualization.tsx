import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"
import { ForceSimulation } from "../utils/force-simulation.js"
import { getNodeColor } from "../utils/data-loader.js"
import GraphNode from "./GraphNode.js"
import GraphEdge from "./GraphEdge.js"
import GraphLabel from "./GraphLabel.js"
import type { Node, Edge, GraphState, Transform, SimulationNode } from "../types/fractal-types.js"

export interface SVGVisualizationEvents extends BaseComponentEvents {
  nodeClick: (nodeId: string) => void
  edgeClick: (edge: Edge) => void
  transform: (transform: Transform) => void
}

export interface SVGVisualizationLogic {
  updateGraph: (nodes: Node[], edges: Edge[]) => void
  updateState: (state: GraphState) => void
  setTransform: (transform: Transform) => void
  getTransform: () => Transform
  highlightSearch: (query: string) => void
  resetHighlight: () => void
  updateDimensions: (width: number, height: number) => void
  resetLayout: () => void
}

export interface SVGVisualizationProps {
  width?: number
  height?: number
  nodes: Node[]
  edges: Edge[]
  state: GraphState
  transform?: Transform
  'on:nodeClick'?: (el: HTMLElement, nodeId: string) => void
  'on:edgeClick'?: (el: HTMLElement, edge: Edge) => void
  'on:transform'?: (el: HTMLElement, transform: Transform) => void
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

// Ring radii for layer visualization
const RING_RADII = { 0: 0, 1: 120, 2: 240, 3: 380, 4: 520, 5: 660, 6: 800, 7: 940, 8: 1080 }

function render(props: BaseProps<SVGVisualizationProps>) {
  const {
    width = 1200,
    height = 700,
    nodes = [],
    edges = [],
    state,
    transform = { x: 0, y: 0, k: 1 },
    ...moreProps
  } = props

  const viewBox = `${-width/2} ${-height/2} ${width} ${height}`

  // Create background rings
  const rings = [1, 2, 3, 4, 5, 6, 7, 8].map(layer => (
    <circle
      class="graph-ring"
      r={RING_RADII[layer as keyof typeof RING_RADII]}
      cx={0}
      cy={0}
    />
  ))

  // Create node lookup for edge rendering
  const nodeMap = new Map(nodes.map(n => [n.id, n as SimulationNode]))

  // Render edges
  const edgeElements = edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source)
    const targetNode = nodeMap.get(edge.target)

    if (!sourceNode || !targetNode) return null

    const isSpine = edge.type === 'lineage' &&
      (edge.target === state.perspective || edge.source === state.perspective)

    return (
      <GraphEdge
        edge={edge}
        sourceNode={sourceNode}
        targetNode={targetNode}
        isSpine={isSpine}
        on:click={(el: HTMLElement, clickedEdge: Edge) => {
          const event = new CustomEvent('viz-edge-click', { detail: clickedEdge })
          el.dispatchEvent(event)
        }}
      />
    )
  }).filter(Boolean)

  // Render nodes
  const nodeElements = nodes.map(node => {
    const simNode = node as SimulationNode
    const isVisible =
      (state.showReligions || simNode.kind !== 'religion') &&
      (state.showScience || simNode.kind !== 'science') &&
      (state.showWaves || simNode.kind !== 'wave') &&
      (state.showArchetypes || simNode.kind !== 'archetype') &&
      (state.showPhilosophy || simNode.kind !== 'philosophy')

    return (
      <GraphNode
        node={simNode}
        isVisible={isVisible}
        on:click={(el: HTMLElement, nodeId: string) => {
          const event = new CustomEvent('viz-node-click', { detail: nodeId })
          el.dispatchEvent(event)
        }}
      />
    )
  })

  // Render labels
  const labelElements = nodes.map(node => {
    const simNode = node as SimulationNode
    const isVisible =
      (state.showReligions || simNode.kind !== 'religion') &&
      (state.showScience || simNode.kind !== 'science') &&
      (state.showWaves || simNode.kind !== 'wave')

    return (
      <GraphLabel
        node={simNode}
        isVisible={isVisible}
        isHighlighted={false}
      />
    )
  })

  return (
    <svg
      viewBox={viewBox}
      class="w-full h-full block cursor-grab active:cursor-grabbing"
      style="pointer-events: auto; user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;"
      data-svg-viz
      {...renderProps(moreProps)}
    >
      <g data-scene transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
        {/* Background rings */}
        <g data-rings>
          {rings}
        </g>

        {/* Edge layer */}
        <g data-edges>
          {edgeElements}
        </g>

        {/* Node layer */}
        <g data-nodes>
          {nodeElements}
        </g>

        {/* Label layer */}
        <g data-labels>
          {labelElements}
        </g>
      </g>
    </svg>
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<SVGVisualizationEvents>,
  props: BaseProps<SVGVisualizationProps>
): BindReturn<SVGVisualizationLogic> {
  // @ts-ignore
  const svg = el  as SVGElement
  const scene = svg.querySelector('[data-scene]') as SVGGElement

  if (!scene) {
    throw new Error('SVGVisualization: Scene element not found')
  }

  // Initialize simulation
  const simulation = new ForceSimulation({
    width: props.width || 1200,
    height: props.height || 700,
    centerX: 0,
    centerY: 0
  })

  let currentTransform: Transform = props.transform || { x: 0, y: 0, k: 1 }
  let currentNodes: SimulationNode[] = []
  let currentEdges: Edge[] = []
  let currentState = props.state
  let searchQuery = ''

  // Component refs for dynamic updates
  const nodeRefs = new Map<string, any>()
  const edgeRefs = new Map<string, any>()
  const labelRefs = new Map<string, any>()

  // Pan/zoom state
  let isDragging = false
  let lastPointer = { x: 0, y: 0 }
  let lastTouchDistance = 0
  let lastTouchCenter = { x: 0, y: 0 }

  function updateGraph(nodes: Node[], edges: Edge[]): void {
    simulation.stop()
    simulation.setData(nodes, edges)
    simulation.setFocus(currentState.perspective, currentState.wavePerspective)
    simulation.setMetric(currentState.metric)

    currentNodes = simulation.getNodes()
    currentEdges = simulation.getEdges()

    // Re-render the graph by updating DOM elements
    reRenderGraph()
    simulation.start()
  }

  function reRenderGraph(): void {
    // Remove existing node and edge elements
    const existingNodes = svg.querySelectorAll('[data-nodes] > *')
    const existingEdges = svg.querySelectorAll('[data-edges] > *')
    const existingLabels = svg.querySelectorAll('[data-labels] > *')

    existingNodes.forEach(el => el.remove())
    existingEdges.forEach(el => el.remove())
    existingLabels.forEach(el => el.remove())

    // Get container elements
    const nodesContainer = svg.querySelector('[data-nodes]') as SVGGElement
    const edgesContainer = svg.querySelector('[data-edges]') as SVGGElement
    const labelsContainer = svg.querySelector('[data-labels]') as SVGGElement

    // Create node lookup for edge rendering
    const nodeMap = new Map(currentNodes.map(n => [n.id, n]))

    // Render new edges
    currentEdges.forEach((edge) => {
      const sourceNode = nodeMap.get(edge.source)
      const targetNode = nodeMap.get(edge.target)

      if (!sourceNode || !targetNode) {
        return
      }

      const isSpine = edge.type === 'lineage' &&
        (edge.target === currentState.perspective || edge.source === currentState.perspective)

      // Create edge element
      const edgeEl = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      edgeEl.setAttribute('x1', sourceNode.x?.toString() || '0')
      edgeEl.setAttribute('y1', sourceNode.y?.toString() || '0')
      edgeEl.setAttribute('x2', targetNode.x?.toString() || '0')
      edgeEl.setAttribute('y2', targetNode.y?.toString() || '0')
      edgeEl.setAttribute('data-edge-source', edge.source)
      edgeEl.setAttribute('data-edge-target', edge.target)

      if (isSpine) {
        edgeEl.setAttribute('class', 'graph-edge-spine')
      } else if (edge.type === 'cross') {
        edgeEl.setAttribute('class', 'graph-edge-cross')
      } else if (edge.type === 'wave') {
        edgeEl.setAttribute('class', 'graph-edge-wave')
      } else if (edge.type === 'archetype') {
        edgeEl.setAttribute('class', 'graph-edge-archetype')
      } else {
        edgeEl.setAttribute('class', 'graph-edge')
      }

      edgesContainer.appendChild(edgeEl)
    })

    // Render new nodes
    currentNodes.forEach((node) => {
      const isVisible =
        (currentState.showReligions || node.kind !== 'religion') &&
        (currentState.showScience || node.kind !== 'science') &&
        (currentState.showWaves || node.kind !== 'wave') &&
        (currentState.showArchetypes || node.kind !== 'archetype') &&
        (currentState.showPhilosophy || node.kind !== 'philosophy')


      if (!isVisible) return

      // Create node group
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      nodeGroup.setAttribute('data-node-id', node.id)
      nodeGroup.setAttribute('transform', `translate(${node.x || 0},${node.y || 0})`)

      // Create node shape based on type
      let nodeShape: SVGElement
      const color = getNodeColor(node.group)

      if (node.kind === 'science') {
        // Circle for science nodes
        nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        nodeShape.setAttribute('r', '7')
        nodeShape.setAttribute('fill', color)
        nodeShape.setAttribute('stroke', '#0b0f14')
        nodeShape.setAttribute('stroke-width', '1.2')
      } else if (node.kind === 'wave') {
        // Solid rectangle for wave nodes
        nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        nodeShape.setAttribute('x', '-8')
        nodeShape.setAttribute('y', '-8')
        nodeShape.setAttribute('width', '16')
        nodeShape.setAttribute('height', '16')
        nodeShape.setAttribute('fill', '#60a5fa')
        nodeShape.setAttribute('stroke', '#0b0f14')
        nodeShape.setAttribute('stroke-width', '1.2')
      } else if (node.kind === 'archetype') {
        // Filled square for archetype nodes
        nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        nodeShape.setAttribute('x', '-8')
        nodeShape.setAttribute('y', '-8')
        nodeShape.setAttribute('width', '16')
        nodeShape.setAttribute('height', '16')
        nodeShape.setAttribute('fill', color)
        nodeShape.setAttribute('stroke', '#0b0f14')
        nodeShape.setAttribute('stroke-width', '1.2')
      } else if (node.kind === 'philosophy') {
        // Filled diamond for philosophy nodes
        nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        nodeShape.setAttribute('x', '-6')
        nodeShape.setAttribute('y', '-6')
        nodeShape.setAttribute('width', '12')
        nodeShape.setAttribute('height', '12')
        nodeShape.setAttribute('fill', color)
        nodeShape.setAttribute('stroke', '#0b0f14')
        nodeShape.setAttribute('stroke-width', '1.2')
        nodeShape.setAttribute('transform', 'rotate(45)')
      } else {
        // Circle for religion nodes
        nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        nodeShape.setAttribute('r', '7')
        nodeShape.setAttribute('fill', color)
        nodeShape.setAttribute('stroke', '#0b0f14')
        nodeShape.setAttribute('stroke-width', '1.2')
      }

      nodeShape.setAttribute('class', 'graph-node')
      nodeGroup.appendChild(nodeShape)
      nodesContainer.appendChild(nodeGroup)

      // Create label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      label.setAttribute('data-label-id', node.id)
      label.setAttribute('x', (node.x || 0).toString())
      label.setAttribute('y', ((node.y || 0) + 15).toString())
      label.setAttribute('text-anchor', 'middle')
      label.setAttribute('class', 'graph-label')
      label.textContent = node.label

      labelsContainer.appendChild(label)
    })
  }

  function updateState(state: GraphState): void {
    currentState = state
    simulation.setFocus(state.perspective, state.wavePerspective)
    simulation.setMetric(state.metric)

    // Update search highlighting
    if (state.searchQuery !== searchQuery) {
      searchQuery = state.searchQuery
      highlightSearch(searchQuery)
    }
  }

  function setTransform(transform: Transform): void {
    currentTransform = { ...transform }
    applyTransform()
    eventEmitter.emit('transform', currentTransform)
  }

  function getTransform(): Transform {
    return { ...currentTransform }
  }

  function applyTransform(): void {
    scene.setAttribute('transform',
      `translate(${currentTransform.x},${currentTransform.y}) scale(${currentTransform.k})`
    )
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  function highlightSearch(query: string): void {
    searchQuery = query.toLowerCase()

    // Update label highlighting
    const labelElements = svg.querySelectorAll('[data-labels] text')
    labelElements.forEach(label => {
      const nodeId = label.getAttribute('data-node-id')
      if (nodeId) {
        const node = currentNodes.find(n => n.id === nodeId)
        if (node) {
          const isMatch = node.label.toLowerCase().includes(searchQuery)
          const labelRef = labelRefs.get(nodeId)
          if (labelRef?.setHighlight) {
            labelRef.setHighlight(isMatch)
          }
        }
      }
    })
  }

  function resetHighlight(): void {
    searchQuery = ''

    // Reset all label highlighting
    labelRefs.forEach(labelRef => {
      if (labelRef?.setHighlight) {
        labelRef.setHighlight(false)
      }
    })
  }

  // Animation loop to update positions
  function animationLoop(): void {
    currentNodes = simulation.getNodes()

    // Update node positions
    let updatedCount = 0
    currentNodes.forEach(node => {
      const nodeRef = nodeRefs.get(node.id)
      if (nodeRef?.updatePosition) {
        nodeRef.updatePosition(node.x, node.y)
        updatedCount++
      } else {
        // Try direct DOM manipulation as fallback
        const nodeElement = svg.querySelector(`[data-node-id="${node.id}"]`) as SVGGElement
        if (nodeElement) {
          nodeElement.setAttribute('transform', `translate(${node.x},${node.y})`)
          updatedCount++
        }
      }

      const labelRef = labelRefs.get(node.id)
      if (labelRef?.updatePosition) {
        labelRef.updatePosition(node.x, node.y)
      } else {
        // Try direct DOM manipulation for labels too
        const labelElement = svg.querySelector(`[data-label-id="${node.id}"]`) as SVGTextElement
        if (labelElement) {
          labelElement.setAttribute('x', node.x.toString())
          labelElement.setAttribute('y', (node.y + 15).toString())
        }
      }
    })


    // Update edge positions
    currentEdges.forEach(edge => {
      const sourceNode = currentNodes.find(n => n.id === edge.source)
      const targetNode = currentNodes.find(n => n.id === edge.target)

      if (sourceNode && targetNode) {
        const edgeKey = `${edge.source}-${edge.target}`
        const edgeRef = edgeRefs.get(edgeKey)
        if (edgeRef?.updatePosition) {
          edgeRef.updatePosition(sourceNode, targetNode)
        } else {
          // Try direct DOM manipulation as fallback
          const edgeElement = svg.querySelector(`[data-edge-source="${edge.source}"][data-edge-target="${edge.target}"]`) as SVGLineElement
          if (edgeElement) {
            edgeElement.setAttribute('x1', sourceNode.x.toString())
            edgeElement.setAttribute('y1', sourceNode.y.toString())
            edgeElement.setAttribute('x2', targetNode.x.toString())
            edgeElement.setAttribute('y2', targetNode.y.toString())
          }
        }
      }
    })

    requestAnimationFrame(animationLoop)
  }

  // Event handlers
  function handleMouseDown(e: MouseEvent): void {
    isDragging = true
    lastPointer = { x: e.clientX, y: e.clientY }
    svg.style.cursor = 'grabbing'
  }

  function handleMouseMove(e: MouseEvent): void {
    if (!isDragging) return

    const dx = e.clientX - lastPointer.x
    const dy = e.clientY - lastPointer.y

    currentTransform.x += dx
    currentTransform.y += dy

    lastPointer = { x: e.clientX, y: e.clientY }
    applyTransform()
  }

  function handleMouseUp(): void {
    isDragging = false
    svg.style.cursor = 'grab'
    eventEmitter.emit('transform', currentTransform)
  }

  function handleWheel(e: WheelEvent): void {
    e.preventDefault()
    const scale = Math.exp(-e.deltaY * 0.001)
    currentTransform.k = clamp(currentTransform.k * scale, 0.2, 8)
    applyTransform()
    eventEmitter.emit('transform', currentTransform)
  }

  function handleNodeClick(e: CustomEvent): void {
    eventEmitter.emit('nodeClick', e.detail)
  }

  function handleEdgeClick(e: CustomEvent): void {
    eventEmitter.emit('edgeClick', e.detail)
  }

  // Touch event handlers
  function getTouchCenter(touches: TouchList): { x: number, y: number } {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY }
    } else if (touches.length === 2) {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
      }
    }
    return { x: 0, y: 0 }
  }

  function getTouchDistance(touches: TouchList): number {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function handleTouchStart(e: TouchEvent): void {
    e.preventDefault()
    isDragging = true

    if (e.touches.length === 1) {
      // Single touch - pan
      lastPointer = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      lastTouchCenter = getTouchCenter(e.touches)
      lastTouchDistance = getTouchDistance(e.touches)
    }

    svg.style.cursor = 'grabbing'
  }

  function handleTouchMove(e: TouchEvent): void {
    e.preventDefault()
    if (!isDragging) return

    if (e.touches.length === 1) {
      // Single touch - pan
      const dx = e.touches[0].clientX - lastPointer.x
      const dy = e.touches[0].clientY - lastPointer.y

      currentTransform.x += dx
      currentTransform.y += dy

      lastPointer = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      applyTransform()
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      const touchCenter = getTouchCenter(e.touches)
      const touchDistance = getTouchDistance(e.touches)

      if (lastTouchDistance > 0) {
        const scale = touchDistance / lastTouchDistance
        currentTransform.k = clamp(currentTransform.k * scale, 0.2, 8)
      }

      // Pan based on center movement
      const dx = touchCenter.x - lastTouchCenter.x
      const dy = touchCenter.y - lastTouchCenter.y
      currentTransform.x += dx
      currentTransform.y += dy

      lastTouchCenter = touchCenter
      lastTouchDistance = touchDistance
      applyTransform()
    }
  }

  function handleTouchEnd(e: TouchEvent): void {
    e.preventDefault()
    isDragging = false
    svg.style.cursor = 'grab'
    lastTouchDistance = 0
    eventEmitter.emit('transform', currentTransform)
  }

  function updateDimensions(width: number, height: number): void {
    // Update SVG viewBox
    const viewBox = `${-width/2} ${-height/2} ${width} ${height}`
    svg.setAttribute('viewBox', viewBox)

    // Update simulation config
    simulation.updateConfig({
      width,
      height,
      centerX: 0,
      centerY: 0
    })
  }

  function resetLayout(): void {
    simulation.resetLayout()
  }

  // Event listeners
  svg.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  svg.addEventListener('wheel', handleWheel, { passive: false })

  // Touch event listeners
  svg.addEventListener('touchstart', handleTouchStart, { passive: false })
  svg.addEventListener('touchmove', handleTouchMove, { passive: false })
  svg.addEventListener('touchend', handleTouchEnd, { passive: false })

  el.addEventListener('viz-node-click', handleNodeClick as EventListener)
  el.addEventListener('viz-edge-click', handleEdgeClick as EventListener)

  // Initialize
  updateGraph(props.nodes, props.edges)
  applyTransform()
  requestAnimationFrame(animationLoop)

  return {
    updateGraph,
    updateState,
    setTransform,
    getTransform,
    highlightSearch,
    resetHighlight,
    updateDimensions,
    resetLayout,
    release: () => {
      simulation.destroy()
      svg.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      svg.removeEventListener('wheel', handleWheel)

      // Remove touch event listeners
      svg.removeEventListener('touchstart', handleTouchStart)
      svg.removeEventListener('touchmove', handleTouchMove)
      svg.removeEventListener('touchend', handleTouchEnd)

      el.removeEventListener('viz-node-click', handleNodeClick as EventListener)
      el.removeEventListener('viz-edge-click', handleEdgeClick as EventListener)
    }
  }
}

const id = { id: "fractal/svg-visualization" }

const SVGVisualization = createBlueprint<SVGVisualizationProps, SVGVisualizationEvents, SVGVisualizationLogic>(
  id,
  render,
  { bind }
)

export default SVGVisualization