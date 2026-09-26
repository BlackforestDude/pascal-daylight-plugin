import { expect, test } from 'bun:test'
import { useScene } from '@pascal-app/core'
import {
  registerViewerPresentation,
  ViewerPresentations,
  viewerPresentationRegistry,
} from '@pascal-app/viewer'
import { act, create } from '@react-three/test-renderer'
import type { Scene } from 'three/webgpu'
import { daylightState } from '../src/configuration.js'
import { daylightPlugin, daylightPresentation } from '../src/index.js'
import { daylightRuntimeStatus } from '../src/presentation-runtime.js'

test('the real Pascal installation gate mounts and unmounts the lazy contribution without changing nodes', async () => {
  const before = useScene.getState()
  const registrations = viewerPresentationRegistry.getSnapshot()
  viewerPresentationRegistry.reset()
  registerViewerPresentation(daylightPresentation)
  daylightState.update({ enabled: true })
  useScene.setState({ installedPlugins: [] })
  const renderer = await create(<ViewerPresentations />)
  const scene = renderer.scene.instance as Scene
  const environment = scene.environmentNode
  try {
    expect(daylightRuntimeStatus.getState().owners.size).toBe(0)
    await act(async () => {
      useScene.setState({ installedPlugins: [daylightPlugin.id] })
      await daylightPresentation.component()
    })
    expect(scene.environmentNode).not.toBe(environment)
    expect(daylightRuntimeStatus.getState().owners.size).toBe(1)
    await act(async () => {
      useScene.setState({ installedPlugins: [] })
    })
    expect(scene.environmentNode).toBe(environment)
    expect(daylightRuntimeStatus.getState().owners.size).toBe(0)
    expect(useScene.getState().nodes).toBe(before.nodes)
    expect(useScene.getState().materials).toBe(before.materials)
  } finally {
    await renderer.unmount()
    daylightState.configuration.reset()
    viewerPresentationRegistry.reset()
    for (const contribution of registrations) registerViewerPresentation(contribution)
    useScene.setState(before)
  }
})
