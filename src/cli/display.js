'use strict';

const Table = require('cli-table3');
const chalk = require('chalk');

function showResultTable(opts) {
  const { taskName = '', profile = '', results = [], totalMs = 0 } = opts;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log('\n' + chalk.bold('Task: ' + taskName + ' | Profile: ' + profile + ' | ' + now));

  const table = new Table({
    head: [chalk.bold('Step'), chalk.bold('Status'), chalk.bold('Duration'), chalk.bold('Output')],
    colWidths: [20, 14, 12, 45],
    style: { head: [] },
  });

  for (const r of results) {
    const stepId   = r.stepId || r.action || r.id || '?';
    const status   = r.status === 'SUCCESS'
      ? chalk.green('\u2705 SUCCESS')
      : r.status === 'SKIPPED'
        ? chalk.yellow('-- SKIPPED')
        : chalk.red('\u274c FAILED');
    const duration = r.durationMs != null ? (r.durationMs.toLocaleString() + 'ms')
      : r.duration_ms != null ? (r.duration_ms.toLocaleString() + 'ms') : '-';
    const output   = summariseOutput(r);
    table.push([stepId, status, duration, output]);
  }

  console.log(table.toString());
  console.log(chalk.dim('Total: ' + totalMs.toLocaleString() + 'ms\n'));
}

function summariseOutput(r) {
  if (r.error)   return chalk.red(truncate(String(r.error), 40));
  if (!r.output) return r.message ? truncate(r.message, 40) : '-';
  const o = r.output;
  if (typeof o === 'object' && o !== null && o.message) {
    const msg = truncate(o.message, 40);
    return msg;
  }
  if (Array.isArray(o)) return o.length + ' items';
  if (typeof o === 'object') {
    const keys = Object.keys(o).filter(k => k !== 'raw' && k !== 'success').slice(0, 3);
    return keys.map((k) => k + '=' + maskIfSensitive(k, o[k])).join(', ') || '-';
  }
  return truncate(String(o), 40);
}

function maskIfSensitive(key, val) {
  const kl = (key || '').toLowerCase().replace(/[_-]/g, '');
  const SENSITIVE = ['token', 'key', 'password', 'secret', 'apikey'];
  if (SENSITIVE.some((s) => kl.includes(s))) return '***';
  return truncate(String(val), 20);
}

function truncate(str, len) {
  if (!str || str.length <= len) return str;
  return str.substring(0, len - 3) + '...';
}

function showActionResultTable(results) {
  const table = new Table({
    head: [chalk.bold('Action'), chalk.bold('Status'), chalk.bold('Duration'), chalk.bold('Detail')],
    colWidths: [22, 14, 12, 45],
    style: { head: [] },
  });

  for (const r of results) {
    const status   = r.success ? chalk.green('\u2705 SUCCESS') : chalk.red('\u274c FAILED');
    const duration = r.durationMs != null ? (r.durationMs.toLocaleString() + 'ms') : '-';
    const detail   = r.message ? truncate(r.message, 42) : '-';
    table.push([r.action || '?', status, duration, detail]);
  }

  console.log(table.toString());
}

module.exports = { showResultTable, showActionResultTable };
