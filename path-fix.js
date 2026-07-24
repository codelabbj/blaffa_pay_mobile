const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');

// Fix webpack runtime: ensure d.p (webpack public path) is "/_next/"
// This is needed because Next.js with output:'export' sometimes sets it to "./_next/"
// which breaks dynamic chunk loading in nested routes on Capacitor Android.
function fixWebpackRuntime(chunksDir) {
  if (!fs.existsSync(chunksDir)) {
    console.warn('Warning: _next/static/chunks directory not found. Run `next build` first.');
    return;
  }

  const files = fs.readdirSync(chunksDir);
  for (const file of files) {
    if (file.startsWith('webpack-') && file.endsWith('.js')) {
      const fullPath = path.join(chunksDir, file);
      let content = fs.readFileSync(fullPath, 'utf8');

      // Replace d.p="./_next/" with d.p="/_next/" (absolute path from origin root)
      const patched = content
        .replace(/d\.p="\.\/(_next\/?)"/g, 'd.p="/$1"')
        .replace(/\.p="\.\/(_next\/?)"/g, '.p="/$1"');

      if (patched !== content) {
        console.log(`Patched webpack public path in: ${file}`);
        fs.writeFileSync(fullPath, patched, 'utf8');
      } else {
        console.log(`webpack public path already correct in: ${file}`);
      }
    }
  }
}

console.log('Starting path fix...');

const webpackChunksDir = path.join(outDir, '_next', 'static', 'chunks');
fixWebpackRuntime(webpackChunksDir);

console.log('Done!');