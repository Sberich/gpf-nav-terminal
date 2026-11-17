import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function copyRootCompanionFiles() {
  return {
    name: 'copy-root-companion-files',
    closeBundle() {
      const filesToCopy = [
        'gpfnav69.html',
        'gpfrobo.html',
        'gpfnavrobo.html',
        'sw-port.js',
        'sw-robo.js',
        'manifest-port.json',
        'manifest-robo-v2.json',
        'config.js',
        '_redirects'
      ];
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;

      for (const file of filesToCopy) {
        const rootPath = path.resolve(__dirname, file);
        const publicPath = path.resolve(__dirname, 'public', file);
        const distPath = path.resolve(distDir, file);

        if (!fs.existsSync(distPath)) {
          if (fs.existsSync(publicPath)) {
            fs.copyFileSync(publicPath, distPath);
            console.log(`[Vite Copy Plugin] Copied public/${file} -> dist/${file}`);
          } else if (fs.existsSync(rootPath)) {
            fs.copyFileSync(rootPath, distPath);
            console.log(`[Vite Copy Plugin] Copied root ${file} -> dist/${file}`);
          }
        }
      }
    }
  };
}

export default defineConfig({
  base: './',
  root: '.',
  publicDir: 'public',
  plugins: [copyRootCompanionFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['apexcharts'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
