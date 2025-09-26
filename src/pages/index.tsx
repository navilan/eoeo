import type { DuctPageComponent } from '@duct-ui/router'
import FractalWebApp from '../components/FractalWebApp.js'

export function getLayout() {
  return 'default.html'
}

export function getPageMeta() {
  return {
    title: 'Echoes of Each Other - Interactive Visualization of Human Wisdom Traditions',
    description: 'In times of strife, we need to remind ourselves that we are echoes of each other and ultimately one. Explore how religious, philosophical, and scientific traditions connect across time through an interactive visualization.'
  }
}

const HomePage: DuctPageComponent = () => {
  return (
    <FractalWebApp
      initialState={{
        perspective: 'oneness',
        layerCap: '8',
        metric: 'combined'
      }}
    />
  )
}

export default HomePage