import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  {
    // React Compiler is not enabled. Existing forms synchronize fetched data
    // and validation state in effects; retain the runtime Rules of Hooks checks.
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
  globalIgnores(['.next/**', '.gst-private/**', 'node_modules/**', 'data/**', 'next-env.d.ts']),
])
