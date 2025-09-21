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
        <span class="relative">
          <span
            class="absolute"
            style={`
              width: 0;
              height: 0;
              border-left: 7px solid transparent;
              border-right: 7px solid transparent;
              border-bottom: 12px solid ${item.color || '#9ca3af'};
              transform: translateY(2px);
            `}
          ></span>
          <span
            class="absolute"
            style={`
              width: 0;
              height: 0;
              border-left: 7px solid transparent;
              border-right: 7px solid transparent;
              border-top: 12px solid ${item.color || '#9ca3af'};
              left: -7px;
              top: 12px;
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