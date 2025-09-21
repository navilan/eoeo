import type { DuctPageComponent } from '@duct-ui/router'
import FractalWebApp from '../components/FractalWebApp.js'

export function getLayout() {
  return 'default.html'
}

export function getPageMeta() {
  return {
    title: 'Echoes of Each Other',
    description: 'Interactive visualization of religious and philosophical traditions and their connections across time.'
  }
}

const HomePage: DuctPageComponent = () => {
  return (
    <FractalWebApp
      initialState={{
        perspective: 'oneness',
        layerCap: 'all',
        metric: 'combined'
      }}
    />
  )
}

export default HomePage