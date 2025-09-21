import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"

export interface CollapsibleSectionEvents extends BaseComponentEvents {
  toggle: (isOpen: boolean) => void
}

export interface CollapsibleSectionLogic {
  open: () => void
  close: () => void
  toggle: () => void
  isOpen: () => boolean
}

export interface CollapsibleSectionProps {
  title: string
  isOpen?: boolean
  children?: JSX.Element | JSX.Element[]
  'on:toggle'?: (el: HTMLElement, isOpen: boolean) => void
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

function render(props: BaseProps<CollapsibleSectionProps>) {
  const {
    title,
    isOpen = false,
    children,
    ...moreProps
  } = props

  return (
    <details
      open={isOpen}
      class="border border-gray-700 rounded-lg mb-2 bg-gray-800/50"
      data-collapsible-section
      {...renderProps(moreProps)}
    >
      <summary class="list-none cursor-pointer p-3 font-semibold text-gray-200 flex items-center gap-2 hover:bg-gray-700/50 rounded-t-lg">
        <span
          class="inline-block transform rotate-0 transition-transform duration-200 opacity-70 text-gray-400"
          data-chevron
        >
          ›
        </span>
        {title}
      </summary>
      <div class="p-3 space-y-3 border-t border-gray-700" data-content>
        {children}
      </div>
    </details>
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<CollapsibleSectionEvents>,
  props: BaseProps<CollapsibleSectionProps>
): BindReturn<CollapsibleSectionLogic> {
  const details = el as HTMLDetailsElement
  const chevron = details.querySelector('[data-chevron]') as HTMLElement
  let isCurrentlyOpen = props.isOpen || false

  function open(): void {
    if (!isCurrentlyOpen) {
      details.open = true
      isCurrentlyOpen = true
      updateChevron()
      eventEmitter.emit('toggle', true)
    }
  }

  function close(): void {
    if (isCurrentlyOpen) {
      details.open = false
      isCurrentlyOpen = false
      updateChevron()
      eventEmitter.emit('toggle', false)
    }
  }

  function toggle(): void {
    if (isCurrentlyOpen) {
      close()
    } else {
      open()
    }
  }

  function getIsOpen(): boolean {
    return isCurrentlyOpen
  }

  function updateChevron(): void {
    if (chevron) {
      chevron.style.transform = isCurrentlyOpen ? 'rotate(90deg)' : 'rotate(0deg)'
    }
  }

  function handleToggle(e: Event): void {
    // The details element handles the toggle automatically,
    // we just need to sync our state and emit events
    isCurrentlyOpen = details.open
    updateChevron()
    eventEmitter.emit('toggle', isCurrentlyOpen)
  }

  // Event listeners
  details.addEventListener('toggle', handleToggle)

  // Set initial state
  updateChevron()

  return {
    open,
    close,
    toggle,
    isOpen: getIsOpen,
    release: () => {
      details.removeEventListener('toggle', handleToggle)
    }
  }
}

const id = { id: "fractal/collapsible-section" }

const CollapsibleSection = createBlueprint<CollapsibleSectionProps, CollapsibleSectionEvents, CollapsibleSectionLogic>(
  id,
  render,
  { bind }
)

export default CollapsibleSection