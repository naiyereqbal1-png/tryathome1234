import JSZip from 'jszip';

export async function downloadFullProjectZip(): Promise<void> {
  const zip = new JSZip();

  // 1. Raw Glob all source files in src/
  const srcFiles = import.meta.glob('../src/**/*', { query: '?raw', eager: true });
  for (const path in srcFiles) {
    const relativePath = path.replace('../', '');
    const fileContent = (srcFiles[path] as any)?.default || srcFiles[path];
    if (typeof fileContent === 'string') {
      zip.file(relativePath, fileContent);
    }
  }

  // 2. Add root config files
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://mjpwgqgc7t6bi7asag5uqa.supabase.co';
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcHdnaHFjN3Q2Ymk3YXNhZzV1cWEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNjQ1NDQwMCwiZXhwIjoyMDUyMDMwNDAwfQ...';

  // package.json
  const packageJsonStr = JSON.stringify(
    {
      name: "tryathome-garment-app",
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite --port=3000 --host=0.0.0.0",
        build: "vite build",
        preview: "vite preview",
        clean: "rm -rf dist"
      },
      dependencies: {
        "@google/genai": "^2.4.0",
        "@supabase/ssr": "^0.12.7",
        "@supabase/supabase-js": "^2.116.0",
        "@tailwindcss/vite": "^4.1.14",
        "@types/canvas-confetti": "^1.9.0",
        "@vitejs/plugin-react": "^5.0.4",
        "canvas-confetti": "^1.9.4",
        "dotenv": "^17.2.3",
        "express": "^4.21.2",
        "html2pdf.js": "^0.14.0",
        "jszip": "^3.10.1",
        "lucide-react": "^0.546.0",
        "motion": "^12.23.24",
        "react": "^19.0.1",
        "react-dom": "^19.0.1",
        "vite": "^6.2.3",
        "xlsx": "^0.18.5"
      },
      devDependencies: {
        "@types/node": "^22.14.0",
        "autoprefixer": "^10.4.21",
        "esbuild": "^0.25.0",
        "tailwindcss": "^4.1.14",
        "tsx": "^4.21.0",
        "typescript": "~5.8.2"
      }
    },
    null,
    2
  );
  zip.file('package.json', packageJsonStr);

  // index.html
  zip.file(
    'index.html',
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TRYatHOME - Garments Try at Home</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  );

  // .env
  zip.file(
    '.env',
    `# TRYatHOME Environment Variables for Hostinger
VITE_APP_TITLE="TRYatHOME - Try Garments at Home"
VITE_STORE_NAME="TRYatHOME"
VITE_DEFAULT_PINCODE="822114"
VITE_SUPABASE_URL="${supabaseUrl}"
VITE_SUPABASE_ANON_KEY="${supabaseAnonKey}"
PORT=3000
NODE_ENV=production`
  );

  // .htaccess
  zip.file(
    '.htaccess',
    `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>`
  );

  // vite.config.ts
  zip.file(
    'vite.config.ts',
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});`
  );

  // README_HOSTINGER.md
  zip.file(
    'README_HOSTINGER.md',
    `# TRYatHOME - Hostinger Deployment Guide

## Quick Deployment Steps for Hostinger:
1. Extract this zip file on your local machine or server.
2. Run \`npm install\` to install dependencies.
3. Run \`npm run build\` to build the production output in the \`dist/\` folder.
4. Upload all contents of the \`dist/\` directory to Hostinger \`public_html\`.
5. Upload the included \`.htaccess\` file to \`public_html\` to enable SPA routing.
6. Your site is live with real-time Supabase database sync!
`
  );

  // Generate ZIP blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'TRYatHOME_Hostinger_Full_Source_Code.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
