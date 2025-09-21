import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"

export interface SearchInputEvents extends BaseComponentEvents {
  search: (query: string) => void
  clear: () => void
}

export interface SearchInputLogic {
  setValue: (value: string) => void
  getValue: () => string
  clear: () => void
  focus: () => void
}

export interface SearchInputProps {
  placeholder?: string
  value?: string
  'on:search'?: (el: HTMLElement, query: string) => void
  'on:clear'?: (el: HTMLElement) => void
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

function render(props: BaseProps<SearchInputProps>) {
  const {
    placeholder = "Search nodes...",
    value = "",
    ...moreProps
  } = props

  return (
    <input
      type="search"
      placeholder={placeholder}
      value={value}
      class="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
      data-search-input
      {...renderProps(moreProps)}
    />
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<SearchInputEvents>,
  props: BaseProps<SearchInputProps>
): BindReturn<SearchInputLogic> {
  const input = el as HTMLInputElement
  let debounceTimeout: number | null = null

  function setValue(value: string): void {
    input.value = value
    handleSearch(value)
  }

  function getValue(): string {
    return input.value
  }

  function clear(): void {
    input.value = ""
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
    eventEmitter.emit('clear')
  }

  function focus(): void {
    input.focus()
  }

  function handleSearch(query: string): void {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }

    debounceTimeout = setTimeout(() => {
      eventEmitter.emit('search', query.trim())
    }, 300) as any
  }

  function handleInput(e: Event): void {
    const target = e.target as HTMLInputElement
    handleSearch(target.value)
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      clear()
    }
  }

  // Event listeners
  input.addEventListener('input', handleInput)
  input.addEventListener('keydown', handleKeydown)

  // Set initial value if provided
  if (props.value) {
    input.value = props.value
  }

  return {
    setValue,
    getValue,
    clear,
    focus,
    release: () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
      input.removeEventListener('input', handleInput)
      input.removeEventListener('keydown', handleKeydown)
    }
  }
}

const id = { id: "fractal/search-input" }

const SearchInput = createBlueprint<SearchInputProps, SearchInputEvents, SearchInputLogic>(
  id,
  render,
  { bind }
)

export default SearchInput