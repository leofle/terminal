// CI guard: makes sure the HTML pages are well-formed enough to load and that
// every inline <script> block parses as valid JavaScript. Runs on pull requests
// so a syntax error can't be merged into main (and auto-deployed) by accident.
//
// Zero dependencies — uses only Node's built-in `node --check`.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const files = ['index.html', 'resume.html'];
let failed = false;

for (const file of files) {
  let html;
  try {
    html = readFileSync(file, 'utf8');
  } catch {
    console.error(`✗ ${file}: cannot read file`);
    failed = true;
    continue;
  }

  // Basic sanity: it should actually look like an HTML document.
  if (!/<html[\s>]/i.test(html) || !/<\/html>/i.test(html)) {
    console.error(`✗ ${file}: missing <html> … </html>`);
    failed = true;
  }

  // Extract inline scripts (ignore external <script src="…"> with no body).
  const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1])
    .filter((src) => src.trim().length > 0);

  if (blocks.length === 0) {
    console.log(`• ${file}: no inline script to check`);
    continue;
  }

  blocks.forEach((src, i) => {
    const tmp = join(tmpdir(), `check_${file.replace(/\W/g, '_')}_${i}.js`);
    writeFileSync(tmp, src);
    try {
      execFileSync('node', ['--check', tmp], { stdio: 'pipe' });
      console.log(`✓ ${file}: inline script #${i + 1} OK`);
    } catch (e) {
      console.error(`✗ ${file}: inline script #${i + 1} has a syntax error`);
      console.error(String(e.stderr || e.message).trim());
      failed = true;
    }
  });
}

console.log(failed ? '\nSyntax check FAILED' : '\nAll syntax checks passed');
process.exit(failed ? 1 : 0);
