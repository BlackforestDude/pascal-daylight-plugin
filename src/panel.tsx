'use client'

import { useViewer } from '@pascal-app/viewer'
import { useEffect, useId, useState } from 'react'
import { useStore } from 'zustand'
import { daylightState, parseDaylightFile } from './configuration.js'
import { compassLabel } from './control-values.js'
import { DateTimeControl, NumberControl, RangeControl, SunCompass } from './controls.js'
import { lightingWarnings } from './diagnostics.js'
import { daylightRuntimeStatus } from './presentation-runtime.js'
import { sunAngles } from './solar.js'

export function ownershipWarning(owners: ReadonlyMap<symbol, string>): string | null {
  return [...owners.values()].includes('other-atmosphere')
    ? 'At least one open view is owned by another atmosphere. Turn its sky off in that view to use Daylight. No other plugin has been changed.'
    : null
}

export default function DaylightPanel() {
  const config = useStore(daylightState.store)
  const runtime = useStore(daylightRuntimeStatus)
  const shadows = useViewer((state) => state.shadows)
  const levelMode = useViewer((state) => state.levelMode)
  const wallMode = useViewer((state) => state.wallMode)
  const shading = useViewer((state) => state.shading)
  const [json, setJson] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [instantError, setInstantError] = useState('')
  const [importRevision, setImportRevision] = useState(0)
  const [instant, setInstant] = useState(config.instant)
  const id = useId()
  useEffect(() => {
    setInstant(config.instant)
    setInstantError('')
  }, [config.instant])
  const angles = sunAngles(config)
  const disabledPasses =
    typeof window === 'undefined'
      ? []
      : (new URLSearchParams(window.location.search).get('disable') ?? '')
          .split(',')
          .map((s) => s.trim())
  const warnings = lightingWarnings({ shadows, levelMode, wallMode, shading }, disabledPasses)
  const ownership = ownershipWarning(runtime.owners)
  if (ownership) warnings.unshift(ownership)
  const updateInstant = () => {
    try {
      daylightState.update({ instant })
      setInstantError('')
    } catch {
      setInstantError(
        'Use an ISO date with Z or an explicit offset, for example 2026-09-22T12:00:00Z (1900–2100).',
      )
    }
  }
  const importText = (text: string) => {
    try {
      const loaded = daylightState.restore(parseDaylightFile(text))
      setInstant(loaded.instant)
      setInstantError('')
      setImportRevision((revision) => revision + 1)
      setJson(text)
      setMessage('Preset loaded. View settings still belong to this browser.')
      setError('')
    } catch {
      setError(
        'Invalid preset. Use a version 1 Daylight JSON file, at most 16,384 characters. Existing settings were not changed.',
      )
      setMessage('')
    }
  }
  const exportText = () => {
    const text = JSON.stringify(daylightState.export(), null, 2)
    setJson(text)
    setMessage('Preset ready. Download it to use the same lighting in another project.')
    setError('')
    return text
  }
  const status = !config.enabled
    ? 'Off'
    : ownership
      ? 'Check view'
      : [...runtime.owners.values()].includes('active')
        ? 'Live preview'
        : 'Waiting for a view'
  return (
    <section className="pascal-daylight" aria-label="Daylight lighting controls">
      <header className="daylight-header">
        <h2>Daylight</h2>
        <span className="daylight-status">{status}</span>
      </header>
      <p className="daylight-intro">Shape the sunlight. See the room change.</p>
      <label className="daylight-toggle">
        <span>Enable daylight</span>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(event) => daylightState.update({ enabled: event.target.checked })}
        />
      </label>
      {!config.enabled && (
        <p className="daylight-note">
          Switch on to preview. You can adjust the controls while it is off.
        </p>
      )}
      {warnings.length > 0 && (
        <details className="daylight-checks" open>
          <summary>Check your view · {warnings.length}</summary>
          <ul className="daylight-warning" aria-label="Lighting checks">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
      <fieldset key={`direction-${importRevision}`}>
        <legend>Place the sun</legend>
        <fieldset className="daylight-modes" aria-label="Sun positioning method">
          <button
            type="button"
            aria-pressed={config.mode === 'manual'}
            onClick={() => daylightState.update({ mode: 'manual' })}
          >
            Visual
          </button>
          <button
            type="button"
            aria-pressed={config.mode === 'solar'}
            onClick={() => daylightState.update({ mode: 'solar' })}
          >
            Date & location
          </button>
        </fieldset>
        {config.mode === 'manual' ? (
          <>
            <SunCompass
              value={config.azimuth}
              onChange={(azimuth) => daylightState.update({ azimuth })}
            />
            <RangeControl
              label="Sun height"
              value={config.elevation}
              min={-90}
              max={90}
              step={1}
              display={`${Math.round(config.elevation)}°`}
              low="Below horizon"
              high="Overhead"
              onChange={(elevation) => daylightState.update({ elevation })}
            />
          </>
        ) : (
          <>
            <DateTimeControl
              value={config.instant}
              onChange={(instant) => daylightState.update({ instant })}
            />
            <p className="daylight-note">
              Enter your project's coordinates once. The sun position is calculated offline.
            </p>
            <NumberControl
              label="Latitude (° north)"
              value={config.latitude}
              min={-90}
              max={90}
              step={0.0001}
              onChange={(latitude) => daylightState.update({ latitude })}
            />
            <NumberControl
              label="Longitude (° east)"
              value={config.longitude}
              min={-180}
              max={180}
              step={0.0001}
              onChange={(longitude) => daylightState.update({ longitude })}
            />
            <p className="daylight-solar-result">
              {compassLabel(angles.azimuth)} · {Math.abs(angles.elevation).toFixed(1)}°{' '}
              {angles.elevation < 0 ? 'below' : 'above'} horizon
            </p>
          </>
        )}
        {config.northOffset !== 0 && (
          <p className="daylight-note">
            Model north is rotated {config.northOffset}°. Adjust in Advanced.
          </p>
        )}
        {angles.elevation <= 0 && (
          <p className="daylight-warning" role="status">
            Sun is below the horizon; direct sunlight is off.
          </p>
        )}
      </fieldset>
      <fieldset>
        <legend>Light & mood</legend>
        <RangeControl
          label="Sunlight strength"
          value={config.sunPower}
          min={0}
          max={10}
          step={0.1}
          display={`${config.sunPower.toFixed(1)}×`}
          low="None"
          high="Strong"
          onChange={(sunPower) => daylightState.update({ sunPower })}
        />
        <RangeControl
          label="Scene brightness"
          value={config.exposure}
          min={0.1}
          max={4}
          step={0.05}
          display={`${Math.round(config.exposure * 100)}%`}
          low="Darker"
          high="Brighter"
          onChange={(exposure) => daylightState.update({ exposure })}
        />
        <RangeControl
          label="Lift dark areas"
          value={config.presentationFill}
          min={0}
          max={0.3}
          step={0.01}
          display={
            config.presentationFill === 0 ? 'Off' : `${Math.round(config.presentationFill * 100)}%`
          }
          low="Direct light only"
          high="More fill"
          onChange={(presentationFill) => daylightState.update({ presentationFill })}
        />
        <p className="daylight-note">
          Fill brightens the whole room, including enclosed areas. Keep it off when checking light
          through windows.
        </p>
        <fieldset className="daylight-actions daylight-presets" aria-label="Fill presets">
          <button
            type="button"
            aria-pressed={config.presentationFill === 0}
            onClick={() => daylightState.update({ presentationFill: 0 })}
          >
            Direct only
          </button>
          <button
            type="button"
            aria-pressed={config.presentationFill === 0.08}
            onClick={() => daylightState.update({ presentationFill: 0.08 })}
          >
            Soft fill
          </button>
        </fieldset>
      </fieldset>
      <details className="daylight-advanced">
        <summary>
          Advanced<span>Exact values & presets</span>
        </summary>
        <fieldset key={`exact-${importRevision}`}>
          <legend>Exact values</legend>
          {config.mode === 'manual' && (
            <>
              <NumberControl
                label="Sun azimuth (°)"
                value={config.azimuth}
                min={0}
                max={360}
                step={0.1}
                onChange={(azimuth) => daylightState.update({ azimuth })}
              />
              <NumberControl
                label="Sun elevation (°)"
                value={config.elevation}
                min={-90}
                max={90}
                step={0.1}
                onChange={(elevation) => daylightState.update({ elevation })}
              />
            </>
          )}
          <NumberControl
            label="North rotation (°)"
            value={config.northOffset}
            min={0}
            max={360}
            step={0.1}
            onChange={(northOffset) => daylightState.update({ northOffset })}
          />
          <p className="daylight-note">
            Align north with your model. 0° = −Z; east = +X. Rotation turns clockwise.
          </p>
          <NumberControl
            label="Sun power (relative)"
            value={config.sunPower}
            min={0}
            max={10}
            step={0.1}
            onChange={(sunPower) => daylightState.update({ sunPower })}
          />
          <NumberControl
            label="Exposure"
            value={config.exposure}
            min={0.1}
            max={4}
            step={0.01}
            onChange={(exposure) => daylightState.update({ exposure })}
          />
          <NumberControl
            label="Presentation fill"
            value={config.presentationFill}
            min={0}
            max={0.3}
            step={0.01}
            onChange={(presentationFill) => daylightState.update({ presentationFill })}
          />
          {config.mode === 'solar' && (
            <>
              <label className="daylight-stacked" htmlFor={`${id}-instant`}>
                Exact time (ISO with offset)
                <input
                  id={`${id}-instant`}
                  type="text"
                  value={instant}
                  aria-invalid={!!instantError}
                  aria-describedby={instantError ? `${id}-instant-error` : undefined}
                  onChange={(event) => {
                    setInstant(event.target.value)
                    setInstantError('')
                  }}
                  onBlur={updateInstant}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') updateInstant()
                  }}
                />
              </label>
              {instantError && (
                <p id={`${id}-instant-error`} role="alert" className="daylight-warning">
                  {instantError}
                </p>
              )}
            </>
          )}
        </fieldset>
        <fieldset>
          <legend>Save & reuse lighting</legend>
          <p className="daylight-note">
            Project saving depends on the host editor. A preset file lets you keep or share this
            lighting yourself.
          </p>
          <div className="daylight-actions">
            <button
              type="button"
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([exportText()], { type: 'application/json' }),
                )
                const anchor = document.createElement('a')
                anchor.href = url
                anchor.download = 'pascal-daylight.json'
                anchor.click()
                setTimeout(() => URL.revokeObjectURL(url), 0)
              }}
            >
              Download preset
            </button>
          </div>
          <label className="daylight-stacked" htmlFor={`${id}-file`}>
            Load preset file
            <input
              id={`${id}-file`}
              type="file"
              accept=".json,application/json"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                if (file.size > 65_536) {
                  setError('Preset file is too large. Choose a Daylight JSON preset.')
                  setMessage('')
                  return
                }
                try {
                  importText(await file.text())
                } catch {
                  setError('Could not read this file. Existing settings were not changed.')
                  setMessage('')
                }
              }}
            />
          </label>
          <details className="daylight-json">
            <summary>JSON for developers & AI tools</summary>
            <button type="button" onClick={exportText}>
              Export preset
            </button>
            <div className="daylight-stacked">
              <label htmlFor={`${id}-json`}>Preset JSON</label>
              <textarea
                id={`${id}-json`}
                rows={5}
                value={json}
                maxLength={16_384}
                onChange={(event) => setJson(event.target.value)}
                spellCheck={false}
              />
            </div>
            <button type="button" onClick={() => importText(json)}>
              Load preset
            </button>
          </details>
          {message && <p role="status">{message}</p>}
          {error && (
            <p role="alert" className="daylight-warning">
              {error}
            </p>
          )}
        </fieldset>
        <p className="daylight-note">
          For matching views, use shadows, Full height walls, Stack levels and Rendered shading.
          Turn Fast preview off. Enclosure checks require the host's ceiling and glazing shadow
          corrections; see the compatibility notes.
        </p>
      </details>
      <p className="daylight-footnote">
        Visual sunlight preview. Not a lux or daylight compliance calculation.
      </p>
    </section>
  )
}
