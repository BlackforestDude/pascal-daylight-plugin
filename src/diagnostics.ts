export type LightingView = {
  shadows: boolean
  levelMode: string
  wallMode: string
  shading: string
}
export function lightingWarnings(view: LightingView, disabledPasses: string[] = []): string[] {
  const warnings: string[] = []
  if (!view.shadows || disabledPasses.includes('shadows'))
    warnings.push('Shadows are off. Enable them in Display settings to test the enclosure.')
  if (view.levelMode === 'exploded' || view.levelMode === 'manual')
    warnings.push('Levels may be separated. Use Stack for an enclosed-room study.')
  if (view.levelMode === 'solo')
    warnings.push('Solo hides other levels from view. Use Stack to inspect the full enclosure.')
  if (view.wallMode !== 'up')
    warnings.push('Walls are cut away. Use full-height walls for an enclosed-room study.')
  if (view.shading !== 'rendered')
    warnings.push('Use Rendered shading to inspect the material response.')
  if (disabledPasses.includes('postFx'))
    warnings.push(
      'Fast preview bypasses ambient occlusion and post-processing; turn it off for the final rendered view.',
    )
  return warnings
}
