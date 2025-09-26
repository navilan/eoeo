import Shepherd from 'shepherd.js'

export interface TutorialConfig {
  steps: TutorialStep[]
  onComplete?: () => void
  onCancel?: () => void
}

interface TutorialStep {
  id: string
  title: string
  text: string
  attachTo?: {
    element: string
    on: 'top' | 'bottom' | 'left' | 'right' | 'center'
  }
  buttons?: Array<{
    text: string
    action: string | (() => void)
    classes?: string
  }>
  beforeShowPromise?: () => Promise<void>
}

export function createTutorial(config: TutorialConfig): Shepherd.Tour {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      classes: 'bg-base-100 border border-base-300 rounded-lg shadow-xl',
      scrollTo: { behavior: 'smooth', block: 'center' },
      cancelIcon: {
        enabled: true
      }
    }
  })

  // Ensure sidebar is shown when tour starts
  tour.on('start', () => {
    const event = new CustomEvent('tutorial-ensure-sidebar')
    document.dispatchEvent(event)
  })

  // Mark tutorial elements as drawer triggers to prevent closing
  tour.on('show', () => {
    setTimeout(() => {
      const shepherdElement = document.querySelector('.shepherd-element')
      if (shepherdElement) {
        shepherdElement.setAttribute('data-drawer-trigger', '')
      }
    }, 10)
  })

  config.steps.forEach((stepConfig) => {
    const step: any = {
      title: stepConfig.title,
      text: stepConfig.text,
      beforeShowPromise: () => {
        return new Promise<void>((resolve) => {
          // Ensure drawer is open before showing each step
          const event = new CustomEvent('tutorial-ensure-sidebar')
          document.dispatchEvent(event)
          // Small delay to ensure drawer opens before step shows
          setTimeout(resolve, 100)
        })
      },
      buttons: stepConfig.buttons?.map(btn => ({
        text: btn.text,
        action: typeof btn.action === 'string' ?
          (btn.action === 'next' ? tour.next.bind(tour) :
           btn.action === 'back' ? tour.back.bind(tour) :
           btn.action === 'cancel' ? tour.cancel.bind(tour) :
           btn.action === 'complete' ? tour.complete.bind(tour) :
           tour.next.bind(tour)) :
          btn.action,
        classes: btn.classes
      })) || [
        {
          text: 'Back',
          action: tour.back.bind(tour),
          classes: 'btn btn-ghost btn-sm'
        },
        {
          text: 'Next',
          action: tour.next.bind(tour),
          classes: 'btn btn-primary btn-sm'
        }
      ]
    }

    if (stepConfig.attachTo) {
      step.attachTo = stepConfig.attachTo
    }

    if (stepConfig.beforeShowPromise) {
      step.beforeShowPromise = stepConfig.beforeShowPromise
    }

    tour.addStep(step)
  })

  // Handle completion and cancellation
  tour.on('complete', () => {
    if (config.onComplete) {
      config.onComplete()
    }
  })

  tour.on('cancel', () => {
    if (config.onCancel) {
      config.onCancel()
    }
  })

  return tour
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Echoes of Each Other',
    text: `<p>In our polarized world, we often forget that despite our differences, we are all echoes of each other.</p>

           <p>This visualization shows how human wisdom traditions—religions, philosophies, and sciences—are interconnected
           threads in the tapestry of human understanding.</p>

           <p><strong>Note:</strong> This is a work in progress, and it's open source! Interested contributors can submit changes
           to the <a href="https://github.com/navilan/eoeo" target="_blank" rel="noopener noreferrer" style="color: #9333ea; text-decoration: underline;">eoeo open source repository</a>.</p>`,
    buttons: [
      {
        text: 'Start Tour',
        action: 'next',
        classes: 'btn btn-primary btn-sm'
      },
      {
        text: 'Skip',
        action: 'cancel',
        classes: 'btn btn-ghost btn-sm'
      }
    ]
  },
  {
    id: 'core-concept',
    title: 'Start with the Core',
    text: `Begin by exploring the center—the concept of Oneness that many traditions share. From here, you can see
           how different paths branch out, yet remain connected to this fundamental unity. Use the Perspective
           control to center on different traditions.`,
    attachTo: {
      element: '[data-tutorial="perspective"]',
      on: 'right'
    },
    buttons: [
      {
        text: 'Previous',
        action: 'back',
        classes: 'btn btn-ghost btn-sm'
      },
      {
        text: 'Next',
        action: 'next',
        classes: 'btn btn-primary btn-sm'
      }
    ]
  },
  {
    id: 'layers',
    title: 'Add Layers of Detail',
    text: `Use the Layer Cap control to gradually reveal more detail. Start with just the core concepts,
           then expand to see how traditions evolved and branched over time.`,
    attachTo: {
      element: '[data-tutorial="layers"]',
      on: 'right'
    },
    buttons: [
      {
        text: 'Previous',
        action: 'back',
        classes: 'btn btn-ghost btn-sm'
      },
      {
        text: 'Next',
        action: 'next',
        classes: 'btn btn-primary btn-sm'
      }
    ]
  },
  {
    id: 'perspectives',
    title: 'See Different Perspectives',
    text: `Every tradition offers a unique lens through which to view reality. Change the perspective to center
           on different traditions and see how the same network looks from various viewpoints.`,
    attachTo: {
      element: '[data-tutorial="perspective"]',
      on: 'right'
    },
    buttons: [
      {
        text: 'Previous',
        action: 'back',
        classes: 'btn btn-ghost btn-sm'
      },
      {
        text: 'Next',
        action: 'next',
        classes: 'btn btn-primary btn-sm'
      }
    ]
  },
  {
    id: 'waves',
    title: 'Explore the Waves',
    text: `The wave patterns show how certain themes—like devotional practices, rational inquiry, or reformation
           movements—ripple across different traditions throughout history, connecting seemingly distant beliefs.`,
    attachTo: {
      element: '[data-tutorial="wave-perspective"]',
      on: 'right'
    },
    buttons: [
      {
        text: 'Previous',
        action: 'back',
        classes: 'btn btn-ghost btn-sm'
      },
      {
        text: 'Next',
        action: 'next',
        classes: 'btn btn-primary btn-sm'
      }
    ]
  },
  {
    id: 'toggles',
    title: 'Control What You See',
    text: `Use these toggles to show or hide different types of content. Turn on "Waves" to see the thematic
           connections, or focus on just "Religions" to see traditional spiritual paths.`,
    attachTo: {
      element: '[data-tutorial="toggles"]',
      on: 'right'
    },
    buttons: [
      {
        text: 'Previous',
        action: 'back',
        classes: 'btn btn-ghost btn-sm'
      },
      {
        text: 'Next',
        action: 'next',
        classes: 'btn btn-primary btn-sm'
      }
    ]
  },
  {
    id: 'navigation',
    title: 'Navigate and Explore',
    text: `Use your mouse or trackpad to pan (drag) and zoom (scroll/pinch) around the visualization.
           Each node represents a tradition, and the connections show their relationships and influences.

           <p><strong>Tip:</strong> Don't like how the nodes settled? Use the "Reset View" button to get a fresh
           random layout and watch the visualization reorganize itself!</p>`,
    buttons: [
      {
        text: 'Previous',
        action: 'back',
        classes: 'btn btn-ghost btn-sm'
      },
      {
        text: 'Next',
        action: 'next',
        classes: 'btn btn-primary btn-sm'
      }
    ]
  },
  {
    id: 'conclusion',
    title: 'Remember Our Unity',
    text: `<p>As you explore, remember that these aren't just abstract concepts—they represent the lived experiences
           and deepest insights of billions of people throughout history.</p>

           <p>In recognizing these connections, we see that we are indeed echoes of each other.</p>

           <p>This is just the beginning—the project is a work in progress and evolving. Help improve it by contributing
           to the <a href="https://github.com/navilan/eoeo" target="_blank" rel="noopener noreferrer" style="color: #9333ea; text-decoration: underline;">eoeo open source repository</a>!</p>`,
    buttons: [
      {
        text: 'Previous',
        action: 'back',
        classes: 'btn btn-ghost btn-sm'
      },
      {
        text: 'Begin Exploring',
        action: 'complete',
        classes: 'btn btn-primary btn-sm'
      }
    ]
  }
]