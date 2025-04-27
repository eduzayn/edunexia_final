/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    setupFiles: './client/src/setupTests.ts'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src')
    }
  }
}) 