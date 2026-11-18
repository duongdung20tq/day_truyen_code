// Bo kiem tra doc lap (hop den) cho de bai benchmark/de-bai.md.
// Chay: DU_AN=benchmark/chay/<ten-lan-chay> node --test benchmark/kiem-tra-doc-lap.test.js
// Chi kiem nhung gi de bai bat buoc; khong phu thuoc test do day chuyen tu viet.
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

const item = (ma, ten, donGia, soLuong) => ({ ma, ten, donGia, soLuong });
const tom = (kq) => ({
  tamTinh: kq.tamTinh, giam: kq.giam, vat: kq.vat,
  phiVanChuyen: kq.phiVanChuyen, tongCong: kq.tongCong, canhBao: kq.canhBao,
});
const loi = (fn) => assert.throws(fn, (e) => e instanceof Error && /^DU_LIEU_KHONG_HOP_LE:/.test(e.message));

test('AC1 vi du mau', () => {
  const kq = tinhHoaDon({ items: [item('A', 'Áo', 150000, 2), item('B', 'Mũ', 80000, 1)], maGiamGia: ' giam10 ' });
  assert.deepEqual(tom(kq), { tamTinh: 380000, giam: 38000, vat: 27360, phiVanChuyen: 30000, tongCong: 399360, canhBao: null });
  assert.deepEqual(kq.dong.map(d => [d.ma, d.ten, d.donGia, d.soLuong, d.thanhTien]),
    [['A', 'Áo', 150000, 2, 300000], ['B', 'Mũ', 80000, 1, 80000]]);
});

test('AC2 GIAM10 cham tran 50.000', () => {
  const kq = tinhHoaDon({ items: [item('X', 'Tivi', 600000, 1)], maGiamGia: 'GIAM10' });
  assert.deepEqual(tom(kq), { tamTinh: 600000, giam: 50000, vat: 44000, phiVanChuyen: 0, tongCong: 594000, canhBao: null });
});

test('AC2 GIAM10 lam tron xuong', () => {
  const kq = tinhHoaDon({ items: [item('X', 'Bút', 12345, 1)], maGiamGia: 'Giam10' });
  assert.equal(kq.giam, 1234);
  assert.equal(kq.vat, Math.round((12345 - 1234) * 8 / 100));
});

test('AC2 GIAM50K du dieu kien (dung 300.000)', () => {
  const kq = tinhHoaDon({ items: [item('X', 'Giày', 300000, 1)], maGiamGia: 'giam50k' });
  assert.deepEqual(tom(kq), { tamTinh: 300000, giam: 50000, vat: 20000, phiVanChuyen: 30000, tongCong: 300000, canhBao: null });
});

test('AC2 GIAM50K chua du dieu kien', () => {
  const kq = tinhHoaDon({ items: [item('X', 'Giày', 299000, 1)], maGiamGia: 'GIAM50K' });
  assert.deepEqual(tom(kq), { tamTinh: 299000, giam: 0, vat: 23920, phiVanChuyen: 30000, tongCong: 352920, canhBao: 'CHUA_DU_DIEU_KIEN' });
});

test('AC2 ma sai va khong dung ma', () => {
  const sai = tinhHoaDon({ items: [item('X', 'Giày', 100000, 1)], maGiamGia: 'XYZ' });
  assert.equal(sai.giam, 0); assert.equal(sai.canhBao, 'MA_KHONG_HOP_LE');
  for (const ma of [undefined, '', '   ']) {
    const don = { items: [item('X', 'Giày', 100000, 1)] };
    if (ma !== undefined) don.maGiamGia = ma;
    const kq = tinhHoaDon(don);
    assert.equal(kq.giam, 0); assert.equal(kq.canhBao, null);
  }
});

test('Phi van chuyen tai bien 500.000', () => {
  assert.equal(tinhHoaDon({ items: [item('X', 'A', 500000, 1)] }).phiVanChuyen, 0);
  assert.equal(tinhHoaDon({ items: [item('X', 'A', 499999, 1)] }).phiVanChuyen, 30000);
  assert.equal(tinhHoaDon({ items: [item('X', 'A', 500000, 1)] }).tongCong, 540000);
});

