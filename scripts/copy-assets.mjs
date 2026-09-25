import { cp, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ortSource = join(root, 'node_modules', 'onnxruntime-web', 'dist');
const ortTarget = join(root, 'public', 'ort');
const tessSource = join(root, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js');
const tessTarget = join(root, 'public', 'tesseract', 'worker.min.js');
const coreSource = join(root, 'node_modules', 'tesseract.js-core');
const tessDir = join(root, 'public', 'tesseract');
const webIconDir = join(root, 'public', 'icons');

await mkdir(ortTarget, { recursive: true });
await mkdir(tessDir, { recursive: true });
await mkdir(webIconDir, { recursive: true });
for (const file of await readdir(ortSource)) {
  if (file.endsWith('.wasm') || (file.startsWith('ort-wasm-') && file.endsWith('.mjs'))) {
    await cp(join(ortSource, file), join(ortTarget, file));
  }
}
await cp(tessSource, tessTarget);
for (const file of await readdir(coreSource)) {
  if (file.startsWith('tesseract-core') && (file.endsWith('.js') || file.endsWith('.wasm'))) {
    await cp(join(coreSource, file), join(tessDir, file));
  }
}
for (const file of ['64x64.png', '128x128.png']) {
  await cp(join(root, 'src-tauri', 'icons', file), join(webIconDir, file));
}
console.log('Copied local ONNX and Tesseract runtime assets.');
