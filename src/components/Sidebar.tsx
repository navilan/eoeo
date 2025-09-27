import { createBlueprint, type BindReturn, type BaseComponentEvents, type BaseProps, renderProps } from "@duct-ui/core/blueprint"
import { EventEmitter } from "@duct-ui/core/shared"
import { createRef } from "@duct-ui/core"
import CollapsibleSection from "./CollapsibleSection.js"
import PerspectiveSelect, { type PerspectiveSelectLogic } from "./PerspectiveSelect.js"
import ToggleGroup, { type ToggleGroupLogic, type ToggleItem } from "./ToggleGroup.js"
import ReligionSelector, { type ReligionSelectorLogic } from "./ReligionSelector.js"
import Legend from "./Legend.js"
import Select, { type SelectItem } from "@duct-ui/components/dropdown/select"
import Button from "@duct-ui/components/button/button"
import { config, generatePerspectives } from "../utils/data-loader.js"
import { getGlobalAppState, getReligionOptions } from "../utils/app-state.js"
import type { GraphState, LegendItem } from "../types/fractal-types.js"

export interface SidebarEvents extends BaseComponentEvents {
  searchChange: (query: string) => void
  perspectiveChange: (perspective: string) => void
  wavePerspectiveChange: (wavePerspective: string) => void
  layerChange: (layer: string) => void
  metricChange: (metric: string) => void
  toggleChange: (toggleId: string, checked: boolean) => void
  resetView: () => void
}

export interface SidebarLogic {
  updateState: (state: GraphState) => void
  show: () => void
  hide: () => void
  toggle: () => void
  isVisible: () => boolean
}

export interface SidebarProps {
  state: GraphState
  isVisible?: boolean
  'on:searchChange'?: (el: HTMLElement, query: string) => void
  'on:perspectiveChange'?: (el: HTMLElement, perspective: string) => void
  'on:wavePerspectiveChange'?: (el: HTMLElement, wavePerspective: string) => void
  'on:layerChange'?: (el: HTMLElement, layer: string) => void
  'on:metricChange'?: (el: HTMLElement, metric: string) => void
  'on:toggleChange'?: (el: HTMLElement, toggleId: string, checked: boolean) => void
  'on:resetView'?: (el: HTMLElement) => void
  'on:bind'?: (el: HTMLElement) => void
  'on:release'?: (el: HTMLElement) => void
}

const perspectiveRef = createRef<PerspectiveSelectLogic>()
const wavePerspectiveRef = createRef<PerspectiveSelectLogic>()
const togglesRef = createRef<ToggleGroupLogic>()

