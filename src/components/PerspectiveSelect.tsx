import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"
import Select, { type SelectItem } from "@duct-ui/components/dropdown/select"
import { getGlobalAppState } from "../utils/app-state.js"
import type { PerspectiveOption } from "../types/fractal-types.js"

export interface PerspectiveSelectEvents extends BaseComponentEvents {
  change: (perspective: string) => void
}

export interface PerspectiveSelectLogic {
  setValue: (value: string) => void
  getValue: () => string
}

export interface PerspectiveSelectProps {
  label: string
  options: PerspectiveOption[]
  value: string
  'on:change'?: (el: HTMLElement, perspective: string) => void
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

function render(props: BaseProps<PerspectiveSelectProps>) {
  const {
    label,
    options = [],
    value,
    ...moreProps
  } = props

  // Convert perspective options to select items
  const selectItems: SelectItem[] = options.map(option => ({
    label: option.label,
    isSelected: option.value === value,
    attributes: { 'data-value': option.value }
  }))

  return (
    <div class="space-y-2" {...renderProps(moreProps)}>
      <label class="text-sm font-medium text-gray-300 block">
        {label}:
      </label>
      <Select
        items={selectItems}
        buttonClass="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-100 flex justify-between items-center"
        menuClass="menu bg-gray-800 border border-gray-600 rounded-lg shadow-lg mt-1 w-full min-w-max z-50 p-2"
        itemClass=""
        labelClass="font-medium text-gray-100"
        selectedIconClass="w-4 h-4 mr-2"
        data-perspective-select
        on:selectionChange={(el: HTMLElement, item: SelectItem, index: number) => {
          const selectValue = item.attributes?.['data-value'] || options[index]?.value
          if (selectValue) {
            // Determine if this is main perspective or wave perspective based on label
            const appState = getGlobalAppState()
            if (label.toLowerCase().includes('wave')) {
              appState.setWavePerspective(selectValue)
            } else {
              appState.setPerspective(selectValue)
            }
          }
        }}
      />
    </div>
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<PerspectiveSelectEvents>,
  props: BaseProps<PerspectiveSelectProps>
): BindReturn<PerspectiveSelectLogic> {
  const selectElement = el.querySelector('[data-perspective-select]') as HTMLElement
  let currentValue = props.value

  function setValue(value: string): void {
    currentValue = value
    // Find the option and update the select
    const optionIndex = props.options.findIndex(opt => opt.value === value)
    if (optionIndex >= 0 && selectElement) {
      // Get the select logic and update it
      const selectLogic = (window as any).Duct?.getLogic(selectElement)
      if (selectLogic?.selectItem) {
        selectLogic.selectItem(optionIndex)
      }
    }
    eventEmitter.emit('change', value)
  }

  function getValue(): string {
    return currentValue
  }

  function handlePerspectiveChange(e: CustomEvent): void {
    const newValue = e.detail
    if (newValue !== currentValue) {
      currentValue = newValue
      eventEmitter.emit('change', newValue)
    }
  }

  // Event listeners
  el.addEventListener('perspective-change', handlePerspectiveChange as EventListener)

  return {
    setValue,
    getValue,
    release: () => {
      el.removeEventListener('perspective-change', handlePerspectiveChange as EventListener)
    }
  }
}

const id = { id: "fractal/perspective-select" }

const PerspectiveSelect = createBlueprint<PerspectiveSelectProps, PerspectiveSelectEvents, PerspectiveSelectLogic>(
  id,
  render,
  { bind }
)

export default PerspectiveSelect