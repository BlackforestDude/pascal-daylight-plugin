declare module '@host/lights' {
  export const Lights: () => import('react').ReactNode
}
declare module '*.css'
declare module '@host/block-paint' {
  export const blockPaint: import('@pascal-app/core').PaintCapability
}
declare module '@host/block-geometry' {
  export function buildBlockGeometry(
    node: import('@pascal-app/core').BlockNode,
    context: Pick<import('@pascal-app/core').GeometryContext, 'materials'>,
    shading: 'solid' | 'rendered',
  ): import('three').Group
}
declare module '@host/ceiling-materials' {
  export function getCeilingMaterials(color?: string): {
    bottomMaterial: import('three/webgpu').MeshLambertNodeMaterial
  }
}
