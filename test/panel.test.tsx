import { afterEach, expect, test } from 'bun:test'
import { ownershipWarning } from '../src/panel.js'
import { daylightRuntimeStatus } from '../src/presentation-runtime.js'

afterEach(() => daylightRuntimeStatus.setState({ owners: new Map() }))

test('the ownership warning does not attribute another viewer conflict to this one', () => {
  daylightRuntimeStatus.setState({
    owners: new Map([[Symbol('second-view'), 'other-atmosphere']]),
  })
  const warning = ownershipWarning(daylightRuntimeStatus.getState().owners)
  expect(warning).toContain('At least one open view is owned by another atmosphere')
  expect(warning).not.toContain('owns this view')
})
