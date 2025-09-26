import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"
import { getNodeColor } from "../utils/data-loader.js"
import type { SimulationNode } from "../types/fractal-types.js"

export interface GraphNodeEvents extends BaseComponentEvents {
  click: (nodeId: string) => void
}

export interface GraphNodeLogic {
  updatePosition: (x: number, y: number) => void
  setVisibility: (visible: boolean) => void
  setHighlight: (highlighted: boolean) => void
}

export interface GraphNodeProps {
  node: SimulationNode
  isVisible?: boolean
  isHighlighted?: boolean
  'on:click'?: (el: HTMLElement, nodeId: string) => void
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

function render(props: BaseProps<GraphNodeProps>) {
  const {
    node,
    isVisible = true,
    isHighlighted = false,
    ...moreProps
  } = props

  const transform = `translate(${node.x},${node.y})`
  const color = getNodeColor(node.group)


  let shape: JSX.Element

  if (node.kind === 'science') {
    // Circle for science nodes
    shape = (
      <circle
        r="7"
        fill={color}
        stroke="#0b0f14"
        stroke-width="1.2"
      />
    )
  } else if (node.kind === 'wave') {
    // Dashed rectangle for wave nodes
    shape = (
      <rect
        x="-8"
        y="-8"
        width="16"
        height="16"
        fill="none"
        stroke={color}
        stroke-width="1.2"
        stroke-dasharray="3 3"
      />
    )
  } else if (node.kind === 'archetype') {
    // Filled square for archetype nodes (to test)
    shape = (
      <rect
        x="-8"
        y="-8"
        width="16"
        height="16"
        fill={color}
        stroke="#0b0f14"
        stroke-width="1.2"
      />
    )
  } else if (node.kind === 'philosophy') {
    // Filled diamond for philosophy nodes (to test)
    shape = (
      <rect
        x="-6"
        y="-6"
        width="12"
        height="12"
        fill={color}
        stroke="#0b0f14"
        stroke-width="1.2"
        transform="rotate(45)"
      />
    )
  } else {
    // Circle for religion nodes
    shape = (
      <circle
        r="7"
        fill={color}
        stroke="#0b0f14"
        stroke-width="1.2"
      />
    )
  }

  return (
    <g
      class={`cursor-pointer ${isHighlighted ? 'opacity-100' : 'opacity-90'}`}
      transform={transform}
      style={`display: ${isVisible ? 'block' : 'none'}`}
      data-node-id={node.id}
      {...renderProps(moreProps)}
    >
      {shape}
    </g>
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<GraphNodeEvents>,
  props: BaseProps<GraphNodeProps>
): BindReturn<GraphNodeLogic> {
  const nodeGroup = el as unknown as SVGGElement

  function updatePosition(x: number, y: number): void {
    nodeGroup.setAttribute('transform', `translate(${x},${y})`)
  }

  function setVisibility(visible: boolean): void {
    nodeGroup.style.display = visible ? 'block' : 'none'
  }

  function setHighlight(highlighted: boolean): void {
    nodeGroup.classList.toggle('opacity-100', highlighted)
    nodeGroup.classList.toggle('opacity-90', !highlighted)
  }

  function handleClick(e: Event): void {
    e.stopPropagation()
    eventEmitter.emit('click', props.node.id)
  }

  // Event listeners
  nodeGroup.addEventListener('click', handleClick)

  return {
    updatePosition,
    setVisibility,
    setHighlight,
    release: () => {
      nodeGroup.removeEventListener('click', handleClick)
    }
  }
}

const id = { id: "fractal/graph-node" }

const GraphNode = createBlueprint<GraphNodeProps, GraphNodeEvents, GraphNodeLogic>(
  id,
  render,
  { bind }
)

export default GraphNode