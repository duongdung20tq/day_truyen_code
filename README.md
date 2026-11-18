# Dây chuyền 4 agent `/day_chuyen_all` — v2.1

Gói gồm 1 slash command và 4 subagent cho Claude Code. Luồng chạy là Planner → Coder → Tester ‖ Reviewer; các agent bàn giao cho nhau qua thư mục `.bangiao/` trong dự án.

Gói dành cho dự án **không dùng git**:

- Không agent nào chạy lệnh git, không commit, không merge.
- Thay cho `git diff`, dây chuyền chụp bản gốc của dự án trước khi sửa, rồi tạo diff để Reviewer soát.

## Luồng chạy

```text
/day_chuyen_all <yêu cầu | đường dẫn file yêu cầu>

Bước 0  Điều phối viên  lưu trữ .bangiao/ cũ, ghi giờ bắt đầu,
                        chụp bản gốc dự án vào .bangiao/ban-goc/ (tar)
Bước 1  dc-planner      Opus,   effort medium → .bangiao/ke-hoach.md
Bước 2  dc-coder        Sonnet, effort medium → code + .bangiao/thay-doi.md
        Điều phối viên  tạo .bangiao/thay-doi.diff (diff -ruN bản gốc với bản hiện tại)
Bước 3  dc-tester       Sonnet, effort medium → .bangiao/ket-qua-test.md   ┐ chạy
        dc-reviewer     Opus,   effort medium → .bangiao/danh-gia.md       ┘ song song
                        (Reviewer soát MỌI đoạn trong diff, kể cả chỗ Coder không kể)
Bước 4  Có lỗi test hoặc lỗi review → 1 vòng sửa gộp:
        Coder sửa tất cả lỗi → tạo lại diff → Tester chạy lại ‖ Reviewer chỉ xem phần mới đổi
        (tối đa 3 vòng; các agent được gọi tiếp bằng SendMessage nên vẫn giữ ngữ cảnh)
Bước 5  Reviewer kiểm chất lượng test (gọi tiếp agent cũ, hoặc đã làm luôn ở bước 3)
Bước 6  Báo cáo: kết quả, file đã đổi, test x/y, số vòng sửa, thời gian chạy
```

## Cài nhanh (cho thành viên trong đội)

```bash
git clone <url-repo> day_truyen_code
cd day_truyen_code
powershell -ExecutionPolicy Bypass -File .\cai-dat.ps1   # Windows
bash cai-dat.sh                                         # macOS / Linux / Git Bash
```

