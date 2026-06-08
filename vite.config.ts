import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Dev server runs at the root ('/'); the production build is served from a
  // GitHub Pages project subpath. Override with VITE_BASE=/ for a root domain.
  const base =
    process.env.VITE_BASE ?? (command === 'build' ? '/nm-car-import-tax/' : '/');
  return {
    base,
    plugins: [react()],
  };
});
