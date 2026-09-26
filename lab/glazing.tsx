import { buildBlockGeometry } from '@host/block-geometry'
import { blockPaint } from '@host/block-paint'
import { BlockNode, type BlockTopology, createBoxBlockTopology } from '@pascal-app/core'
import { useEffect, useMemo } from 'react'
import type { Mesh, MeshStandardNodeMaterial } from 'three/webgpu'

export type GlazingState = 'none' | 'glass' | 'glass-only' | 'opaque'

export function Glazing({
  state,
  onReport,
}: {
  state: Exclude<GlazingState, 'none'>
  onReport: (report: string) => void
}) {
  const node = useMemo(() => {
    const topology: BlockTopology = { vertices: [], edges: [], faces: [] }
    for (const [slot, width, x, depth] of [
      ['pane', 1.2, 0, 0.01],
      ['frame', 0.2, 0.35, 0.08],
    ] as const) {
      const box = createBoxBlockTopology(width, 1.2, depth)
      topology.vertices.push(
        ...box.vertices.map((vertex) => ({
          id: `${slot}-${vertex.id}`,
          position: [vertex.position[0] + x, vertex.position[1] + 1, vertex.position[2] - 2.06] as [
            number,
            number,
            number,
          ],
        })),
      )
      topology.edges.push(
        ...box.edges.map((edge) => ({
          id: `${slot}-${edge.id}`,
          vertexIds: edge.vertexIds.map((id) => `${slot}-${id}`) as [string, string],
        })),
      )
      topology.faces.push(
        ...box.faces.map((face) => ({
          id: `${slot}-${face.id}`,
          vertexIds: face.vertexIds.map((id) => `${slot}-${id}`),
          materialSlot: slot,
        })),
      )
    }
    return BlockNode.parse({
      topology,
      slots: {
        pane: 'library:preset-glass',
        frame: 'library:metal-chrome',
      },
    })
  }, [])
  const group = useMemo(() => buildBlockGeometry(node, { materials: {} }, 'rendered'), [node])
  useEffect(() => {
    group.traverse((object) => {
      if ((object as Mesh).isMesh) object.userData.__fromGeometry = true
    })
    const frame = group.getObjectByName('block-frame')!
    frame.visible = state !== 'glass-only'
    if (state === 'opaque')
      return (
        blockPaint.applyPreview({
          node,
          root: group,
          role: 'pane',
          material: undefined,
          materialPreset: 'library:metal-chrome',
        }) ?? undefined
      )
  }, [group, node, state])
  useEffect(() => {
    const mesh = group.getObjectByName('block-pane') as Mesh
    const materials = mesh.material as MeshStandardNodeMaterial[]
    onReport(
      JSON.stringify(
        materials.map((material, index) => ({
          phase: state,
          slot: mesh.userData.slotIds[index],
          transparent: material.transparent,
          opacity: material.opacity,
          shadowMask: material.maskShadowNode !== null,
          type: material.type,
        })),
        null,
        2,
      ),
    )
  }, [group, onReport, state])
  useEffect(
    () => () => {
      group.traverse((object) => {
        if ((object as Mesh).isMesh) (object as Mesh).geometry.dispose()
      })
    },
    [group],
  )
  return <primitive object={group} dispose={null} />
}
