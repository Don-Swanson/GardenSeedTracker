/** Only allow local paths before passing untrusted query values to the router. */
export function safeCallbackPath(value: string | null): string {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/dashboard'
  try {
    const url = new URL(value, 'https://local.invalid')
    if (url.origin !== 'https://local.invalid' || url.pathname.startsWith('//')) return '/dashboard'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/dashboard'
  }
}
