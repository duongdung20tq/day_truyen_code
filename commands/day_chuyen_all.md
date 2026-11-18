---
description: Dây chuyền 4 agent v2.1 (Planner → Coder → Tester ‖ Reviewer) bàn giao qua .bangiao/, Reviewer soát diff so với bản gốc. Không dùng git.
argument-hint: <mô tả việc cần làm hoặc đường dẫn file yêu cầu>
---

# /day_chuyen_all (v2.1)

Yêu cầu: $ARGUMENTS

Bạn là **điều phối viên**. Không tự viết code — giao việc cho 4 agent, đọc file bàn giao, quyết định bước tiếp.
Dự án không dùng git: không chạy bất kỳ lệnh git nào, không kiểm tra branch/status/diff, không commit/merge.

## Quy tắc tốc độ
1. **Gọi tiếp agent cũ** cho mọi vòng sửa / chạy lại / kiểm test: dùng `SendMessage` tới agentId mà lời gọi `Agent` trả về. Agent còn ngữ cảnh nên không phải đọc lại dự án.
   - `SendMessage` là deferred tool: nạp bằng `ToolSearch` (`select:SendMessage`) trước lần dùng đầu.
   - Không có `SendMessage` hoặc gọi lỗi → gọi `Agent` mới cùng `subagent_type`, ghi rõ "vòng <n>" và file cần đọc.
2. **Tester và Reviewer chạy song song**: đặt 2 lời gọi trong CÙNG một tin nhắn.
3. Chỉ đọc dòng `Status` / `Kết luận` / `Phán quyết` / `Đã kiểm test` và mục lỗi trong file bàn giao. Không tự đọc code dự án.
4. Không truyền `model` / `effort` khi gọi agent — đã khai trong frontmatter của từng agent.

## Bước 0 — Chuẩn bị
1. Nếu `$ARGUMENTS` rỗng → hỏi người dùng việc cần làm rồi dừng.
2. Nếu `$ARGUMENTS` là đường dẫn file → đọc file đó làm yêu cầu.
3. Tạo thư mục `.bangiao/` ở thư mục gốc dự án nếu chưa có.
4. Nếu `.bangiao/` còn file của lần chạy trước → chuyển chúng vào `.bangiao/luu-tru/<YYYYMMDD-HHmmss>/` (không xóa).
5. Ghi giờ bắt đầu (Bash: `date +%H:%M:%S`).
6. Chụp bản gốc để Reviewer có diff (dự án không có git). Chạy ở thư mục gốc dự án:
   ```bash
   mkdir -p .bangiao/ban-goc && tar -cf - --exclude=./.bangiao --exclude=./node_modules --exclude=./.git --exclude=./dist --exclude=./build --exclude=./target --exclude=./bin --exclude=./obj --exclude=./.venv --exclude=./venv --exclude=./__pycache__ . | tar -xf - -C .bangiao/ban-goc
   ```

## Bước 1 — Planner
Gọi Agent `subagent_type: dc-planner` với: yêu cầu đầy đủ, đường dẫn dự án, nhắc ghi `.bangiao/ke-hoach.md`.
- `NEEDS_CONTEXT` hoặc kế hoạch có "Câu hỏi mở" ảnh hưởng phạm vi → trình câu hỏi cho người dùng, **dừng**.
- Tóm tắt kế hoạch (mục tiêu + AC + file sẽ đổi) cho người dùng trong 5-10 dòng, rồi đi tiếp.

## Bước 2 — Coder
Gọi Agent `subagent_type: dc-coder`: "Triển khai theo .bangiao/ke-hoach.md, ghi .bangiao/thay-doi.md". Lưu agentId.
- `BLOCKED` → báo người dùng, dừng.
- Xong thì tạo diff cho Reviewer (chạy ở thư mục gốc dự án; exit 1 là bình thường khi có khác biệt):
  ```bash
  diff -ruN -x .bangiao -x node_modules -x .git -x dist -x build -x target -x bin -x obj -x .venv -x venv -x __pycache__ .bangiao/ban-goc . > .bangiao/thay-doi.diff; test $? -le 1
  ```

