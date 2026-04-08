function resolveWsUrl(url) {
  if (!url || !url.startsWith('/')) return url
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}${url}`
}

export const WS_SERVER_URL = resolveWsUrl(import.meta.env.VITE_WS_SERVER_URL || '/ws')
