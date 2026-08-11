import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so bundled assets resolve when served from the Capacitor
// container (local file/origin), not just a web server root.
export default defineConfig({
  base: './',
  plugins: [react()],
});
