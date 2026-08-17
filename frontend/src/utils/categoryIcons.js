// frontend/src/utils/categoryIcons.js
const ICONS = {
  food: '/sprites/quest-food.png',
  movie: '/sprites/quest-movie.png',
  outdoors: '/sprites/quest-outdoors.png',
  nightlife: '/sprites/quest-nightlife.png',
  shopping: '/sprites/quest-shopping.png',
  other: '/sprites/quest-other.png',
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
