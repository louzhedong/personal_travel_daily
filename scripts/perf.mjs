import { statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const reportPath = join(root, 'harness', 'perf-baseline.md');
const exists = existsSync(dist);
const size = exists ? statSync(dist).size : 0;
mkdirSync(join(root, 'harness'), { recursive: true });
writeFileSync(reportPath, `# Performance Baseline\n\n- Dist exists: ${exists}\n- Dist root size marker: ${size}\n- LCP target: <= 2500ms on dashboard smoke.\n- Offline shell: home, trip today, photos, reminders.\n`);
console.log(`Performance baseline written to ${reportPath}`);
