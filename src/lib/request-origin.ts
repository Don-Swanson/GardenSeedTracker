/** Reject browser cross-origin mutations, including hostile same-site subdomains. */
export function isTrustedMutation(request: Request, configuredUrl = process.env.NEXTAUTH_URL): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true
  const origin = request.headers.get('origin')
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false
  if (origin) {
    try {
      return new URL(origin).origin === new URL(configuredUrl || request.url).origin && origin !== 'null'
    } catch {
      return false
    }
  }
  // Non-browser API clients authenticate explicitly. Cookie-authenticated
  // mutations must provide Origin or the browser's same-origin fetch metadata.
  return !request.headers.has('cookie') || request.headers.get('sec-fetch-site') === 'same-origin'
}
