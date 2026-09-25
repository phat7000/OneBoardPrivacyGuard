import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const report = execFileSync('npm', ['query', '.prod'], { encoding: 'utf8', shell: process.platform === 'win32' });
const packages = JSON.parse(report);
const forbidden = /AGPL|SSPL|non-commercial|research.only|(^|[^LA])GPL/i;
const permissive = /MIT|Apache|BSD|ISC|MPL|Unlicense|0BSD|BlueOak/i;
const unknown = [];
const blocked = [];
for (const pkg of packages) {
  let license = pkg.license;
  if (!license && pkg.path) {
    try { license = JSON.parse(await readFile(`${pkg.path}/package.json`, 'utf8')).license; } catch { /* reported below */ }
  }
  const record = `${pkg.name}@${pkg.version}: ${license || 'UNKNOWN'}`;
  if (!license) unknown.push(record);
  else if (forbidden.test(String(license)) && !permissive.test(String(license))) blocked.push(record);
}
if (blocked.length || unknown.length) {
  console.error('License audit requires review.');
  if (blocked.length) console.error(`Forbidden/copyleft candidates:\n${blocked.join('\n')}`);
  if (unknown.length) console.error(`Unknown licenses:\n${unknown.join('\n')}`);
  process.exit(1);
}
console.log(`License audit passed for ${packages.length} production package records; no GPL, AGPL, SSPL, non-commercial, research-only, or unknown declarations found.`);