function render(props: BaseProps<SidebarProps>) {
  const {
    state,
    isVisible = true,
    ...moreProps
  } = props

  // Convert layer options to select items
  const layerItems: SelectItem[] = config.layers.map(layer => ({
    label: layer.label,
    isSelected: layer.value === state.layerCap,
    attributes: { 'data-value': layer.value }
  }))

  // Convert metric options to select items
  const metricItems: SelectItem[] = config.metrics.map(metric => ({
    label: metric.label,
    isSelected: metric.value === state.metric,
    attributes: { 'data-value': metric.value }
  }))

  // Toggle items (religions removed - handled by ReligionSelector)
  const toggleItems: ToggleItem[] = [
    { id: 'science', label: 'Science', checked: state.showScience },
    { id: 'resonances', label: 'Resonances', checked: state.showResonances },
    { id: 'waves', label: 'Waves', checked: state.showWaves },
    { id: 'archetypes', label: 'Archetypes', checked: state.showArchetypes },
    { id: 'metaphysics', label: 'Metaphysics', checked: state.showMetaphysics }
  ]

  // Religion options for the religion selector
  const religionOptions = getReligionOptions()

  return (
    <div
      class="h-full w-full bg-base-200 p-4 overflow-auto"
      data-sidebar
      {...renderProps(moreProps)}
    >
      <CollapsibleSection title="Perspective" isOpen={true}>

        <div data-tutorial="perspective">
          <PerspectiveSelect
            ref={perspectiveRef}
            label="Perspective"
            options={generatePerspectives()}
            value={state.perspective}
            on:change={(el: HTMLElement, perspective: string) => {
              const event = new CustomEvent('sidebar-perspective-change', { detail: perspective })
              el.dispatchEvent(event)
            }}
          />
        </div>

        <div data-tutorial="wave-perspective">
          <PerspectiveSelect
            ref={wavePerspectiveRef}
            label="Wave perspective"
            options={config.wavePerspectives}
            value={state.wavePerspective}
            on:change={(el: HTMLElement, wavePerspective: string) => {
              const event = new CustomEvent('sidebar-wave-perspective-change', { detail: wavePerspective })
              el.dispatchEvent(event)
            }}
          />
        </div>

        <div class="flex items-center gap-3">
          <Button
            label="Reset View"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm border border-gray-600"
            on:click={() => {
              const appState = getGlobalAppState()
              appState.resetView()
            }}
          />
        </div>

      </CollapsibleSection>

      <CollapsibleSection title="Layers" isOpen={true}>
        <div class="space-y-2" data-tutorial="layers">
          <label class="text-sm font-medium text-gray-300 block">
            Show up to layer:
          </label>
          <Select
            items={layerItems}
            buttonClass="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-100 flex justify-between items-center"
            menuClass="menu bg-gray-800 border border-gray-600 rounded-lg shadow-lg mt-1 w-full min-w-max z-50 p-2"
            itemClass=""
            labelClass="font-medium text-gray-100"
            selectedIconClass="w-4 h-4 mr-2"
            data-layer-select
            on:selectionChange={(el: HTMLElement, item: SelectItem, index: number) => {
              const layerValue = item.attributes?.['data-value'] || config.layers[index]?.value
              if (layerValue) {
                const appState = getGlobalAppState()
                appState.setLayerCap(layerValue)
              }
            }}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Toggles" isOpen={true}>
        <div data-tutorial="toggles">
          {/* Religion Selector */}
          <div class="mb-4">
            <ReligionSelector
              religions={state.religions}
              options={religionOptions}
              on:change={(el: HTMLElement, religions: Record<string, boolean>) => {
                const appState = getGlobalAppState()
                appState.setReligions(religions)
              }}
            />
          </div>

          <ToggleGroup
            ref={togglesRef}
            items={toggleItems}
            columns={2}
            on:change={(el: HTMLElement, toggleId: string, checked: boolean) => {
              const appState = getGlobalAppState()
              appState.setToggle(toggleId, checked)
            }}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Resonance Metric">
        <small class="text-xs text-gray-500 block mb-2">
          Combined = 0.4·Meaning + 0.4·Influence + 0.2·Chronology
        </small>

        <Select
          items={metricItems}
          buttonClass="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-100 flex justify-between items-center"
          menuClass="menu bg-gray-800 border border-gray-600 rounded-lg shadow-lg mt-1 w-full min-w-max z-50 p-2"
          itemClass=""
          labelClass="font-medium text-gray-100"
          selectedIconClass="w-4 h-4 mr-2"
          data-metric-select
          on:selectionChange={(el: HTMLElement, item: SelectItem, index: number) => {
            const metricValue = item.attributes?.['data-value'] || config.metrics[index]?.value
            if (metricValue) {
              const appState = getGlobalAppState()
              appState.setMetric(metricValue)
            }
          }}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Legend">
        <Legend
          items={config.legend}
          columns={2}
        />
      </CollapsibleSection>
    </div>
  )
}

function bind(
  el: HTMLElement,
  eventEmitter: EventEmitter<SidebarEvents>,
  props: BaseProps<SidebarProps>
): BindReturn<SidebarLogic> {
  const sidebar = el as HTMLElement
  let isCurrentlyVisible = props.isVisible !== false

  function updateState(state: GraphState): void {
    // Update perspective selects
    if (perspectiveRef.current) {
      perspectiveRef.current.setValue(state.perspective)
    }
    if (wavePerspectiveRef.current) {
      wavePerspectiveRef.current.setValue(state.wavePerspective)
    }

    // Update toggles
    if (togglesRef.current) {
      togglesRef.current.setToggle('religions', state.showReligions)
      togglesRef.current.setToggle('science', state.showScience)
      togglesRef.current.setToggle('resonances', state.showResonances)
      togglesRef.current.setToggle('waves', state.showWaves)
      togglesRef.current.setToggle('archetypes', state.showArchetypes)
      togglesRef.current.setToggle('metaphysics', state.showMetaphysics)
    }

    // Update layer and metric selects would need select component refs
    // For now, we'll handle this through DOM updates
  }

  function show(): void {
    isCurrentlyVisible = true
    sidebar.classList.remove('-translate-x-[505px]')
    sidebar.classList.add('translate-x-0')
  }

  function hide(): void {
    isCurrentlyVisible = false
    sidebar.classList.remove('translate-x-0')
    sidebar.classList.add('-translate-x-[505px]')
  }

  function toggle(): void {
    if (isCurrentlyVisible) {
      hide()
    } else {
      show()
    }
  }

  function getIsVisible(): boolean {
    return isCurrentlyVisible
  }

  // No event handlers needed - components use global app state directly

  return {
    updateState,
    show,
    hide,
    toggle,
    isVisible: getIsVisible,
    release: () => {
      // No event listeners to clean up - components use global app state directly
    }
  }
}

const id = { id: "fractal/sidebar" }

const Sidebar = createBlueprint<SidebarProps, SidebarEvents, SidebarLogic>(
  id,
  render,
  { bind }
)

export default Sidebar