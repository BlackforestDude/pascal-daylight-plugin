'use client'

import { useEffect, useId, useState } from 'react'
import { compassAngle, compassLabel, instantFromLocal, localDateTime } from './control-values.js'

export function NumberControl({
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

export function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  low,
  high,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  low: string
  high: string
  onChange: (value: number) => void
}) {
  const id = useId()
  return (
    <div className="daylight-range">
      <div className="daylight-range-heading">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{display}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
      <div className="daylight-range-ends" aria-hidden="true">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

export function SunCompass({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const id = useId()
  const angle = value % 360
  const radians = (angle * Math.PI) / 180
  const x = 110 + Math.sin(radians) * 76
  const y = 110 - Math.cos(radians) * 76
  return (
    <div className="daylight-compass-group">
      <div
        className="daylight-compass"
        role="slider"
        tabIndex={0}
        aria-label="Sun direction"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={angle}
        aria-valuetext={`${compassLabel(angle)}, ${angle} degrees`}
        aria-describedby={`${id}-help`}
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return
          event.currentTarget.focus()
          event.currentTarget.setPointerCapture(event.pointerId)
          const bounds = event.currentTarget.getBoundingClientRect()
          const next = compassAngle(
            event.clientX - bounds.left - bounds.width / 2,
            event.clientY - bounds.top - bounds.height / 2,
          )
          if (next !== null) onChange(next)
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          const bounds = event.currentTarget.getBoundingClientRect()
          const next = compassAngle(
            event.clientX - bounds.left - bounds.width / 2,
            event.clientY - bounds.top - bounds.height / 2,
          )
          if (next !== null) onChange(next)
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onKeyDown={(event) => {
          let next: number
          switch (event.key) {
            case 'ArrowRight':
            case 'ArrowUp':
              next = angle + (event.shiftKey ? 15 : 1)
              break
            case 'ArrowLeft':
            case 'ArrowDown':
              next = angle - (event.shiftKey ? 15 : 1)
              break
            case 'PageUp':
              next = angle + 15
              break
            case 'PageDown':
              next = angle - 15
              break
            case 'Home':
              next = 0
              break
            case 'End':
              next = 359
              break
            default:
              return
          }
          event.preventDefault()
          onChange((next + 360) % 360)
        }}
      >
        <svg viewBox="0 0 220 220" aria-hidden="true">
          <circle className="daylight-compass-face" cx="110" cy="110" r="96" />
          <circle className="daylight-compass-orbit" cx="110" cy="110" r="76" />
          <path className="daylight-compass-axis" d="M110 28v18m0 128v18M28 110h18m128 0h18" />
          <text x="110" y="13">
            N
          </text>
          <text x="211" y="114">
            E
          </text>
          <text x="110" y="219">
            S
          </text>
          <text x="9" y="114">
            W
          </text>
          <line className="daylight-compass-ray" x1="110" y1="110" x2={x} y2={y} />
          <circle className="daylight-compass-center" cx="110" cy="110" r="43" />
          <text className="daylight-compass-degree" x="110" y="110">
            {Math.round(angle)}°
          </text>
          <text className="daylight-compass-direction" x="110" y="130">
            {compassLabel(angle)}
          </text>
          <g transform={`translate(${x} ${y})`} className="daylight-compass-sun">
            <circle r="18" />
            <circle className="daylight-sun-core" r="5" />
            <path d="M0 -12v3m0 18v3M-12 0h3m18 0h3M-8.5 -8.5l2.2 2.2m12.6 12.6l2.2 2.2M-8.5 8.5l2.2 -2.2m12.6 -12.6l2.2 -2.2" />
          </g>
        </svg>
      </div>
      <p className="daylight-note daylight-compass-help" id={`${id}-help`}>
        Drag the sun around your model.
        <br />
        Arrow keys fine-tune; Shift moves 15°.
      </p>
    </div>
  )
}

export function DateTimeControl({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const [zone, setZone] = useState('your device time zone')
  const [error, setError] = useState('')
  useEffect(() => {
    setDraft(localDateTime(value))
    setError('')
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [value])
  const commit = () => {
    if (draft === localDateTime(value)) return
    try {
      onChange(instantFromLocal(draft))
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Choose a valid date and time.')
    }
  }
  return (
    <div className="daylight-stacked">
      <label htmlFor={id}>Date and time</label>
      <input
        id={id}
        type="datetime-local"
        min="1900-01-01T00:00"
        max="2100-12-31T23:59:59"
        step="1"
        value={draft}
        aria-invalid={!!error}
        aria-describedby={`${id}-zone${error ? ` ${id}-error` : ''}`}
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
      <p className="daylight-note" id={`${id}-zone`}>
        Your device time zone: {zone}. Shared presets keep the same moment everywhere.
      </p>
      {error && (
        <p id={`${id}-error`} className="daylight-warning" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          onChange(new Date().toISOString())
          setError('')
        }}
      >
        Use current time
      </button>
    </div>
  )
}
