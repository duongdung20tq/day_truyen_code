# Kết quả đo dây chuyền `/day_chuyen_all`

- **Ngày đo:** 18/11/2026.
- **Môi trường:** Windows 11, Claude Code 2.1.326 (VSCode), Node v26.12.1.
- **Kiểm tra trên từng lượt agent:**
  - Model và mức effort thực tế được đọc lại từ transcript của lượt đó, và đều khớp cấu hình định chạy.
  - Đã soát lệnh đọc, tìm kiếm và Bash của từng agent: không agent nào đọc đáp án hay thư mục của cấu hình khác.

Tài liệu gồm ba phần:

- **Phần 1:** so v1 với v2 trên một bài làm mới (greenfield).
- **Phần 2:** thí nghiệm chọn model và effort cho từng vai.
- **Phần 3:** chạy cả dây chuyền để so v1 với v2.1 trên một bài sửa code có sẵn.

---

## Phần 1 — v1 và v2 trên bài làm mới ([de-bai.md](de-bai.md))

| Chỉ số | v1 (effort `max` thừa hưởng từ phiên) | v2 |
|--------|---------------------------------------|----|
| Thời gian thực | 27,5 phút | **3,8 phút (−86%)** |
| Planner | 11,1 phút | 0,9 phút |
| Reviewer | 12,9 phút (2 lượt) | 1,0 phút |
| Vòng sửa | 1 | 0 |
| Bộ kiểm tra độc lập ([kiem-tra-doc-lap.test.js](kiem-tra-doc-lap.test.js), 12 ca) | 12/12 | 12/12 |

Ở phần này v1 chạy ở `max` vì phiên đo để `max`, và v1 có thêm 1 vòng sửa. Cả hai điều đó làm mức giảm lớn hơn so với khi phiên để `xhigh` (xem Phần 3).

---

## Phần 2 — Thí nghiệm chọn model và effort cho từng vai

### Thiết kế

- **Đề:** [cr-01.md](cr-01.md), một yêu cầu thay đổi trên code có sẵn (nhiều mã giảm giá, FREESHIP, CLI `--json`). Đề cố ý có nhiều chỗ dễ sai.
- **Cách đo:** mỗi vai đo riêng bằng thước đo khách quan, các yếu tố khác giữ nguyên.
- **Quy mô:** 45 lượt agent, mỗi cấu hình chạy 1 lần.
- **Bộ kiểm tra độc lập CR-01:** [kiem-tra-cr-01.test.js](kiem-tra-cr-01.test.js), 24 ca. Code tham chiếu đạt 24/24, code chưa làm CR đạt 7/24.

| Vai | Thước đo |
|-----|----------|
| Reviewer | Cài sẵn lỗi vào code sao cho bộ test hiện có vẫn PASS, rồi đếm số lỗi Reviewer bắt được. Thêm 3 "bẫy" (chỗ trông lạ nhưng đúng đề) để đếm báo nhầm. |
| Planner | Một giám khảo chấm mù theo thang 10 điểm viết trước. Sau đó cho cùng một Coder làm theo từng kế hoạch rồi chấm code bằng bộ kiểm tra 24 ca. |
| Coder | Cùng một kế hoạch, chấm code bằng bộ kiểm tra 24 ca. |
| Tester | Viết test cho code đúng, rồi chạy bộ test đó với 22 bản đột biến (mỗi bản chứa một lỗi). Đếm số đột biến bị bắt. |

### Reviewer

Ba bộ lỗi được dùng:

- **Bộ dễ:** 7 lỗi. Kế hoạch ghi rõ từng quy tắc.
- **Bộ khó:** 6 lỗi. Kế hoạch viết ngắn, lỗi tinh vi hơn, gồm cả một dòng sửa lén vào hàm cũ (H7).
- **Bộ khó + diff:** cùng bộ khó, nhưng Reviewer có thêm `thay-doi.diff` so với bản gốc.

