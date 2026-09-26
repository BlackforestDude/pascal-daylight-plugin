import path from 'node:path'
import { defineConfig } from 'vite'

const host = process.env.PASCAL_EDITOR_ROOT
if (!host) throw new Error('Set PASCAL_EDITOR_ROOT to the isolated Pascal host worktree.')
export default defineConfig({
  root: 'lab',
  server: { port: 5188, strictPort: true, fs: { allow: [path.resolve('.'), host] } },
  build: { outDir: '../lab-dist', emptyOutDir: true },
  oxc: { jsx: { runtime: 'automatic' } },
  define: { 'process.env': JSON.stringify({ NODE_ENV: 'development' }) },
  resolve: {
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', 'zustand'],
    alias: [
      {
        find: '@host/block-paint',
        replacement: path.join(host, 'packages/nodes/src/block/paint.ts'),
      },
      {
        find: '@host/block-geometry',
        replacement: path.join(host, 'packages/nodes/src/block/geometry.ts'),
      },
      { find: /^@pascal-app\/core$/, replacement: path.join(host, 'packages/core/src/index.ts') },
      {
        find: /^@pascal-app\/viewer$/,
        replacement: path.join(host, 'packages/viewer/src/index.ts'),
      },
      {
        find: '@host/lights',
        replacement: path.join(host, 'packages/viewer/src/components/viewer/lights.tsx'),
      },
      {
        find: '@host/ceiling-materials',
        replacement: path.join(host, 'packages/nodes/src/ceiling/materials.ts'),
      },
    ],
  },
})
