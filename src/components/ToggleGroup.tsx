import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"

export interface ToggleItem {
  id: string
  label: string
  checked: boolean
}

export interface ToggleGroupEvents extends BaseComponentEvents {
  change: (toggleId: string, checked: boolean) => void
}

export interface ToggleGroupLogic {
  setToggle: (toggleId: string, checked: boolean) => void
  getToggle: (toggleId: string) => boolean
  setAll: (checked: boolean) => void
}

export interface ToggleGroupProps {
  items: ToggleItem[]
  columns?: number
  'on:change'?: (el: HTMLElement, toggleId: string, checked: boolean) => void
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

function render(props: BaseProps<ToggleGroupProps>) {
  const {
    items = [],
    columns = 3,
    ...moreProps
  } = props

  const gridCols = `grid-cols-${columns}`

  const toggleElements = items.map(item => (
    <label class="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={item.checked}
        data-toggle-id={item.id}
        class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
      />
      <span class="text-gray-300">{item.label}</span>
    </label>
  ))

  return (
    <div
      class={`grid ${gridCols} gap-2`}
      data-toggle-group
      {...renderProps(moreProps)}
    >
      {toggleElements}
    </div>
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<ToggleGroupEvents>,
  props: BaseProps<ToggleGroupProps>
): BindReturn<ToggleGroupLogic> {
  const container = el as HTMLElement

  function setToggle(toggleId: string, checked: boolean): void {
    const checkbox = container.querySelector(`[data-toggle-id="${toggleId}"]`) as HTMLInputElement
    if (checkbox) {
      checkbox.checked = checked
      eventEmitter.emit('change', toggleId, checked)
    }
  }

  function getToggle(toggleId: string): boolean {
    const checkbox = container.querySelector(`[data-toggle-id="${toggleId}"]`) as HTMLInputElement
    return checkbox ? checkbox.checked : false
  }

  function setAll(checked: boolean): void {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>
    checkboxes.forEach(checkbox => {
      const toggleId = checkbox.getAttribute('data-toggle-id')
      if (toggleId) {
        checkbox.checked = checked
        eventEmitter.emit('change', toggleId, checked)
      }
    })
  }

  function handleChange(e: Event): void {
    const target = e.target as HTMLInputElement
    if (target.type === 'checkbox') {
      const toggleId = target.getAttribute('data-toggle-id')
      if (toggleId) {
        eventEmitter.emit('change', toggleId, target.checked)
      }
    }
  }

  // Event listeners
  container.addEventListener('change', handleChange)

  return {
    setToggle,
    getToggle,
    setAll,
    release: () => {
      container.removeEventListener('change', handleChange)
    }
  }
}

const id = { id: "fractal/toggle-group" }

const ToggleGroup = createBlueprint<ToggleGroupProps, ToggleGroupEvents, ToggleGroupLogic>(
  id,
  render,
  { bind }
)

export default ToggleGroup