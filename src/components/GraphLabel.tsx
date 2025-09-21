import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"
import type { SimulationNode } from "../types/fractal-types.js"

export interface GraphLabelEvents extends BaseComponentEvents {
  // No custom events for labels
}

export interface GraphLabelLogic {
  updatePosition: (x: number, y: number) => void
  setVisibility: (visible: boolean) => void
  setHighlight: (highlighted: boolean) => void
}

export interface GraphLabelProps {
  node: SimulationNode
  isVisible?: boolean
  isHighlighted?: boolean
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

function render(props: BaseProps<GraphLabelProps>) {
  const {
    node,
    isVisible = true,
    isHighlighted = false,
    ...moreProps
  } = props

  const x = node.x + 12
  const y = node.y + 4

  return (
    <text
      class={`text-xs pointer-events-none ${
        isHighlighted ? 'font-bold underline' : 'font-normal'
      }`}
      x={x}
      y={y}
      style={`display: ${isVisible ? 'block' : 'none'}; fill: #e5e7eb; text-shadow: 0 0 3px rgba(0,0,0,0.6)`}
      data-label-id={node.id}
      {...renderProps(moreProps)}
    >
      {node.label}
    </text>
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<GraphLabelEvents>,
  props: BaseProps<GraphLabelProps>
): BindReturn<GraphLabelLogic> {
  const text = el as unknown as SVGTextElement

  function updatePosition(x: number, y: number): void {
    text.setAttribute('x', (x + 12).toString())
    text.setAttribute('y', (y + 4).toString())
  }

  function setVisibility(visible: boolean): void {
    text.style.display = visible ? 'block' : 'none'
  }

  function setHighlight(highlighted: boolean): void {
    if (highlighted) {
      text.classList.add('font-bold', 'underline')
      text.classList.remove('font-normal')
    } else {
      text.classList.add('font-normal')
      text.classList.remove('font-bold', 'underline')
    }
  }

  return {
    updatePosition,
    setVisibility,
    setHighlight,
    release: () => {
      // No cleanup needed for text elements
    }
  }
}

const id = { id: "fractal/graph-label" }

const GraphLabel = createBlueprint<GraphLabelProps, GraphLabelEvents, GraphLabelLogic>(
  id,
  render,
  { bind }
)

export default GraphLabel