test('AC3 gop dong trung ma', () => {
  const kq = tinhHoaDon({ items: [item('A', 'Áo', 100000, 1), item('B', 'Mũ', 50000, 1), item('A', 'Áo khác', 100000, 2)] });
  assert.deepEqual(kq.dong.map(d => [d.ma, d.ten, d.soLuong, d.thanhTien]),
    [['A', 'Áo', 3, 300000], ['B', 'Mũ', 1, 50000]]);
  assert.equal(kq.tamTinh, 350000);
  loi(() => tinhHoaDon({ items: [item('A', 'Áo', 100000, 1), item('A', 'Áo', 90000, 1)] }));
});

test('AC3 kiem tra dau vao', () => {
  loi(() => tinhHoaDon(null));
  loi(() => tinhHoaDon({}));
  loi(() => tinhHoaDon({ items: [] }));
  loi(() => tinhHoaDon({ items: 'abc' }));
  loi(() => tinhHoaDon({ items: [item('', 'A', 1, 1)] }));
  loi(() => tinhHoaDon({ items: [item('A', '   ', 1, 1)] }));
  loi(() => tinhHoaDon({ items: [item('A', 'A', -1, 1)] }));
  loi(() => tinhHoaDon({ items: [item('A', 'A', 1.5, 1)] }));
  loi(() => tinhHoaDon({ items: [item('A', 'A', '100', 1)] }));
  loi(() => tinhHoaDon({ items: [item('A', 'A', 1, 0)] }));
  loi(() => tinhHoaDon({ items: [item('A', 'A', 1, 1.5)] }));
  loi(() => tinhHoaDon({ items: [item('A', 'A', 1, 1)], maGiamGia: 123 }));
  // donGia = 0 hop le
  assert.equal(tinhHoaDon({ items: [item('A', 'Quà', 0, 1)] }).tamTinh, 0);
});

function chay(args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd: DU_AN });
}
function ghiTam(ten, noiDung) {
  const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'oracle-')), ten);
  fs.writeFileSync(p, noiDung, 'utf8');
  return p;
}
const coStack = (s) => /\n\s+at\s/.test(s);

test('AC4 CLI thanh cong', () => {
  const f = ghiTam('don.json', JSON.stringify({ items: [item('A', 'Áo', 150000, 2), item('B', 'Mũ', 80000, 1)], maGiamGia: ' giam10 ' }));
  const r = chay([f]);
  assert.equal(r.status, 0, r.stderr);
  for (const s of ['399.360 đ', '380.000 đ', 'Tạm tính', 'Giảm giá', 'VAT 8%', 'Phí vận chuyển', 'Tổng cộng']) {
    assert.ok(r.stdout.includes(s), `stdout thieu "${s}"`);
  }
});

test('AC4 CLI canh bao', () => {
  const f = ghiTam('don.json', JSON.stringify({ items: [item('A', 'Áo', 100000, 1)], maGiamGia: 'XYZ' }));
  const r = chay([f]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('Cảnh báo: MA_KHONG_HOP_LE'));
});

test('AC4 CLI loi', () => {
  const thieu = chay([]);
  assert.equal(thieu.status, 2); assert.ok(thieu.stderr.trim().length > 0);
  const khongCo = chay([path.join(os.tmpdir(), 'khong-ton-tai-' + Date.now() + '.json')]);
  assert.equal(khongCo.status, 1); assert.ok(!coStack(khongCo.stderr), khongCo.stderr);
  const hong = chay([ghiTam('hong.json', '{ items: [')]);
  assert.equal(hong.status, 1); assert.ok(!coStack(hong.stderr), hong.stderr);
  const sai = chay([ghiTam('sai.json', JSON.stringify({ items: [] }))]);
  assert.equal(sai.status, 1); assert.ok(!coStack(sai.stderr), sai.stderr);
  for (const r of [khongCo, hong, sai]) assert.ok(r.stderr.trim().length > 0);
});
