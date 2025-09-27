// Data loading utilities for Fractal Web
import type { Node, Edge, GraphState, MetricType, LayerCap } from '../types/fractal-types.js'

import nodesData from '../data/nodes.json'
import lineageEdgesData from '../data/lineage-edges.json'
import resonanceEdgesData from '../data/resonance-edges.json'
import waveEdgesData from '../data/wave-edges.json'
import configData from '../data/config.json'
import groupColors from '../data/group-colors.json'

export const nodes: Node[] = nodesData as Node[]
export const lineageEdges: Edge[] = lineageEdgesData as Edge[]
export const resonanceEdges: Edge[] = resonanceEdgesData as Edge[]
export const waveEdges: Edge[] = waveEdgesData as Edge[]
export const config = configData
export const colors = groupColors

// Create lookup maps for performance
export const nodeById = new Map(nodes.map(n => [n.id, n]))

export function getNodeColor(groupName: string): string {
  return colors[groupName as keyof typeof colors] || '#9ca3af'
}

export function nodeAllowed(node: Node, layerCap: LayerCap): boolean {
  // Archetype nodes are now controlled by toggles, not layers
  if (node.layer === 'archetypes') {
    return true
  }
  // Wave nodes are now controlled by toggles, not layers
  if (node.kind === 'wave') {
    return true
  }
  return typeof node.layer === 'number' && node.layer <= parseInt(layerCap)
}

export function nodeVisible(node: Node, state: GraphState): boolean {
  // Check individual religion visibility
  if (node.kind === 'religion') {
    return state.showReligions && (state.religions[node.group] !== false)
  }

  return (state.showScience || node.kind !== 'science') &&
         (state.showWaves || node.kind !== 'wave') &&
         (state.showArchetypes || node.kind !== 'archetype') &&
         (state.showPhilosophy || node.kind !== 'philosophy')
}

export function passByMetric(
  meaning: number = 70,
  influence: number = 50,
  chronology: number = 90,
  metric: MetricType = 'combined'
): boolean {
  switch (metric) {
    case 'combined':
      return (0.4 * meaning + 0.4 * influence + 0.2 * chronology) >= 60
    case 'meaning':
      return meaning >= 65
    case 'influence':
      return influence >= 50
    case 'chronology':
      return chronology >= 85
    default:
      return false
  }
}

export function edgeWeight(edge: Edge, metric: MetricType = 'combined'): number {
  if (edge.type === 'lineage') return 1.0

  const m = edge.meaning ?? 70
  const i = edge.influence ?? 50
  const c = edge.chronology ?? 90

  let score: number
  switch (metric) {
    case 'combined':
      score = 0.4 * m + 0.4 * i + 0.2 * c
      break
    case 'meaning':
      score = m
      break
    case 'influence':
      score = i
      break
    case 'chronology':
      score = c
      break
    default:
      score = (m + i + c) / 3
  }

  return 1 + 1.8 * ((100 - score) / 100)
}

export function buildActiveGraph(state: GraphState): { nodes: Node[], edges: Edge[] } {
  // Filter nodes by layer
  const activeNodes = nodes.filter(n => nodeAllowed(n, state.layerCap))
  const nodeIds = new Set(activeNodes.map(n => n.id))

  // Create lookup for node visibility
  const nodeMap = new Map(activeNodes.map(n => [n.id, n]))

  const activeEdges: Edge[] = []

  // Add lineage edges
  for (const edge of lineageEdges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      const sourceNode = nodeMap.get(edge.source)
      const targetNode = nodeMap.get(edge.target)
      // Only include edge if both nodes are visible according to toggles
      if (sourceNode && targetNode &&
          nodeVisible(sourceNode, state) && nodeVisible(targetNode, state)) {
        activeEdges.push(edge)
      }
    }
  }

  // Add resonance edges if enabled (now only cross-type edges)
  if (state.showResonances) {
    for (const edge of resonanceEdges) {
      const m = edge.meaning || 0
      const i = edge.influence || 0
      const c = edge.chronology || 0

      // All resonance edges now have detailed metrics
      if (passByMetric(m, i, c, state.metric) &&
          nodeIds.has(edge.source) &&
          nodeIds.has(edge.target)) {
        const sourceNode = nodeMap.get(edge.source)
        const targetNode = nodeMap.get(edge.target)
        // Only include edge if both nodes are visible according to toggles
        if (sourceNode && targetNode &&
            nodeVisible(sourceNode, state) && nodeVisible(targetNode, state)) {
          activeEdges.push(edge)
        }
      }
    }
  }

  // Add wave edges if enabled
  if (state.showWaves) {
    for (const edge of waveEdges) {
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        const sourceNode = nodeMap.get(edge.source)
        const targetNode = nodeMap.get(edge.target)
        // Only include edge if both nodes are visible according to toggles
        if (sourceNode && targetNode &&
            nodeVisible(sourceNode, state) && nodeVisible(targetNode, state)) {
          activeEdges.push(edge)
        }
      }
    }
  }

  return { nodes: activeNodes, edges: activeEdges }
}