import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 3000,
    proxy: {
      '/transmission/rpc': {
        target: 'http://192.168.2.1:9091',
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined, // 全部打包为极简轻量文件
      },
    },
  },
});
