// Bo kiem tra doc lap (hop den) cho benchmark/cr-01.md.
// Chay: DU_AN=<thu-muc-du-an> node --test benchmark/kiem-tra-cr-01.test.js
// Moi ca la mot test rieng de cham diem theo ti le (x/N).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

if (!process.env.DU_AN) throw new Error('Thieu bien moi truong DU_AN');
const DU_AN = path.resolve(process.env.DU_AN);
const { tinhHoaDon } = require(path.join(DU_AN, 'src', 'gio-hang.js'));
const CLI = path.join(DU_AN, 'src', 'cli.js');

const sp = (ma, ten, donGia, soLuong = 1) => ({ ma, ten, donGia, soLuong });
const don = (tamTinh, maGiamGia) => {
  const d = { items: [sp('X', 'Hàng', tamTinh)] };
  if (maGiamGia !== undefined) d.maGiamGia = maGiamGia;
  return d;
};
const so = (kq) => ({
  tamTinh: kq.tamTinh, giam: kq.giam, vat: kq.vat,
  phiVanChuyen: kq.phiVanChuyen, tongCong: kq.tongCong,
});
const loi = (fn) => assert.throws(fn, (e) => e instanceof Error && /^DU_LIEU_KHONG_HOP_LE:/.test(e.message));

// ---------- AC1: chuoi / mang, chuan hoa, loi ----------
test('AC1 chuoi don tuong thich nguoc (vi du cu)', () => {
  const kq = tinhHoaDon({ items: [sp('A', 'Áo', 150000, 2), sp('B', 'Mũ', 80000, 1)], maGiamGia: ' giam10 ' });
  assert.deepEqual(so(kq), { tamTinh: 380000, giam: 38000, vat: 27360, phiVanChuyen: 30000, tongCong: 399360 });
  assert.deepEqual(kq.canhBao, []);
  assert.deepEqual(kq.maDaApDung, ['GIAM10']);
});

test('AC1 khong co ma / mang rong / phan tu rong', () => {
  for (const ma of [undefined, [], ['', '   '], '   ']) {
    const kq = tinhHoaDon(don(100000, ma));
    assert.equal(kq.giam, 0);
    assert.deepEqual(kq.canhBao, []);
    assert.deepEqual(kq.maDaApDung, []);
  }
});

test('AC1 mang co phan tu rong van bo qua (khong tinh vao gioi han 2 ma)', () => {
  const kq = tinhHoaDon(don(300000, ['', 'giam50k', '  ', 'freeship']));
  assert.deepEqual(kq.maDaApDung, ['GIAM50K', 'FREESHIP']);
});

test('AC1 loi: kieu maGiamGia sai', () => {
  loi(() => tinhHoaDon(don(100000, null)));
  loi(() => tinhHoaDon(don(100000, 5)));
  loi(() => tinhHoaDon(don(100000, { ma: 'GIAM10' })));
  loi(() => tinhHoaDon(don(100000, ['GIAM10', 7])));
});

test('AC1 loi: qua 2 ma (ke ca ma khong hop le)', () => {
  loi(() => tinhHoaDon(don(100000, ['X', 'Y', 'FREESHIP'])));
});

test('AC1 loi: trung ma sau chuan hoa', () => {
  loi(() => tinhHoaDon(don(100000, ['giam10', ' GIAM10 '])));
});

test('AC1 loi: GIAM10 + GIAM50K (ke ca khi GIAM50K chua du dieu kien)', () => {
  loi(() => tinhHoaDon(don(400000, ['GIAM10', 'GIAM50K'])));
  loi(() => tinhHoaDon(don(100000, ['giam50k', 'giam10'])));
});

test('AC1 hai ma khong hop le van hop le ve so luong', () => {
  const kq = tinhHoaDon(don(100000, ['X', 'Y']));
  assert.deepEqual(kq.canhBao, ['MA_KHONG_HOP_LE', 'MA_KHONG_HOP_LE']);
  assert.deepEqual(kq.maDaApDung, []);
});

