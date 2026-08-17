// frontend/src/utils/__tests__/categoryIcons.spec.js
import { describe, it, expect } from 'vitest'
import { iconForCategory } from '../categoryIcons'

describe('iconForCategory', () => {
  it('returns the matching icon for a known category', () => {
    expect(iconForCategory('food')).toBe('/sprites/quest-food.png')
  })

  it('falls back to the "other" icon for an unknown category', () => {
    expect(iconForCategory('not-a-category')).toBe('/sprites/quest-other.png')
  })
})
