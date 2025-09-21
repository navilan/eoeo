import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"
import type { Edge, SimulationNode } from "../types/fractal-types.js"

export interface GraphEdgeEvents extends BaseComponentEvents {
  click: (edge: Edge) => void
}

export interface GraphEdgeLogic {
  updatePosition: (sourceNode: SimulationNode, targetNode: SimulationNode) => void
  setVisibility: (visible: boolean) => void
  setSpineHighlight: (isSpine: boolean) => void
}

export interface GraphEdgeProps {
  edge: Edge
  sourceNode: SimulationNode
  targetNode: SimulationNode
  isVisible?: boolean
  isSpine?: boolean
  'on:click'?: (el: HTMLElement, edge: Edge) => void
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

function render(props: BaseProps<GraphEdgeProps>) {
  const {
    edge,
    sourceNode,
    targetNode,
    isVisible = true,
    isSpine = false,
    ...moreProps
  } = props

  let stroke = ''
  let strokeOpacity = ''
  let strokeWidth = ''
  let strokeDasharray = ''

  if (isSpine) {
    stroke = '#fcd34d'
    strokeOpacity = '0.95'
    strokeWidth = '2.2'
  } else {
    switch (edge.type) {
      case 'cross':
        stroke = '#c084fc'
        strokeOpacity = '0.70'
        strokeWidth = '1.2'
        strokeDasharray = '3 3'
        break
      case 'wave':
        stroke = '#60a5fa'
        strokeOpacity = '0.65'
        strokeWidth = '1.2'
        strokeDasharray = '1 4'
        break
      case 'lineage':
      default:
        stroke = '#9ca3af'
        strokeOpacity = '0.50'
        strokeWidth = '1.2'
        break
    }
  }

  return (
    <line
      class="cursor-pointer"
      x1={sourceNode.x}
      y1={sourceNode.y}
      x2={targetNode.x}
      y2={targetNode.y}
      stroke={stroke}
      stroke-opacity={strokeOpacity}
      stroke-width={strokeWidth}
      stroke-dasharray={strokeDasharray}
      style={`display: ${isVisible ? 'block' : 'none'}`}
      data-edge-source={edge.source}
      data-edge-target={edge.target}
      data-edge-type={edge.type}
      {...renderProps(moreProps)}
    />
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<GraphEdgeEvents>,
  props: BaseProps<GraphEdgeProps>
): BindReturn<GraphEdgeLogic> {
  const line = el as unknown as SVGLineElement

  function updatePosition(sourceNode: SimulationNode, targetNode: SimulationNode): void {
    line.setAttribute('x1', sourceNode.x.toString())
    line.setAttribute('y1', sourceNode.y.toString())
    line.setAttribute('x2', targetNode.x.toString())
    line.setAttribute('y2', targetNode.y.toString())
  }

  function setVisibility(visible: boolean): void {
    line.style.display = visible ? 'block' : 'none'
  }

  function setSpineHighlight(isSpine: boolean): void {
    if (isSpine) {
      line.setAttribute('stroke', '#fcd34d')
      line.setAttribute('stroke-opacity', '0.95')
      line.setAttribute('stroke-width', '2.2')
      line.setAttribute('stroke-dasharray', '')
    } else {
      // Reset to default styling based on edge type
      switch (props.edge.type) {
        case 'cross':
          line.setAttribute('stroke', '#c084fc')
          line.setAttribute('stroke-opacity', '0.70')
          line.setAttribute('stroke-width', '1.2')
          line.setAttribute('stroke-dasharray', '3 3')
          break
        case 'wave':
          line.setAttribute('stroke', '#60a5fa')
          line.setAttribute('stroke-opacity', '0.65')
          line.setAttribute('stroke-width', '1.2')
          line.setAttribute('stroke-dasharray', '1 4')
          break
        case 'lineage':
        default:
          line.setAttribute('stroke', '#9ca3af')
          line.setAttribute('stroke-opacity', '0.50')
          line.setAttribute('stroke-width', '1.2')
          line.setAttribute('stroke-dasharray', '')
          break
      }
    }
  }

  function handleClick(e: Event): void {
    e.stopPropagation()
    eventEmitter.emit('click', props.edge)
  }

  // Event listeners
  line.addEventListener('click', handleClick)

  return {
    updatePosition,
    setVisibility,
    setSpineHighlight,
    release: () => {
      line.removeEventListener('click', handleClick)
    }
  }
}

const id = { id: "fractal/graph-edge" }

const GraphEdge = createBlueprint<GraphEdgeProps, GraphEdgeEvents, GraphEdgeLogic>(
  id,
  render,
  { bind }
)

export default GraphEdge