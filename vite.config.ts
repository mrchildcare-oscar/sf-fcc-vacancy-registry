import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Serve static HTML pages from public/ before SPA fallback
function serveStaticPages() {
  return {
    name: 'serve-static-pages',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0] || '';
        const filePath = path.join(__dirname, 'public', url, 'index.html');
        if (url !== '/' && existsSync(filePath)) {
          res.setHeader('Content-Type', 'text/html');
          res.end(readFileSync(filePath, 'utf-8'));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [serveStaticPages(), react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
