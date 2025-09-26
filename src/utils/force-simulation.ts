// Force-directed graph simulation utilities
import type { Node, Edge, SimulationNode, MetricType } from '../types/fractal-types.js'
import { edgeWeight } from './data-loader.js'

export interface SimulationConfig {
  width: number
  height: number
  centerX: number
  centerY: number
}

export class ForceSimulation {
  private nodes: SimulationNode[] = []
  private edges: Edge[] = []
  private nodeById = new Map<string, SimulationNode>()
  private animationId: number | null = null
  private config: SimulationConfig
  private focusNodeId = 'oneness'
  private waveFocusId = ''
  private metric: MetricType = 'combined'

  constructor(config: SimulationConfig) {
    this.config = config
  }

  setData(nodes: Node[], edges: Edge[]): void {
    // Convert nodes to simulation nodes with physics properties
    // Reset positions and velocities for all nodes (matching original behavior)
    this.nodes = nodes.map(node => ({
      ...node,
      x: this.randomPosition(-150, 150),
      y: this.randomPosition(-150, 150),
      vx: 0,
      vy: 0
    }))

    this.edges = edges
    this.nodeById = new Map(this.nodes.map(n => [n.id, n]))
  }

  setFocus(nodeId: string, waveFocusId = ''): void {
    this.focusNodeId = nodeId
    this.waveFocusId = waveFocusId
  }

  setMetric(metric: MetricType): void {
    this.metric = metric
  }

  updateConfig(config: SimulationConfig): void {
    this.config = config
  }

  private randomPosition(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }

  private shortestDistances(rootId: string): Map<string, number> {
    const distances = new Map<string, number>()
    const adjacency = new Map<string, Array<[string, number]>>()

    // Build adjacency list with edge weights
    for (const edge of this.edges) {
      const weight = edgeWeight(edge, this.metric)

      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, [])
      }
      if (!adjacency.has(edge.target)) {
        adjacency.set(edge.target, [])
      }

