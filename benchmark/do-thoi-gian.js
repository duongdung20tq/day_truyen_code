#!/usr/bin/env node
// Do thoi gian tung agent cua day chuyen tu transcript Claude Code (chi doc).
//
// Dung:
//   node benchmark/do-thoi-gian.js <thu-muc-subagents> [chuoi-loc]
//
// <thu-muc-subagents>: ~/.claude/projects/<du-an>/<session-id>/subagents
// [chuoi-loc]: chi tinh agent co prompt dau tien chua chuoi nay (vi du "chay/v1").
//
// In ra: tung lan goi agent (bat dau, ket thuc, phut, model, effort),
// tong phut agent (cong don) va thoi gian thuc (tu agent dau den agent cuoi).
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const [dir, loc] = process.argv.slice(2);
if (!dir) {
  console.error('Dung: node do-thoi-gian.js <thu-muc-subagents> [chuoi-loc]');
  process.exit(2);
}

const docJsonl = (p) => fs.readFileSync(p, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const rows = [];
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.jsonl'))) {
  const id = f.slice(0, -'.jsonl'.length);
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(path.join(dir, id + '.meta.json'), 'utf8')); } catch { /* khong co meta */ }
  const evs = docJsonl(path.join(dir, f));
  const prompt = evs.find((e) => e.type === 'user' && typeof e.message?.content === 'string')?.message.content || '';
  if (loc && !prompt.replace(/\\/g, '/').includes(loc)) continue;
  const ts = evs.map((e) => Date.parse(e.timestamp)).filter(Number.isFinite);
  if (!ts.length) continue;
  const model = evs.find((e) => e.type === 'assistant' && e.message?.model)?.message.model || '';
  const effort = (JSON.stringify(evs).match(/"effort":"([a-z]+)"/) || [])[1] || '';
  rows.push({ agent: meta.agentType || '?', start: Math.min(...ts), end: Math.max(...ts), model, effort });
}

if (!rows.length) { console.log('Khong tim thay agent nao.'); process.exit(0); }
rows.sort((a, b) => a.start - b.start);
const gio = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour12: false });
const phut = (ms) => (ms / 60000).toFixed(1);
let tongAgent = 0;
const theoVai = {};
for (const r of rows) {
  const ms = r.end - r.start;
  tongAgent += ms;
  theoVai[r.agent] = (theoVai[r.agent] || 0) + ms;
  console.log(`${gio(r.start)} → ${gio(r.end)}  ${r.agent.padEnd(12)} ${phut(ms).padStart(5)} phút  ${r.model} ${r.effort}`);
}
const thucTe = Math.max(...rows.map((r) => r.end)) - rows[0].start;
console.log('\nTheo vai:');
for (const [vai, ms] of Object.entries(theoVai)) {
  console.log(`  ${vai.padEnd(12)} ${phut(ms).padStart(5)} phút (${((100 * ms) / tongAgent).toFixed(0)}%)`);
}
console.log(`\nSố lần gọi agent : ${rows.length}`);
console.log(`Tổng phút agent  : ${phut(tongAgent)}`);
console.log(`Thời gian thực   : ${phut(thucTe)} phút (từ agent đầu tiên đến agent cuối cùng)`);
