# Đề bài benchmark: tính tiền giỏ hàng và in hóa đơn

Mọi phiên bản dây chuyền dùng chung đề bài này để so thời gian. Đề bài đã đủ thông tin, không cần hỏi thêm.

## Bối cảnh

- Dự án Node.js (CommonJS), Node >= 18. Lúc đầu chỉ có `README.md` và `package.json`.
- Test bằng thư viện có sẵn `node:test` và `node:assert`. Lệnh chạy: `npm test`, đã khai sẵn là `node --test`.
- Không cài package npm nào. Không dùng git.

## Yêu cầu

### 1. Module `src/gio-hang.js`

Module export hàm `tinhHoaDon(donHang)`.

Đầu vào `donHang` có dạng sau. Trường `maGiamGia` không bắt buộc.

```js
{ items: [{ ma, ten, donGia, soLuong }], maGiamGia }
```

**Kiểm tra đầu vào.** Khi sai, ném `Error` có `message` bắt đầu bằng `DU_LIEU_KHONG_HOP_LE:`, sau đó nêu vị trí hoặc trường bị sai.

- `donHang` là object.
- `items` là mảng không rỗng.
- Với mỗi item:
  - `ma` và `ten` là chuỗi khác rỗng sau khi trim.
  - `donGia` là số nguyên >= 0.
  - `soLuong` là số nguyên >= 1.
- `maGiamGia`, nếu có, phải là chuỗi. Chuỗi rỗng hoặc chỉ có khoảng trắng nghĩa là không dùng mã.

**Gộp dòng trùng `ma`.**

- Cộng dồn `soLuong`.
- Giữ `ten` của dòng xuất hiện đầu tiên.
- Giữ thứ tự theo lần xuất hiện đầu tiên.
- Cùng `ma` nhưng khác `donGia`: ném lỗi `DU_LIEU_KHONG_HOP_LE:`.

**Cách tính.** Đơn vị là đồng, mọi số tiền là số nguyên.

1. `thanhTien` của mỗi dòng = `donGia × soLuong`. `tamTinh` = tổng các `thanhTien`.
2. Mã giảm giá được trim, rồi so khớp không phân biệt hoa thường:

   | Mã | Tiền giảm | `canhBao` |
   |----|-----------|-----------|
   | `GIAM10` | 10% tạm tính, làm tròn xuống đến đồng, tối đa 50.000 | `null` |
   | `GIAM50K`, khi tạm tính >= 300.000 | 50.000 | `null` |
   | `GIAM50K`, khi tạm tính < 300.000 | 0 | `"CHUA_DU_DIEU_KIEN"` |
   | Mã khác | 0 | `"MA_KHONG_HOP_LE"` |
   | Không dùng mã | 0 | `null` |

   Tiền giảm không bao giờ vượt tạm tính.
3. `sauGiam` = `tamTinh − giam`.
4. `vat` = `Math.round(sauGiam × 8 / 100)`.
5. `phiVanChuyen` = 30.000 nếu `sauGiam < 500.000`, ngược lại = 0.
6. `tongCong` = `sauGiam + vat + phiVanChuyen`.

**Kết quả trả về:**

```js
{ dong: [{ ma, ten, donGia, soLuong, thanhTien }], tamTinh, giam, vat, phiVanChuyen, tongCong, canhBao }
```

### 2. CLI `src/cli.js`

Cách gọi: `node src/cli.js <duong-dan-file-don-hang.json>`. File JSON có cùng dạng với `donHang` ở trên.

| Tình huống | Đầu ra | Exit code |
|------------|--------|-----------|
| Thành công | Hóa đơn ra stdout (xem định dạng bên dưới) | 0 |
| Thiếu tham số | Hướng dẫn sử dụng ra stderr | 2 |
| File không tồn tại, JSON hỏng hoặc dữ liệu không hợp lệ | Một dòng lỗi dễ hiểu ra stderr, không in stack trace | 1 |

Định dạng hóa đơn khi thành công:

- Có từng dòng hàng.
- Có các dòng `Tạm tính`, `Giảm giá`, `VAT 8%`, `Phí vận chuyển`, `Tổng cộng`.
- Nếu có cảnh báo, thêm dòng `Cảnh báo: <mã cảnh báo>`.
- Số tiền có dấu chấm ngăn nghìn và hậu tố ` đ`, ví dụ `399.360 đ`.

### 3. Test

`npm test` chạy toàn bộ test và phải pass.

## Ví dụ kiểm tra

Đầu vào:

- `items`: A "Áo" 150.000 × 2 và B "Mũ" 80.000 × 1.
- `maGiamGia`: `" giam10 "`.

Kết quả mong đợi:

| Trường | Giá trị |
|--------|---------|
| `tamTinh` | 380.000 |
| `giam` | 38.000 |
| `sauGiam` | 342.000 |
| `vat` | 27.360 |
| `phiVanChuyen` | 30.000 |
| `tongCong` | 399.360 |
| `canhBao` | `null` |

## Tiêu chí nghiệm thu

- **AC1:** Ví dụ trên cho đúng từng con số.
- **AC2:** Mã giảm giá đúng trong các trường hợp sau:
  - `GIAM10`, kể cả khi chạm mức trần 50.000.
  - `GIAM50K` khi đủ và khi chưa đủ điều kiện.
  - Mã sai.
  - Không dùng mã.
- **AC3:** Kiểm tra đầu vào và gộp dòng trùng mã đúng như mô tả.
- **AC4:** CLI trả đúng exit code 0, 1, 2. Lỗi không in stack trace. Số tiền đúng định dạng.
- **AC5:** `npm test` pass. Không có package ngoài.
