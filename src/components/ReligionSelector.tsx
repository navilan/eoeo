import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"

export interface ReligionSelectorEvents extends BaseComponentEvents {
  change: (religions: Record<string, boolean>) => void
}

export interface ReligionSelectorLogic {
  setReligions: (religions: Record<string, boolean>) => void
  getReligions: () => Record<string, boolean>
}

export interface ReligionOption {
  id: string
  label: string
  color: string
}

export interface ReligionSelectorProps {
  religions: Record<string, boolean>
  options: ReligionOption[]
  'on:change'?: (el: HTMLElement, religions: Record<string, boolean>) => void
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

function render(props: BaseProps<ReligionSelectorProps>) {
  const {
    religions = {},
    options = [],
    ...moreProps
  } = props

  const allSelected = options.every(option => religions[option.id] !== false)
  const someSelected = options.some(option => religions[option.id] !== false)
  const selectedCount = options.filter(option => religions[option.id] !== false).length

  return (
    <div class="relative" {...renderProps(moreProps)}>
      <button
        type="button"
        class="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-100 flex justify-between items-center"
        data-religion-button
      >
        <span class="flex items-center gap-2">
          <span>Religions</span>
          <span class="text-xs text-gray-400">({selectedCount}/{options.length})</span>
        </span>
        <span class="select-button-arrow" data-chevron>▼</span>
      </button>

      <div
        class="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 p-3 space-y-2 hidden"
        data-religion-popup
      >
        {/* All/None controls */}
        <div class="flex gap-2 pb-2 border-b border-gray-600">
          <button
            type="button"
            class="flex-1 px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
            data-select-all
          >
            All
          </button>
          <button
            type="button"
            class="flex-1 px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
            data-select-none
          >
            None
          </button>
        </div>

        {/* Individual religion toggles */}
        <div class="space-y-1">
          {options.map(option => (
            <label class="flex items-center gap-2 p-1 hover:bg-gray-700 rounded cursor-pointer">
              <input
                type="checkbox"
                class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                checked={religions[option.id] !== false}
                data-religion-checkbox={option.id}
              />
              <div
                class="w-3 h-3 rounded-full"
                style={`background-color: ${option.color}`}
              />
              <span class="text-sm text-gray-200 flex-1">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<ReligionSelectorEvents>,
  props: BaseProps<ReligionSelectorProps>
): BindReturn<ReligionSelectorLogic> {
  const button = el.querySelector('[data-religion-button]') as HTMLButtonElement
  const popup = el.querySelector('[data-religion-popup]') as HTMLElement
  const chevron = el.querySelector('[data-chevron]') as HTMLElement
  const selectAllBtn = el.querySelector('[data-select-all]') as HTMLButtonElement
  const selectNoneBtn = el.querySelector('[data-select-none]') as HTMLButtonElement

  let currentReligions = { ...props.religions }
  let isOpen = false

  function togglePopup(): void {
    isOpen = !isOpen
    if (popup) {
      popup.classList.toggle('hidden', !isOpen)
    }
    if (chevron) {
      chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
    }
  }

  function closePopup(): void {
    isOpen = false
    if (popup) {
      popup.classList.add('hidden')
    }
    if (chevron) {
      chevron.style.transform = 'rotate(0deg)'
    }
  }

  function emitChange(): void {
    eventEmitter.emit('change', { ...currentReligions })
  }

  function setReligions(religions: Record<string, boolean>): void {
    currentReligions = { ...religions }

    // Update checkboxes
    props.options.forEach(option => {
      const checkbox = el.querySelector(`[data-religion-checkbox="${option.id}"]`) as HTMLInputElement
      if (checkbox) {
        checkbox.checked = religions[option.id] !== false
      }
    })

    // Update button text
    const selectedCount = props.options.filter(option => religions[option.id] !== false).length
    const buttonText = button.querySelector('span')
    if (buttonText) {
      buttonText.innerHTML = `Religions <span class="text-xs text-gray-400">(${selectedCount}/${props.options.length})</span>`
    }
  }

  function getReligions(): Record<string, boolean> {
    return { ...currentReligions }
  }

  // Event listeners
  button?.addEventListener('click', (e) => {
    e.stopPropagation()
    togglePopup()
  })

  selectAllBtn?.addEventListener('click', () => {
    const allTrue: Record<string, boolean> = {}
    props.options.forEach(option => {
      allTrue[option.id] = true
    })
    setReligions(allTrue)
    currentReligions = allTrue
    emitChange()
  })

  selectNoneBtn?.addEventListener('click', () => {
    const allFalse: Record<string, boolean> = {}
    props.options.forEach(option => {
      allFalse[option.id] = false
    })
    setReligions(allFalse)
    currentReligions = allFalse
    emitChange()
  })

  // Individual checkbox listeners
  props.options.forEach(option => {
    const checkbox = el.querySelector(`[data-religion-checkbox="${option.id}"]`) as HTMLInputElement
    checkbox?.addEventListener('change', () => {
      currentReligions[option.id] = checkbox.checked
      setReligions(currentReligions)
      emitChange()
    })
  })

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!el.contains(e.target as Node)) {
      closePopup()
    }
  })

  return {
    setReligions,
    getReligions,
    release: () => {
      // Cleanup listeners if needed
    }
  }
}

const id = { id: "fractal/religion-selector" }

const ReligionSelector = createBlueprint<ReligionSelectorProps, ReligionSelectorEvents, ReligionSelectorLogic>(
  id,
  render,
  { bind }
)

export default ReligionSelector