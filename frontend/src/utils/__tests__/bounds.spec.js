import { describe, it, expect } from 'vitest'
import { boundsChangedSignificantly } from '../bounds'

describe('boundsChangedSignificantly', () => {
  const base = { min_lat: 40, max_lat: 41, min_lng: -75, max_lng: -74 }

  it('returns false when there is no prior bounds (first load)', () => {
    expect(boundsChangedSignificantly(null, base)).toBe(false)
  })

  it('returns false for a small pan within the same area', () => {
    const nudged = { min_lat: 40.05, max_lat: 41.05, min_lng: -75, max_lng: -74 }
    expect(boundsChangedSignificantly(base, nudged)).toBe(false)
  })

  it('returns true once the viewport has moved past the threshold', () => {
    const farAway = { min_lat: 55, max_lat: 56, min_lng: -75, max_lng: -74 }
    expect(boundsChangedSignificantly(base, farAway)).toBe(true)
  })
})