// ---------- AC2: FREESHIP ----------
test('AC2 GIAM50K + FREESHIP', () => {
  const kq = tinhHoaDon(don(300000, ['giam50k', 'freeship']));
  assert.deepEqual(so(kq), { tamTinh: 300000, giam: 50000, vat: 20000, phiVanChuyen: 0, tongCong: 270000 });
  assert.deepEqual(kq.maDaApDung, ['GIAM50K', 'FREESHIP']);
  assert.deepEqual(kq.canhBao, []);
});

test('AC2 FREESHIP xet SAU giam gia (220.000 + GIAM10 -> 198.000)', () => {
  const kq = tinhHoaDon(don(220000, ['GIAM10', 'FREESHIP']));
  assert.deepEqual(so(kq), { tamTinh: 220000, giam: 22000, vat: 15840, phiVanChuyen: 30000, tongCong: 243840 });
  assert.deepEqual(kq.maDaApDung, ['GIAM10']);
  assert.deepEqual(kq.canhBao, ['CHUA_DU_DIEU_KIEN']);
});

test('AC2 FREESHIP xet sau giam gia bat ke thu tu ma nhap', () => {
  const kq = tinhHoaDon(don(220000, ['FREESHIP', 'GIAM10']));
  assert.equal(kq.phiVanChuyen, 30000);
  assert.deepEqual(kq.canhBao, ['CHUA_DU_DIEU_KIEN']);
  assert.deepEqual(kq.maDaApDung, ['GIAM10']);
});

test('AC2 FREESHIP bien 200.000', () => {
  const du = tinhHoaDon(don(200000, 'FREESHIP'));
  assert.deepEqual(so(du), { tamTinh: 200000, giam: 0, vat: 16000, phiVanChuyen: 0, tongCong: 216000 });
  assert.deepEqual(du.maDaApDung, ['FREESHIP']);
  const thieu = tinhHoaDon(don(199999, 'FREESHIP'));
  assert.equal(thieu.phiVanChuyen, 30000);
  assert.deepEqual(thieu.canhBao, ['CHUA_DU_DIEU_KIEN']);
  assert.deepEqual(thieu.maDaApDung, []);
});

test('AC2 FREESHIP khi phi van chuyen von da bang 0', () => {
  const kq = tinhHoaDon(don(600000, ['freeship']));
  assert.deepEqual(so(kq), { tamTinh: 600000, giam: 0, vat: 48000, phiVanChuyen: 0, tongCong: 648000 });
  assert.deepEqual(kq.maDaApDung, ['FREESHIP']);
  assert.deepEqual(kq.canhBao, []);
});

test('AC2 FREESHIP khong lam doi VAT', () => {
  const co = tinhHoaDon(don(250000, 'FREESHIP'));
  const khong = tinhHoaDon(don(250000));
  assert.equal(co.vat, khong.vat);
  assert.equal(co.tongCong, khong.tongCong - 30000);
});

// ---------- AC3: canhBao / maDaApDung ----------
test('AC3 canhBao theo thu tu ma nhap', () => {
  const kq = tinhHoaDon(don(100000, ['XYZ', 'GIAM50K']));
  assert.deepEqual(kq.canhBao, ['MA_KHONG_HOP_LE', 'CHUA_DU_DIEU_KIEN']);
  assert.deepEqual(kq.maDaApDung, []);
  assert.equal(kq.giam, 0);
  const nguoc = tinhHoaDon(don(100000, ['FREESHIP', 'abc']));
  assert.deepEqual(nguoc.canhBao, ['CHUA_DU_DIEU_KIEN', 'MA_KHONG_HOP_LE']);
});

test('AC3 maDaApDung theo thu tu nhap', () => {
  const kq = tinhHoaDon(don(400000, ['freeship', 'giam10']));
  assert.deepEqual(kq.maDaApDung, ['FREESHIP', 'GIAM10']);
  assert.equal(kq.giam, 40000);
  assert.equal(kq.phiVanChuyen, 0);
});

test('AC3 canhBao luon la mang, co key maDaApDung', () => {
  const kq = tinhHoaDon(don(100000));
  assert.ok(Array.isArray(kq.canhBao));
  assert.ok(Array.isArray(kq.maDaApDung));
});