| Cấu hình | Bộ dễ | Bộ khó | Bộ khó + diff | Thời gian (dễ / khó / diff) |
|----------|-------|--------|---------------|-----------------------------|
| Opus `low` | 7/7 | 4/6 | 5/6 | 39 / 34 / 35 giây |
| **Opus `medium`** | 7/7 | 5/6 | **6/6** | 50 / 48 / 48 giây |
| Opus `high` | 7/7 | 5/6 | 6/6 | 73 / 77 / 68 giây |
| Opus `xhigh` | 7/7 | 5/6 | — | 148 / 139 giây |
| Opus `max` | 7/7 (phán `CHẶN`) | 5/6 | — | 500 / 492 giây |
| Sonnet `medium` | 7/7 | 5/6 | 6/6 | 57 / 32 / 36 giây |
| Sonnet `high` | 7/7 | 5/6 | — | 44 / 49 giây |
| Fable `medium` | 7/7 | 5/6 (phán `CHẶN`) | — | 73 / 77 giây |

- **Không cấu hình nào báo nhầm** ở 3 bẫy.
- **Không có diff:** mọi cấu hình đều lọt H7, kể cả `xhigh` và `max`.
- **Có diff:** từ mức `medium` trở lên đều bắt H7. Như vậy diff nâng chất lượng nhiều hơn việc tăng effort.
- **Tăng effort:** `xhigh` / `max` không bắt thêm lỗi nào nhưng chậm 3–10 lần. `max` và Fable còn hay phán `CHẶN`, tức dừng dây chuyền để hỏi người.

### Planner

| Cấu hình | Điểm chấm mù /10 | Thời gian | Coder làm theo kế hoạch (24 ca) | Tổng Planner + Coder |
|----------|------------------|-----------|---------------------------------|----------------------|
| Sonnet `medium` | 10 | 37 giây | 24/24, 80 giây | 117 giây |
| Opus `low` | 9,5 | 41 giây | 24/24, 75 giây | 116 giây |
| **Opus `medium`** | 9,5 | 56 giây | 24/24, 65 giây | **121 giây** |
| Sonnet `high` | 9,5 | 56 giây | — | — |
| Opus `high` | 10 | 84 giây | 24/24, 98 giây | 182 giây |
| Fable `medium` | 10 | 105 giây | — | — |
| Opus `xhigh` | 10 | 144 giây | 24/24, 49 giây | 193 giây |
| Opus `max` | 10 | 492 giây | — | — |

- Các kế hoạch 9,5 điểm chỉ bị trừ ở một ý nhỏ: không nói rõ FREESHIP không làm đổi VAT.
- Mọi kế hoạch đều dẫn tới code 24/24.
- Kế hoạch kỹ hơn giúp Coder chạy nhanh hơn. Nhờ vậy Opus `medium` có tổng thời gian ngang hai cấu hình nhanh nhất.

### Coder (cùng kế hoạch)

| Cấu hình | Bộ kiểm tra 24 ca | Thời gian |
|----------|-------------------|-----------|
| **Sonnet `medium`** | 24/24 | **76 giây** |
| Sonnet `low` | 24/24 | 94 giây |
| Sonnet `high` | 24/24 | 123 giây |
| Opus `medium` | 24/24 | 125 giây |
| Haiku `medium` | 24/24 | 147 giây |

### Tester (22 đột biến)

| Cấu hình | Đột biến bị bắt | Số test | Thời gian |
|----------|-----------------|---------|-----------|
| Haiku `medium` | 21/22 | 45 | 133 giây |
| Sonnet `low` | 20/22 | 52 | 135 giây |
| **Sonnet `medium`** | 20/22 | 54 | 146 giây |
| Opus `medium` | 20/22 | 40 | 177 giây |
| Sonnet `high` | 19/22 | 61 | 150 giây |

- Effort cao hơn không làm test tốt hơn.
- Hai đột biến hay lọt nhất là:
  - FREESHIP xét theo thứ tự mã nhập.
  - Gộp dòng giữ tên của dòng sau.
- Đây cũng chính là hai điểm mù của Reviewer khi không có diff. Vì vậy diff là lớp bù cho chỗ Tester bỏ sót.

### Cấu hình được chọn cho v2.1

| Vai | Model / effort | Lý do |
|-----|----------------|-------|
| Planner | Opus `medium` | Chất lượng như các mức cao. Tổng Planner + Coder ngang cấu hình nhanh nhất. `xhigh` / `max` chậm 2,5–9 lần mà không thêm chất lượng. |
| Coder | Sonnet `medium` | 24/24 và nhanh nhất. |
| Tester | Sonnet `medium` | Effort không làm test tốt hơn. `low` và Haiku cho kết quả tương đương; giữ `medium` cho ổn định. |
| Reviewer | Opus `medium` + diff | 6/6 khi có diff, không báo nhầm. Mức cao hơn không bắt thêm lỗi. Reviewer chạy song song với Tester nên không làm tăng tổng thời gian. |

