// frontend/src/utils/categoryIcons.js
const ICONS = {
  food: '/sprites/quest-food.svg',
  movie: '/sprites/quest-movie.svg',
  outdoors: '/sprites/quest-outdoors.svg',
  nightlife: '/sprites/quest-nightlife.svg',
  shopping: '/sprites/quest-shopping.svg',
  other: '/sprites/quest-other.svg',
}

// Bold, saturated fallback colors (spec §4) so markers stay visible and clickable
// even before the pixel-art sprite assets are dropped into `public/sprites/`.
const COLORS = {
  food: '#e8552d',
  movie: '#7048e8',
  outdoors: '#2f9e44',
  nightlife: '#d6336c',
  shopping: '#f08c00',
  other: '#1c7ed6',
}

export function iconForCategory(category) {
  return ICONS[category] || ICONS.other
}

export function colorForCategory(category) {
  return COLORS[category] || COLORS.other
}
