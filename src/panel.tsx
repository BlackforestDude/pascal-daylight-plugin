'use client'

import { useViewer } from '@pascal-app/viewer'
import { useEffect, useId, useState } from 'react'
import { useStore } from 'zustand'
import { daylightState, parseDaylightFile } from './configuration.js'
import { lightingWarnings } from './diagnostics.js'
import { daylightRuntimeStatus } from './presentation-runtime.js'
import { sunAngles } from './solar.js'

export function ownershipWarning(owners: ReadonlyMap<symbol, string>): string | null {
  return [...owners.values()].includes('other-atmosphere')
    ? 'At least one open view is owned by another atmosphere. Turn its sky off in that view to use Daylight. No other plugin has been changed.'
    : null
}

function NumberControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  const [error, setError] = useState('')
  useEffect(() => {
    setDraft(String(value))
    setError('')
  }, [value])
  const commit = () => {
    const next = Number(draft)
    if (!draft.trim() || !Number.isFinite(next) || next < min || next > max) {
      setError(`Enter a number from ${min} to ${max}.`)
      return
    }
    setError('')
    onChange(next)
  }
  return (
    <div className="daylight-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => {
          setDraft(event.target.value)
          setError('')
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          }
        }}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="daylight-warning">
          {error}
        </p>
      )}
    </div>
  )
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
    setMessage('Preset ready below. Transfer it to the other browser with Load preset.')
    setError('')
    return text
  }

  return (
    <section className="pascal-daylight" aria-label="Daylight lighting controls">
      <header>
        <h2>
          Daylight <small>Preview</small>
        </h2>
        <p>Sunlight through real openings. No paid service or account.</p>
      </header>
      <label className="daylight-toggle">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(event) => daylightState.update({ enabled: event.target.checked })}
        />{' '}
        Enable daylight
      </label>
      {warnings.length > 0 && (
        <ul className="daylight-warning" aria-label="Lighting checks">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <p className="daylight-note">
        Enclosure checks require the host's ceiling and glazing shadow corrections. See the
        compatibility notes for the tested Pascal release.
      </p>
      <fieldset key={`direction-${importRevision}`}>
        <legend>Sun direction</legend>
        <label className="daylight-field" htmlFor={`${id}-mode`}>
          Position method
          <select
            id={`${id}-mode`}
            value={config.mode}
            onChange={(event) =>
              daylightState.update({ mode: event.target.value as 'manual' | 'solar' })
            }
          >
            <option value="manual">Manual angles</option>
            <option value="solar">Date and location (offline)</option>
          </select>
        </label>
        {config.mode === 'manual' ? (
          <>
            <NumberControl
              label="Sun azimuth (°)"
              value={config.azimuth}
              min={0}
              max={360}
              onChange={(azimuth) => daylightState.update({ azimuth })}
            />
            <NumberControl
              label="Sun elevation (°)"
              value={config.elevation}
              min={-90}
              max={90}
              onChange={(elevation) => daylightState.update({ elevation })}
            />
          </>
        ) : (
          <>
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
            <label className="daylight-stacked" htmlFor={`${id}-instant`}>
              Date and time (UTC or offset)
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
            <p>
              Calculated: {angles.azimuth.toFixed(1)}° azimuth / {angles.elevation.toFixed(1)}°
              elevation.
            </p>
          </>
        )}
        <NumberControl
          label="North rotation (°)"
          value={config.northOffset}
          min={0}
          max={360}
          onChange={(northOffset) => daylightState.update({ northOffset })}
        />
        <p className="daylight-note">
          0° north = −Z, east = +X. North rotation turns clockwise from −Z. No location is requested
          or transmitted.
        </p>
        {angles.elevation <= 0 && (
          <p className="daylight-warning">Sun is below the horizon; direct sunlight is off.</p>
        )}
      </fieldset>
      <fieldset key={`balance-${importRevision}`}>
        <legend>Light balance</legend>
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
          step={0.1}
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
        <p className="daylight-note">
          Fill is unoccluded, not bounced daylight. Keep it at 0 to check roofs/windows. Sun power
          is not lux; this is not a certified daylight calculation.
        </p>
        <div className="daylight-actions">
          <button type="button" onClick={() => daylightState.update({ presentationFill: 0 })}>
            Direct only
          </button>
          <button type="button" onClick={() => daylightState.update({ presentationFill: 0.08 })}>
            Soft preview fill
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend>Transfer this lighting</legend>
        <p className="daylight-note">
          Settings travel with a shared project only when its host saves and restores them.
          Otherwise, export here and load the preset in the other browser. Match Display settings:
          shadows on, Full height walls, Stack levels, Rendered. Keep Fast preview off for the final
          view.
        </p>
        <div className="daylight-actions">
          <button type="button" onClick={exportText}>
            Export preset
          </button>
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
            Download JSON
          </button>
        </div>
        <label className="daylight-stacked" htmlFor={`${id}-json`}>
          Preset JSON
          <textarea
            id={`${id}-json`}
            rows={5}
            value={json}
            maxLength={16_384}
            onChange={(event) => setJson(event.target.value)}
            spellCheck={false}
          />
        </label>
        <button type="button" onClick={() => importText(json)}>
          Load preset
        </button>
        {message && <p role="status">{message}</p>}
        {error && (
          <p role="alert" className="daylight-warning">
            {error}
          </p>
        )}
      </fieldset>
      <p className="daylight-note">
        Daylight does not change the model, materials, camera or global display settings. Indirect
        sky light, light bounces and photometric analysis are outside this release.
      </p>
    </section>
  )
}
