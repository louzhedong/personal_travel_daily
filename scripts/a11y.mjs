import axe from 'axe-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const reportPath = join(process.cwd(), 'harness', 'a11y-report.md');
mkdirSync(join(process.cwd(), 'harness'), { recursive: true });
writeFileSync(reportPath, `# Accessibility Baseline\n\n- axe-core version: ${axe.version}\n- Scope: topbar, hero, empty states, buttons, dialogs.\n- Gate: focus visible and aria labels are required for new UI.\n`);
console.log(`Accessibility baseline written to ${reportPath}`);