      adjacency.get(edge.source)!.push([edge.target, weight])
      adjacency.get(edge.target)!.push([edge.source, weight])
    }

    // Initialize distances
    for (const node of this.nodes) {
      distances.set(node.id, Infinity)
    }

    if (!adjacency.has(rootId)) {
      return distances
    }

    // Dijkstra's algorithm
    distances.set(rootId, 0)
    const queue: Array<[number, string]> = [[0, rootId]]

    while (queue.length > 0) {
      queue.sort((a, b) => a[0] - b[0])
      const [currentDist, currentNode] = queue.shift()!

      if (currentDist > distances.get(currentNode)!) {
        continue
      }

      const neighbors = adjacency.get(currentNode) || []
      for (const [neighbor, weight] of neighbors) {
        const newDist = currentDist + weight
        if (newDist < distances.get(neighbor)!) {
          distances.set(neighbor, newDist)
          queue.push([newDist, neighbor])
        }
      }
    }

    return distances
  }

  private getWaveNeighbors(nodeId: string): Set<string> {
    const neighbors = new Set<string>()
    for (const edge of this.edges) {
      if (edge.type !== 'wave') continue
      if (edge.source === nodeId) neighbors.add(edge.target)
      if (edge.target === nodeId) neighbors.add(edge.source)
    }
    return neighbors
  }


  private simulationStep(): void {
    const focusId = this.waveFocusId || this.focusNodeId
    const distances = this.shortestDistances(focusId)
    const finiteDistances = Array.from(distances.values()).filter(d => isFinite(d))
    const maxDistance = finiteDistances.length ? Math.max(...finiteDistances) : 1

    const waveNeighbors = this.waveFocusId ? this.getWaveNeighbors(this.waveFocusId) : new Set<string>()

    // Spring forces between connected nodes
    for (const edge of this.edges) {
      const sourceNode = this.nodeById.get(edge.source)
      const targetNode = this.nodeById.get(edge.target)

      if (!sourceNode || !targetNode) continue

      const dx = targetNode.x - sourceNode.x
      const dy = targetNode.y - sourceNode.y
      const distance = Math.hypot(dx, dy) || 1e-6
      const nx = dx / distance
      const ny = dy / distance

      // Base spring length depends on edge type
      let baseLength: number
      let springStrength: number

      switch (edge.type) {
        case 'lineage':
          baseLength = 110
          springStrength = 0.05
          break
        case 'cross':
          baseLength = 160
          springStrength = 0.01
          break
        case 'wave':
          baseLength = 250
          springStrength = 0.008
          break
        case 'archetype':
          baseLength = 280
          springStrength = 0.005
          break
        default:
          baseLength = 140
          springStrength = 0.03
      }

      // Stronger springs for wave focus connections
      if (this.waveFocusId && (edge.source === this.waveFocusId || edge.target === this.waveFocusId)) {
        springStrength *= 2.3
      }

      const force = (distance - baseLength) * springStrength
      sourceNode.vx += force * nx
      sourceNode.vy += force * ny
      targetNode.vx -= force * nx
      targetNode.vy -= force * ny
    }

    // Radial gravity toward focus node
    for (const node of this.nodes) {
      const distance = distances.get(node.id) || Infinity
      const normalizedDistance = isFinite(distance) ? distance / maxDistance : 1

      let targetRadius = 80 + 620 * normalizedDistance

      // Tighten orbit for wave-connected nodes
      if (this.waveFocusId && (waveNeighbors.has(node.id) || node.id === this.waveFocusId)) {
        targetRadius *= 0.55
      }

      const angle = Math.atan2(node.y, node.x)
      const targetX = Math.cos(angle) * targetRadius
      const targetY = Math.sin(angle) * targetRadius

      const gravityStrength = this.waveFocusId ? 0.03 : 0.02
      node.vx += (targetX - node.x) * gravityStrength
      node.vy += (targetY - node.y) * gravityStrength
    }

    // Pin focus nodes
    const focusNode = this.nodeById.get(focusId)
    if (focusNode) {
      focusNode.x = 0
      focusNode.y = 0
      focusNode.vx = 0
      focusNode.vy = 0
    }

    // Special positioning for "oneness" node
    const onenessNode = this.nodeById.get('oneness')
    if (onenessNode) {
      if (focusId !== 'oneness') {
        onenessNode.x = -300
        onenessNode.y = 0
      } else {
        onenessNode.x = 0
        onenessNode.y = 0
      }
      onenessNode.vx = 0
      onenessNode.vy = 0
    }

    // Repulsion and collision detection
    for (let i = 0; i < this.nodes.length; i++) {
      const nodeA = this.nodes[i]
      const radiusA = 15 + Math.min(110, (nodeA.label?.length || 0) * 3.0)  // Increased base from 10 to 15

      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeB = this.nodes[j]
        const radiusB = 15 + Math.min(110, (nodeB.label?.length || 0) * 3.0)  // Increased base from 10 to 15

        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const distanceSquared = dx * dx + dy * dy

        if (distanceSquared === 0) {
          nodeA.vx -= 0.5
          nodeA.vy -= 0.5
          nodeB.vx += 0.5
          nodeB.vy += 0.5
          continue
        }

        const distance = Math.sqrt(distanceSquared)

        // Increase repulsion for archetype and wave nodes
        let repulsionBase = 1600
        if (nodeA.kind === 'archetype' || nodeA.kind === 'wave' ||
            nodeB.kind === 'archetype' || nodeB.kind === 'wave') {
          repulsionBase = 3200  // Double repulsion for archetype/wave nodes
        }

        const repulsion = repulsionBase / (distanceSquared + 10)
        const rx = (repulsion * dx) / distance
        const ry = (repulsion * dy) / distance
        nodeA.vx -= rx
        nodeA.vy -= ry
        nodeB.vx += rx
        nodeB.vy += ry

        // Collision separation
        const minDistance = radiusA + radiusB
        if (distance < minDistance) {
          const pushForce = (minDistance - distance) * 0.05
          const px = (pushForce * dx) / distance
          const py = (pushForce * dy) / distance
          nodeA.x -= px
          nodeA.y -= py
          nodeB.x += px
          nodeB.y += py
        }
      }
    }

    // Integration with damping
    for (const node of this.nodes) {
      node.vx *= 0.86
      node.vy *= 0.86
      node.x += node.vx
      node.y += node.vy
    }
  }

  start(): void {
    if (this.animationId) {
      this.stop()
    }

    const animate = () => {
      this.simulationStep()
      this.animationId = requestAnimationFrame(animate)
    }

    this.animationId = requestAnimationFrame(animate)
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  getNodes(): SimulationNode[] {
    return this.nodes
  }

  getEdges(): Edge[] {
    return this.edges
  }

  resetLayout(): void {
    // Re-randomize all node positions and reset velocities
    for (const node of this.nodes) {
      node.x = this.randomPosition(-150, 150)
      node.y = this.randomPosition(-150, 150)
      node.vx = 0
      node.vy = 0
    }

    // Restart the simulation with fresh positions
    this.start()
  }

  destroy(): void {
    this.stop()
    this.nodes = []
    this.edges = []
    this.nodeById.clear()
  }
}