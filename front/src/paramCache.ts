export const cache = new Map<string, Float32Array>()

export function clearCache() {
  cache.clear()
}
