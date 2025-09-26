import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"
import type { LegendItem } from "../types/fractal-types.js"

export interface LegendEvents extends BaseComponentEvents {
  // No custom events for legend - it's display only
}

export interface LegendLogic {
  updateItems: (items: LegendItem[]) => void
}

export interface LegendProps {
  items: LegendItem[]
  columns?: number
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

function renderLegendShape(item: LegendItem): JSX.Element {
  switch (item.shape) {
    case 'dot':
      return (
        <span
          class="w-3 h-3 rounded-full border border-gray-500"
          style={`background-color: ${item.color || '#9ca3af'}`}
        ></span>
      )
    case 'hex':
      return (
        <span class="relative inline-block w-3 h-3">
          <span
            class="absolute w-3 h-3"
            style={`
              background-color: ${item.color || '#9ca3af'};
              clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
              left: 0;
              top: 0;
            `}
          ></span>
        </span>
      )
    case 'wave':
      return (
        <span class="w-4 h-4 border border-dashed border-blue-400 rounded-sm"></span>
      )
    case 'square':
      return (
        <span
          class="w-3 h-3 border border-gray-500"
          style={`background-color: ${item.color || '#60a5fa'}`}
        ></span>
      )
    case 'triangle':
      return (
        <span class="relative inline-block w-3 h-3">
          <span
            class="absolute"
            style={`
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-bottom: 10px solid ${item.color || '#d97706'};
              left: 0;
              top: 1px;
            `}
          ></span>
        </span>
      )
    case 'diamond':
      return (
        <span class="relative inline-block w-3 h-3">
          <span
            class="absolute w-3 h-3"
            style={`
              background-color: ${item.color || '#6d28d9'};
              transform: rotate(45deg);
              left: 0;
              top: 0;
            `}
          ></span>
        </span>
      )
    default:
      return (
        <span
          class="w-3 h-3 rounded-full border border-gray-500"
          style={`background-color: ${item.color || '#9ca3af'}`}
        ></span>
      )
  }
}

function render(props: BaseProps<LegendProps>) {
  const {
    items = [],
    columns = 3,
    ...moreProps
  } = props

  const gridCols = `grid-cols-${columns}`

  const legendElements = items.map(item => (
    <span class="flex items-center gap-2 text-xs text-gray-300 whitespace-nowrap">
      {renderLegendShape(item)}
      <span>{item.label}</span>
    </span>
  ))

  return (
    <div
      class={`grid ${gridCols} gap-x-3 gap-y-2`}
      data-legend
      {...renderProps(moreProps)}
    >
      {legendElements}
    </div>
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<LegendEvents>,
  props: BaseProps<LegendProps>
): BindReturn<LegendLogic> {
  const container = el as HTMLElement

  function updateItems(items: LegendItem[]): void {
    // Clear existing items
    container.innerHTML = ''

    // Add new items
    const columns = props.columns || 3
    const gridCols = `grid-cols-${columns}`
    container.className = `grid ${gridCols} gap-x-3 gap-y-2`

    items.forEach(item => {
      const itemElement = document.createElement('span')
      itemElement.className = 'flex items-center gap-2 text-xs text-gray-300 whitespace-nowrap'

      // Create shape element
      const shapeElement = document.createElement('span')
      switch (item.shape) {
        case 'dot':
          shapeElement.className = 'w-3 h-3 rounded-full border border-gray-500'
          shapeElement.style.backgroundColor = item.color || '#9ca3af'
          break
        case 'hex':
          // For simplicity in DOM manipulation, use a square for hex
          shapeElement.className = 'w-3 h-3 border border-gray-500'
          shapeElement.style.backgroundColor = item.color || '#9ca3af'
          shapeElement.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          break
        case 'wave':
          shapeElement.className = 'w-4 h-4 border border-dashed border-blue-400 rounded-sm'
          break
        case 'square':
          shapeElement.className = 'w-3 h-3 border border-gray-500'
          shapeElement.style.backgroundColor = item.color || '#60a5fa'
          break
        case 'triangle':
          shapeElement.className = 'w-3 h-3'
          shapeElement.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)'
          shapeElement.style.backgroundColor = item.color || '#d97706'
          break
        case 'diamond':
          shapeElement.className = 'w-3 h-3'
          shapeElement.style.transform = 'rotate(45deg)'
          shapeElement.style.backgroundColor = item.color || '#6d28d9'
          break
        default:
          shapeElement.className = 'w-3 h-3 rounded-full border border-gray-500'
          shapeElement.style.backgroundColor = item.color || '#9ca3af'
      }

      // Create label element
      const labelElement = document.createElement('span')
      labelElement.textContent = item.label

      itemElement.appendChild(shapeElement)
      itemElement.appendChild(labelElement)
      container.appendChild(itemElement)
    })
  }

  return {
    updateItems,
    release: () => {
      // No cleanup needed for legend
    }
  }
}

const id = { id: "fractal/legend" }

const Legend = createBlueprint<LegendProps, LegendEvents, LegendLogic>(
  id,
  render,
  { bind }
)

export default Legend