---

## Phần 3 — Kiểm chứng cả dây chuyền trên CR-01: v1 ở `xhigh` và v2.1

- **Điều kiện chạy:**
  - Hai dây chuyền chạy song song, mỗi dây chuyền trên một bản sao riêng của cùng code gốc.
  - v1 chạy với Planner và Reviewer ở `xhigh`, đúng mức trong `settings.json` của người dùng.
- **Kết quả soát:** không dây chuyền nào đọc thư mục của dây chuyền kia.

| Chỉ số | v1 (`xhigh`) | v2.1 |
|--------|--------------|------|
| Thời gian thực | 7,4 phút | **4,4 phút (−41%, nhanh hơn khoảng 1,7 lần)** |
| Tổng phút agent | 7,0 | 4,7 |
| Planner | 3,1 phút (Opus `xhigh`) | 1,1 phút (Opus `medium`) |
| Coder | 1,6 phút | 1,5 phút |
| Tester ‖ Reviewer | 0,3 + 2,0 phút, chạy nối tiếp | 0,7 ‖ 1,3 phút, chạy song song; kiểm test bằng cách gọi tiếp Reviewer cũ |
| Vòng sửa | 0 | 0 |
| Phán quyết | CHỐT | CHỐT |
| Test tự viết | 41/41 | 45/45 |
| Bộ kiểm tra độc lập CR-01 | 24/24 | 24/24 |

---

## Đọc số liệu thế nào cho đúng

1. **Mức giảm thời gian dao động từ 41% đến 86%.** Nó phụ thuộc vào effort của phiên khi chạy v1 (`xhigh` hay `max`) và số vòng sửa v1 phải chạy. Trên các bài đã đo, chất lượng code cuối cùng của hai bản như nhau.
2. **Mỗi cấu hình chỉ chạy 1 lần (n = 1).** Thời gian chạy của LLM dao động giữa các lần. Khác biệt vài giây giữa các cấu hình gần nhau là trong vùng nhiễu.
3. **Đề đo là bài vừa và nhỏ, đã đủ thông tin.**
   - [Inference] Với yêu cầu mơ hồ hoặc codebase rất lớn, Planner và Reviewer ở mức effort cao *có thể* có ích hơn. Trường hợp này chưa đo.
   - Muốn chắc chắn cho việc lớn thì sửa `effort` trong file agent (xem README).
4. **v2/v2.1 trong các lần đo không chạy bằng file agent đã cài.** Claude Code chỉ nạp agent khi mở phiên, nên các lần đo dùng agent `dc-*` đang cài, kèm `model` / `effort` truyền khi gọi và phần khác biệt của v2/v2.1 đưa vào prompt. Nên chạy lại một lần bằng bản đã cài, ở phiên mới.
5. **Lợi ích của diff được chứng minh trong thí nghiệm có cài lỗi.** Trong lần chạy cả dây chuyền ở Phần 3, Coder không sửa gì ngoài phạm vi, nên diff không có dịp bắt thêm lỗi.

## Cách đo lại

Chạy dây chuyền trên một bản sao **nằm ngoài thư mục gói này**. Như vậy agent không đọc được bộ kiểm tra hay kết quả cũ.

```bash
mkdir -p /d/tam/bench && cp -r benchmark/mau /d/tam/bench/lan-1
# Phiên Claude Code mới (đã cài v2.1), mở ở /d/tam/bench/lan-1:
#   /day_chuyen_all <dán nội dung benchmark/de-bai.md>
node benchmark/do-thoi-gian.js ~/.claude/projects/<thư-mục-dự-án>/<session-id>/subagents
DU_AN=/d/tam/bench/lan-1 node --test benchmark/kiem-tra-doc-lap.test.js
```

Với CR-01:

1. Bản gốc là code sau bài đầu tiên.
2. Chạy `/day_chuyen_all` với nội dung `benchmark/cr-01.md`.
3. Chấm bằng `benchmark/kiem-tra-cr-01.test.js`.
