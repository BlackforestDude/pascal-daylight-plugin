export function compassAngle(x: number, y: number): number | null {
  if (Math.hypot(x, y) < 8) return null
  return (Math.round((Math.atan2(x, -y) * 180) / Math.PI) + 360) % 360
}

export function compassLabel(degrees: number): string {
  const directions = [
    'North',
    'North-east',
    'East',
    'South-east',
    'South',
    'South-west',
    'West',
    'North-west',
  ]
  return directions[Math.round(degrees / 45) % 8]!
}

export function localDateTime(instant: string): string {
  const date = new Date(instant)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function instantFromLocal(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) throw new Error('Choose a complete date and time.')
  const [, year, month, day, hour, minute, second = '00'] = match
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  )
  const normalized = `${year}-${month}-${day}T${hour}:${minute}:${second}`
  if (
    Number(year) < 1900 ||
    Number(year) > 2100 ||
    localDateTime(date.toISOString()) !== normalized
  )
    throw new Error(
      'Choose a valid time between 1900 and 2100. This time may be skipped by daylight saving.',
    )
  const nextDayOffset = new Date(date.getTime() + 86_400_000).getTimezoneOffset()
  const repeatedMinutes = nextDayOffset - date.getTimezoneOffset()
  if (
    repeatedMinutes > 0 &&
    localDateTime(new Date(date.getTime() + repeatedMinutes * 60_000).toISOString()) === normalized
  )
    throw new Error(
      'This time occurs twice when clocks change. Choose a different time, or use an explicit UTC offset in Advanced.',
    )
  return date.toISOString()
}
