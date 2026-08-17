// frontend/src/utils/__tests__/categoryIcons.spec.js
import { describe, it, expect } from 'vitest'
import { iconForCategory, colorForCategory } from '../categoryIcons'

describe('iconForCategory', () => {
  it('returns the matching icon for a known category', () => {
    expect(iconForCategory('food')).toBe('/sprites/quest-food.png')
  })

  it('falls back to the "other" icon for an unknown category', () => {
    expect(iconForCategory('not-a-category')).toBe('/sprites/quest-other.png')
  })
})

describe('colorForCategory', () => {
  it('returns a distinct color per known category', () => {
    const categories = ['food', 'movie', 'outdoors', 'nightlife', 'shopping', 'other']
    const colors = categories.map(colorForCategory)

    colors.forEach((color) => expect(color).toMatch(/^#[0-9a-f]{6}$/i))
    expect(new Set(colors).size).toBe(categories.length)
  })

  it('falls back to the "other" color for an unknown category', () => {
    expect(colorForCategory('not-a-category')).toBe(colorForCategory('other'))
  })
})
