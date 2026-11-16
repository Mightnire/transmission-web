import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // 路由器反向代理配置（支持环境变量动态覆盖，默认对齐物理路由器）
  const routerHost = env.TRANSMISSION_HOST || env.VITE_ROUTER_HOST || '192.168.2.1';
  const routerPort = env.TRANSMISSION_PORT || env.VITE_ROUTER_PORT || '9091';
  const routerUser = env.TRANSMISSION_USER ?? env.VITE_ROUTER_USER ?? 'admin';
  const routerPass = env.TRANSMISSION_PASS ?? env.VITE_ROUTER_PASS ?? 'admin';

  // 组装 HTTP Basic Auth 认证头（开发模式下自动注入，避免浏览器 401 拦截）
  const authHeader = (routerUser || routerPass)
    ? `Basic ${Buffer.from(`${routerUser}:${routerPass}`).toString('base64')}`
    : undefined;

  return {
    plugins: [vue()],
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    server: {
      port: 3000,
      host: true, // 开启局域网监听，方便手机/平板真机连入开发机调试
      proxy: {
        '/transmission': {
          target: `http://${routerHost}:${routerPort}`,
          changeOrigin: true,
          headers: authHeader ? { Authorization: authHeader } : {},
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
  };
});
