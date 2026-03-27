'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = process.cwd();

function prependToFile(fp, content) {
  let existing = '';
  if (fs.existsSync(fp)) {
    existing = fs.readFileSync(fp, 'utf8');
  }
  fs.writeFileSync(fp, content + existing, 'utf8');
}

function write(opts) {
  const {
    task        = 'unknown-task',
    service     = 'unknown-service',
    profile     = 'default',
    results     = [],
    status      = 'UNKNOWN',
    totalMs     = 0,
    description = '',
  } = opts;

  const now         = new Date();
  const dateStr     = now.toISOString().replace('T', ' ').substring(0, 19);
  const durationFmt = totalMs.toLocaleString() + 'ms';

  const stepSummary = results
    .map((r) => {
      const id = r.stepId || r.id || r.action || '?';
      if (r.status === 'SUCCESS') return id + ' \u2705';
      if (r.status === 'SKIPPED') return id + ' \u23ed';
      return id + ' \u274c';
    })
    .join(' | ');

  // .opushforce.message (overwrite)
  const opushMsg = [
    '[CLI Run] ' + service + ' / ' + task + ' @ ' + dateStr,
    '',
    'Steps executed: ' + (stepSummary || '(none)'),
    'Profile: ' + profile + ' | Duration: ' + durationFmt + ' | Status: ' + status,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, '.opushforce.message'), opushMsg, 'utf8');

  // CHANGE_LOGS.md (prepend)
  const changeLogEntry = [
    '## [' + dateStr + '] ' + service + ' \u2014 ' + task,
    '',
    '- **Service**: ' + service,
    '- **Task**: ' + task,
    '- **Profile**: ' + profile,
    '- **Steps**: ' + (stepSummary || '(none)'),
    '- **Duration**: ' + durationFmt,
    '- **Status**: ' + status,
    '',
    '---',
    '',
  ].join('\n');
  prependToFile(path.join(ROOT, 'CHANGE_LOGS.md'), changeLogEntry);

  // CHANGE_LOGS_USER.md (prepend)
  const successSteps = results.filter((r) => r.status === 'SUCCESS');
  const userDesc     = description || "Thuc hien task '" + task + "' tren " + service;
  const userEntry = [
    '## [' + dateStr + '] ' + userDesc,
    '',
    status === 'SUCCESS'
      ? 'Da thuc hien thanh cong ' + successSteps.length + '/' + results.length + ' buoc tren dich vu ' + service + " voi profile '" + profile + "'."
      : 'Thuc hien ' + successSteps.length + '/' + results.length + ' buoc thanh cong. Trang thai: ' + status + '.',
    '',
    '---',
    '',
  ].join('\n');
  prependToFile(path.join(ROOT, 'CHANGE_LOGS_USER.md'), userEntry);
}

async function exportZip() {
  const archiver = require('archiver');
  const date     = new Date().toISOString().substring(0, 10).replace(/-/g, '');
  const zipName  = 'cli-service-manager-' + date + '.zip';
  const zipPath  = path.join(ROOT, zipName);

  const output  = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log('[SUCCESS] ZIP tao thanh cong: ' + zipName + ' (' + archive.pointer() + ' bytes)');
      resolve(zipPath);
    });
    archive.on('error', reject);
    archive.pipe(output);

    const EXCLUDE_DIRS = ['node_modules', 'logs', 'state', '.git'];

    function addDir(dirPath, zipBase) {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        if (EXCLUDE_DIRS.includes(entry)) continue;
        const fullPath = path.join(dirPath, entry);
        const zipEntry = zipBase + '/' + entry;
        const stat     = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addDir(fullPath, zipEntry);
        } else {
          // Skip configs/*.yaml but keep *.example.yaml
          if (zipBase.includes('configs') && entry.endsWith('.yaml') && !entry.endsWith('.example.yaml')) continue;
          archive.file(fullPath, { name: zipEntry });
        }
      }
    }

    addDir(ROOT, 'cli-service-manager');
    archive.finalize();
  });
}

module.exports = { write, exportZip };
