import { MODEL_LEGEND, MODEL_NODE_COLORS, NAVBAR_HEIGHT_PX } from '@/constants'
import { useProject } from '@/context/ProjectContext'
import { BlockOperations } from '@/misc/BlockOperations'
import type { FeatureNodeDatum } from '@/models/CodeBlock'
import { Box, HStack, Square, Text } from '@chakra-ui/react'
import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

export default function FeatureModelPage() {
  const { loader } = useProject()
  const navigate = useNavigate()

  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svgElement = svgRef.current
    if (!svgElement || !loader?.directoryTree) return

    const container = svgElement.parentElement!

    const width = container.clientWidth
    const height = container.clientHeight

    const rootDatum = BlockOperations.buildFeatureTree(loader.directoryTree)
    const root = d3.hierarchy(rootDatum)

    const treeLayout = d3.tree<FeatureNodeDatum>().nodeSize([56, 300])
    treeLayout(root)

    const diagonal = d3
      .linkHorizontal<unknown, { x: number; y: number }>()
      .x(d => d.y)
      .y(d => d.x)

    const svg = d3.select(svgElement).attr('width', width).attr('height', height)
    svg.selectAll('*').remove()

    const g = svg.append('g')

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', event => g.attr('transform', event.transform))

    svg.call(zoom)

    g.append('g')
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', '#a0aec0')
      .attr('stroke-width', 1.5)
      .attr('d', d =>
        diagonal({
          source: d.source as { x: number; y: number },
          target: d.target as { x: number; y: number }
        })
      )

    const node = g
      .append('g')
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .style('cursor', d => (d.data.fileId ? 'pointer' : 'default'))
      .on('click', (_e, d) => {
        if (d.data.fileId) {
          navigate(`/workspace/${d.data.fileId}`)
        }
      })

    const nodeStroke = (d: d3.HierarchyNode<FeatureNodeDatum>) => {
      if (d.data.type === 'root') {
        return MODEL_NODE_COLORS.root
      }
      if (d.data.type === 'frame') {
        return MODEL_NODE_COLORS.module
      }

      return d.data.mandatory ? MODEL_NODE_COLORS.mandatoryFeature : MODEL_NODE_COLORS.optionalFeature
    }

    const nodeFill = (d: d3.HierarchyNode<FeatureNodeDatum>) => {
      if (d.data.type === 'option' && !d.data.mandatory) {
        return 'transparent'
      }

      return nodeStroke(d)
    }

    node
      .append('circle')
      .attr('r', d => (d.data.type === 'root' ? 10 : 6))
      .attr('fill', nodeFill)
      .attr('stroke', nodeStroke)
      .attr('stroke-width', 2)

    node
      .append('text')
      .attr('dy', '0.35em')
      .attr('x', d => (d.children ? -16 : 16))
      .style('text-anchor', d => (d.children ? 'end' : 'start'))
      .attr('font-family', 'inherit')
      .attr('font-size', 13)
      .attr('fill', 'currentColor')
      .text(d => d.data.name)
  }, [loader, navigate])

  const heightCalculation = `calc(100vh - ${NAVBAR_HEIGHT_PX}px - 16px)`

  if (!loader?.directoryTree) {
    return null
  }

  return (
    <Box position={'relative'} w={'full'} height={heightCalculation} overflow={'hidden'}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <HStack
        gap={4}
        position={'absolute'}
        bottom={0}
        right={0}
        bg={'bg'}
        borderWidth={1}
        borderRadius={'md'}
        shadow={'sm'}
        px={3}
        py={2}
        m={1}
        fontSize={'xs'}
        color={'fg.muted'}
      >
        {MODEL_LEGEND.map(x => (
          <HStack key={x.label} gap={2}>
            <Square
              size={'10px'}
              borderRadius={'full'}
              style={{
                background: x.hollow ? 'transparent' : x.color,
                border: `2px solid ${x.color}`
              }}
            />
            <Text>{x.label}</Text>
          </HStack>
        ))}
        <Text color={'fg.subtle'}>Click on any node to open its file</Text>
      </HStack>
    </Box>
  )
}
