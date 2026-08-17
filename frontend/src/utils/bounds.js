// Center-distance-vs-viewport-size heuristic: if the new center has moved
// more than `thresholdRatio` of the old viewport's height/width, treat it
// as a meaningful pan that warrants an explicit "Explore this area" prompt
// rather than a silent refetch.
export function boundsChangedSignificantly(lastBounds, currentBounds, thresholdRatio = 0.5) {
  if (!lastBounds) return false

  const lastCenterLat = (lastBounds.min_lat + lastBounds.max_lat) / 2
  const lastCenterLng = (lastBounds.min_lng + lastBounds.max_lng) / 2
  const currentCenterLat = (currentBounds.min_lat + currentBounds.max_lat) / 2
  const currentCenterLng = (currentBounds.min_lng + currentBounds.max_lng) / 2

  const latSpan = lastBounds.max_lat - lastBounds.min_lat
  const lngSpan = lastBounds.max_lng - lastBounds.min_lng

  const latMoved = Math.abs(currentCenterLat - lastCenterLat)
  const lngMoved = Math.abs(currentCenterLng - lastCenterLng)

  return latMoved > latSpan * thresholdRatio || lngMoved > lngSpan * thresholdRatio
}
