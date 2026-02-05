/**
 * Creates a .zip package for Microsoft Edge Add-ons store submission.
 * Run: npm run package
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const version = pkg.version || '1.0.0';

const FILES = [
  'manifest.json', 'background.js', 'bionic-core.js', 'content.js', 'content.css',
  'popup.html', 'popup.js', 'settings.html', 'settings.js', 'reader.html', 'reader.js',
  'icons/icon16.png', 'icons/icon32.png', 'icons/icon48.png', 'icons/icon128.png',
  'lib/jszip.min.js', 'lib/pdf.min.mjs', 'lib/pdf.worker.min.mjs', 'lib/mammoth.min.js'
];

async function main() {
  const createArchiver = require('archiver');

  const outZip = path.join(root, `ADHD-Reading-Helper-v${version}.zip`);
  if (fs.existsSync(outZip)) fs.unlinkSync(outZip);

  const archive = createArchiver('zip', { zlib: { level: 9 } });
  const out = fs.createWriteStream(outZip);
  archive.pipe(out);

  for (const f of FILES) {
    const full = path.join(root, f);
    if (fs.existsSync(full)) {
      archive.file(full, { name: f });
    } else if (f.startsWith('lib/') && !fs.existsSync(full)) {
      console.warn('Missing', f, '- run "npm install" first');
    }
  }

  archive.finalize();
  await new Promise((resolve, reject) => {
    out.on('close', resolve);
    archive.on('error', reject);
  });

  const size = (fs.statSync(outZip).size / 1024).toFixed(1);
  console.log('Created:', outZip);
  console.log('Size:', size, 'KB');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