## Bước 3 — Tester ‖ Reviewer (song song, vòng 1)
Trong CÙNG một tin nhắn, gọi:
- Agent `dc-tester`: "Vòng 1. Test theo .bangiao/ke-hoach.md và .bangiao/thay-doi.md, ghi .bangiao/ket-qua-test.md". Lưu agentId.
- Agent `dc-reviewer`: "Vòng 1, chế độ code. Review theo .bangiao/ke-hoach.md, .bangiao/thay-doi.md và .bangiao/thay-doi.diff, ghi .bangiao/danh-gia.md". Lưu agentId.

Chờ cả hai xong rồi sang Bước 4.

## Bước 4 — Gộp kết quả
| Tester | Reviewer | Việc tiếp |
|--------|----------|-----------|
| bất kỳ | CHẶN | Dừng, trình lý do + lựa chọn cho người dùng |
| BLOCKED | không CHẶN | Dừng, báo người dùng |
| PASS | CHỐT | Bước 5 |
| FAIL | bất kỳ không CHẶN | Vòng sửa |
| PASS | CẦN SỬA | Vòng sửa |

**Vòng sửa** — tối đa **3 vòng**, đếm chung cho lỗi test và lỗi review:
1. `SendMessage` tới Coder: "Vòng sửa <n>: sửa tất cả lỗi trong .bangiao/ket-qua-test.md (nếu FAIL) và lỗi giao Coder trong .bangiao/danh-gia.md (nếu CẦN SỬA), ghi đè .bangiao/thay-doi.md".
   - Lỗi giao Tester trong `danh-gia.md` → gửi kèm cho Tester ở bước 2 dưới đây.
   - Coder xong → chạy lại lệnh tạo diff ở Bước 2.
2. Trong CÙNG một tin nhắn:
   - `SendMessage` tới Tester: "Vòng <n+1>: chạy lại test (và sửa test theo danh-gia.md nếu có lỗi giao Tester), ghi đè .bangiao/ket-qua-test.md".
   - `SendMessage` tới Reviewer: "Vòng <n+1>, chế độ delta, đọc lại .bangiao/thay-doi.diff (đã tạo lại), ghi đè .bangiao/danh-gia.md".
3. Quay lại bảng ở Bước 4.

Hết 3 vòng vẫn lỗi → dừng, báo lỗi còn lại.

## Bước 5 — Chốt test
- Reviewer đã ghi `Đã kiểm test: Có` → sang Bước 6.
- Ngược lại → `SendMessage` tới Reviewer: "Chế độ test: đọc .bangiao/ket-qua-test.md và file test, ghi đè .bangiao/danh-gia.md".
  - CHỐT → Bước 6.
  - CẦN SỬA (test yếu) → `SendMessage` tới Tester sửa test theo `danh-gia.md` và chạy lại, rồi Reviewer kiểm lại ở chế độ test. Tối đa 1 vòng.
  - Test sửa xong lộ lỗi code (FAIL) → quay lại Vòng sửa (vẫn tính chung tối đa 3 vòng).

## Bước 6 — Báo cáo cuối
Ghi giờ kết thúc (Bash: `date +%H:%M:%S`). Trả cho người dùng (ngắn gọn):
```
Kết quả: CHỐT | DỪNG ở bước <n>
File đã đổi: <danh sách từ thay-doi.md>
Test: <x/y pass>
Cách chạy: <lệnh>
Vòng sửa: <n>
Thời gian: <bắt đầu> → <kết thúc> (<phút>)
Câu hỏi / rủi ro còn lại: ...
Bàn giao: .bangiao/ke-hoach.md, thay-doi.md, ket-qua-test.md, danh-gia.md
```
Không tự commit, không tự merge, không tự deploy.
