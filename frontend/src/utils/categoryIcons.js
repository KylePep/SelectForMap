// frontend/src/utils/categoryIcons.js
const ICONS = {
  food: '/sprites/quest-food.png',
  movie: '/sprites/quest-movie.png',
  outdoors: '/sprites/quest-outdoors.png',
  nightlife: '/sprites/quest-nightlife.png',
  shopping: '/sprites/quest-shopping.png',
  other: '/sprites/quest-other.png',
}

export function iconForCategory(category) {
  return ICONS[category] || ICONS.other
}
