'use client'

import { SceneAtmosphere, useSceneAtmosphere } from '@pascal-app/viewer'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useState } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { createDaylightAtmosphere, updateDaylightAtmosphere } from './atmosphere.js'
import { daylightState } from './configuration.js'

export const daylightRuntimeStatus = createStore<{ owners: ReadonlyMap<symbol, string> }>(() => ({
  owners: new Map(),
}))

export default function DaylightPresentation() {
  const config = useStore(daylightState.store)
  const current = useSceneAtmosphere()
  const invalidate = useThree((state) => state.invalidate)
  const [source] = useState(() => createDaylightAtmosphere(config))
  const [id] = useState(() => Symbol('daylight-viewer'))
  const blocked = current !== null && current !== source
  const status = !config.enabled ? 'disabled' : blocked ? 'other-atmosphere' : 'active'

  useLayoutEffect(() => {
    updateDaylightAtmosphere(source, config)
    invalidate()
  }, [config, invalidate, source])

  useLayoutEffect(() => {
    const owners = new Map(daylightRuntimeStatus.getState().owners)
    owners.set(id, status)
    daylightRuntimeStatus.setState({ owners })
    return () => {
      const remaining = new Map(daylightRuntimeStatus.getState().owners)
      remaining.delete(id)
      daylightRuntimeStatus.setState({ owners: remaining })
    }
  }, [id, status])

  return config.enabled && !blocked ? <SceneAtmosphere source={source} /> : null
}