Mở phiên Claude Code mới rồi gõ `/day_chuyen_all <việc cần làm>`. Chi tiết xem mục [Cài đặt](#cài-đặt).

## Kết quả đo

Chi tiết và cách đo nằm trong [benchmark/ket-qua.md](benchmark/ket-qua.md). Mỗi cấu hình mới chạy một lần (n = 1); mỗi phép so sánh được chấm thêm bằng một bộ kiểm tra độc lập.

| Phép so sánh | v1 | Bản mới | Chất lượng (bộ kiểm tra độc lập) |
|--------------|----|---------|----------------------------------|
| Bài làm mới; phiên để `max`; v1 có 1 vòng sửa | 27,5 phút | v2: **3,8 phút (−86%)** | 12/12 = 12/12 |
| Bài sửa code có sẵn (CR-01); v1 ở `xhigh` như bạn hay dùng | 7,4 phút | v2.1: **4,4 phút (−41%)** | 24/24 = 24/24 |

Thí nghiệm riêng từng vai, 45 lượt agent, có cài lỗi và đột biến, cho ba kết luận chính:

- **`xhigh` và `max` không làm kết quả tốt hơn ở bất kỳ vai nào, nhưng chậm 2,5–10 lần.**
  - Planner `xhigh`: 144 giây; `max`: 492 giây; `medium`: 56 giây. Cả ba cho kế hoạch dẫn tới code đúng 24/24.
  - Reviewer `max`: 492 giây, bắt 5/6 lỗi, bằng đúng Reviewer `medium` (48 giây).
- **Diff so với bản gốc là thứ nâng chất lượng review mạnh nhất.**
  - Một dòng sửa lén vào hàm cũ lọt qua *mọi* cấu hình Reviewer khi không có diff, từ `low` tới `max`.
  - Khi có diff, từ mức `medium` trở lên đều bắt được.
- **Coder và Tester:** effort cao hơn không làm code đúng hơn hay test bắt được nhiều lỗi hơn. Sonnet `medium` nhanh nhất hoặc gần nhanh nhất.

## Cài đặt

Yêu cầu:

- Claude Code đọc được khóa `effort` trong frontmatter của agent. Đã kiểm trên bản 2.1.326.
- Bash có `tar` và `diff`. Git Bash trên Windows, macOS và Linux đều có sẵn.

**Windows (PowerShell):**

```powershell
# Dùng cho mọi dự án: cài vào ~\.claude
powershell -ExecutionPolicy Bypass -File .\cai-dat.ps1

# Chỉ dùng cho 1 dự án: cài vào <dự án>\.claude
powershell -ExecutionPolicy Bypass -File .\cai-dat.ps1 -PhamVi project -DuAn D:\duong\dan\du-an
```

**macOS / Linux / Git Bash:**

```bash
bash cai-dat.sh                              # mọi dự án: ~/.claude
bash cai-dat.sh project /duong/dan/du-an     # 1 dự án: <dự án>/.claude
```

- Script cài 5 file: 4 file `agents/dc-*.md` và `commands/day_chuyen_all.md`.
- File trùng tên đã có được sao lưu vào `.claude/day-chuyen-sao-luu/<thời-điểm>/` trước khi ghi đè. Muốn quay về bản cũ thì chép lại từ thư mục này.
- **Sau khi cài, mở phiên Claude Code mới.** Phiên đang mở không tự nạp agent vừa cài.

## Cách dùng

```text
/day_chuyen_all Thêm chức năng xuất báo cáo Excel theo tháng, kèm test
/day_chuyen_all docs/yeu-cau-bao-cao.md
```

Dây chuyền dừng lại hỏi bạn khi:

- Planner có câu hỏi ảnh hưởng phạm vi.
- Coder báo `BLOCKED`.
- Reviewer báo `CHẶN`.
- Đã sửa hết 3 vòng mà vẫn còn lỗi.

Hồ sơ của mỗi lần chạy nằm trong `.bangiao/`:

- Kế hoạch, thay đổi, kết quả test, đánh giá.
- Thêm `thay-doi.diff` và bản gốc `ban-goc/`.

Hồ sơ của lần chạy trước được chuyển vào `.bangiao/luu-tru/<thời-điểm>/`. Thư mục này lớn dần theo thời gian, nên thỉnh thoảng hãy dọn tay.

## Thay đổi so với v1 và lý do

| Thay đổi | Lý do (số đo) |
|----------|---------------|
| Khai `effort` cố định trong từng agent: Planner `medium`, Reviewer `medium`, Coder và Tester `medium` | v1 không khai `effort` nên agent Opus thừa hưởng mức của phiên (`xhigh`/`max`). Planner và Reviewer chiếm 54–89% thời gian v1, gần như toàn bộ là thời gian suy nghĩ. Thí nghiệm cho thấy `xhigh`/`max` không cho kết quả tốt hơn. |
| Reviewer soát diff so với bản gốc, do điều phối viên tạo bằng `tar` + `diff` | Không có diff, mọi cấu hình đều lọt một dòng sửa lén vào hàm cũ. Có diff, từ mức `medium` trở lên đều bắt được. |
| Tester và Reviewer chạy song song | Reviewer đọc code không cần chờ kết quả test. |
| Reviewer kiểm luôn chất lượng test nếu kết quả test đã có; nếu chưa có thì được gọi tiếp bằng `SendMessage` | Không phải gọi agent mới phải đọc lại từ đầu. |
| Gộp vòng sửa: lỗi test và lỗi review được sửa trong cùng một lượt, tối đa 3 vòng tính chung | v1 tách thành vòng Coder↔Tester (tối đa 3) và vòng review (tối đa 2), chạy nối tiếp. |
| Vòng sửa gọi tiếp agent cũ bằng `SendMessage`; Reviewer chỉ xem phần mới đổi | Agent còn ngữ cảnh nên không phải đọc lại dự án. Nếu bản Claude Code không có `SendMessage`, điều phối viên gọi agent mới, chậm hơn nhưng vẫn đúng. |
| Coder tự rà theo danh sách kiểm; Reviewer chỉ đưa vào "Lỗi phải sửa" khi sai AC, sai hành vi, có thể mất dữ liệu, có lỗ hổng bảo mật hoặc test không kiểm thật | Bớt vòng sửa do góp ý nhỏ. |
| Planner viết ngắn và có mục "Giao diện công khai" | Kế hoạch v1 dài 327 dòng cho một bài nhỏ. Giao diện ghi rõ giúp Tester và Reviewer chạy song song mà vẫn bám cùng một hợp đồng. |
| Báo cáo cuối có thời gian chạy | Để bạn tự theo dõi tốc độ qua từng lần chạy. |

## Tùy chỉnh

- **Việc lớn hoặc yêu cầu mơ hồ:** có thể nâng `effort: medium` lên `high` trong `agents/dc-planner.md` và `agents/dc-reviewer.md`. Các bài đã đo chưa cho thấy lợi ích của việc này; đây là phòng xa, và phải đổi lấy thời gian.
- **Không nên dùng `xhigh` / `max`:** chậm 3–10 lần mà không thấy tốt hơn. Ở `max`, Reviewer còn hay phán `CHẶN` để hỏi người.
- **Dự án có thư mục lớn không phải mã nguồn** (dữ liệu, file upload…): thêm `--exclude=./<thư-mục>` vào lệnh `tar` và `-x <thư-mục>` vào lệnh `diff` trong `commands/day_chuyen_all.md`, để bản chụp gốc nhẹ hơn.
- **Giá trị hợp lệ của `effort`:** `low`, `medium`, `high`, `xhigh`, `max`.

## Đo lại trên máy của bạn

Xem mục "Cách đo lại" trong [benchmark/ket-qua.md](benchmark/ket-qua.md). Hãy chạy dây chuyền trên bản sao **nằm ngoài thư mục gói**, để agent không đọc được bộ kiểm tra.

```bash
# Thời gian từng agent, đọc từ transcript của phiên đã chạy dây chuyền
node benchmark/do-thoi-gian.js ~/.claude/projects/<thư-mục-dự-án>/<session-id>/subagents [chuỗi-lọc]

# Chấm độc lập
DU_AN=<thư-mục-đã-chạy> node --test benchmark/kiem-tra-doc-lap.test.js   # đề làm mới, 12 ca
DU_AN=<thư-mục-đã-chạy> node --test benchmark/kiem-tra-cr-01.test.js     # CR-01, 24 ca
```

## Cấu trúc thư mục

```text
agents/                 4 subagent dc-planner, dc-coder, dc-tester, dc-reviewer
commands/               slash command day_chuyen_all
cai-dat.ps1, cai-dat.sh script cài đặt (có sao lưu)
benchmark/
  de-bai.md                  đề làm mới (giỏ hàng)
  cr-01.md                   đề sửa code có sẵn (nhiều mã giảm giá, FREESHIP, --json)
  mau/                       dự án mẫu ban đầu
  do-thoi-gian.js            đo thời gian từ transcript
  kiem-tra-doc-lap.test.js   bộ kiểm tra độc lập cho de-bai.md
  kiem-tra-cr-01.test.js     bộ kiểm tra độc lập cho cr-01.md
  ket-qua.md                 kết quả đo và thí nghiệm
```