// ---------- AC4: CLI ----------
function chay(args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd: DU_AN, timeout: 20000 });
}
function ghiTam(noiDung) {
  const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cr01-')), 'don.json');
  fs.writeFileSync(p, typeof noiDung === 'string' ? noiDung : JSON.stringify(noiDung), 'utf8');
  return p;
}
const coStack = (s) => /\n\s+at\s/.test(s);
const viDu = { items: [sp('A', 'Áo', 150000, 2), sp('B', 'Mũ', 80000, 1)], maGiamGia: ' giam10 ' };

test('AC4 CLI --json dung truoc duong dan', () => {
  const r = chay(['--json', ghiTam(viDu)]);
  assert.equal(r.status, 0, r.stderr);
  const kq = JSON.parse(r.stdout);
  assert.equal(kq.tongCong, 399360);
  assert.deepEqual(kq.canhBao, []);
  assert.deepEqual(kq.maDaApDung, ['GIAM10']);
});

test('AC4 CLI --json dung sau duong dan', () => {
  const r = chay([ghiTam(viDu), '--json']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).tongCong, 399360);
});

test('AC4 CLI exit 2: tham so la, thieu duong dan, hai duong dan', () => {
  const f = ghiTam(viDu);
  for (const args of [['--xml', f], ['--xml'], ['--json'], [], [f, f]]) {
    const r = chay(args);
    assert.equal(r.status, 2, `args=${JSON.stringify(args)} stdout=${r.stdout}`);
    assert.ok(r.stderr.trim().length > 0);
  }
});

test('AC4 CLI hoa don: khong co canh bao thi khong in dong canh bao', () => {
  const r = chay([ghiTam(viDu)]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('399.360 đ'));
  assert.equal(r.stdout.split(/\r?\n/).filter((l) => l.includes('Cảnh báo')).length, 0);
});

test('AC4 CLI hoa don: moi canh bao mot dong', () => {
  const r = chay([ghiTam({ items: [sp('A', 'Áo', 100000)], maGiamGia: ['XYZ', 'GIAM50K'] })]);
  assert.equal(r.status, 0, r.stderr);
  const dong = r.stdout.split(/\r?\n/).filter((l) => l.includes('Cảnh báo'));
  assert.deepEqual(dong.map((l) => l.trim()), ['Cảnh báo: MA_KHONG_HOP_LE', 'Cảnh báo: CHUA_DU_DIEU_KIEN']);
});

test('AC4 CLI loi du lieu van exit 1 khi co --json', () => {
  const r = chay(['--json', ghiTam({ items: [sp('A', 'Áo', 100000)], maGiamGia: ['GIAM10', 'GIAM50K'] })]);
  assert.equal(r.status, 1);
  assert.ok(r.stderr.trim().length > 0 && !coStack(r.stderr), r.stderr);
  const hong = chay(['--json', ghiTam('{ hong')]);
  assert.equal(hong.status, 1);
  assert.ok(!coStack(hong.stderr));
});

// ---------- AC5: hanh vi cu ----------
test('AC5 hanh vi cu: phi 500.000, tran GIAM10, kiem tra items, gop dong', () => {
  assert.equal(tinhHoaDon(don(500000)).phiVanChuyen, 0);
  assert.equal(tinhHoaDon(don(499999)).phiVanChuyen, 30000);
  assert.equal(tinhHoaDon(don(600000, 'GIAM10')).giam, 50000);
  assert.equal(tinhHoaDon(don(12345, 'GIAM10')).giam, 1234);
  assert.equal(tinhHoaDon(don(299000, 'GIAM50K')).vat, 23920);
  assert.equal(tinhHoaDon(don(12345)).vat, 988); // 987,6 -> Math.round
  loi(() => tinhHoaDon({ items: [sp('A', 'Áo', 100, 0)] }));
  loi(() => tinhHoaDon({ items: [] }));
  const g = tinhHoaDon({ items: [sp('A', 'Áo', 100000, 1), sp('A', 'Áo khác', 100000, 2)] });
  assert.deepEqual(g.dong.map((d) => [d.ma, d.ten, d.soLuong]), [['A', 'Áo', 3]]);
});
