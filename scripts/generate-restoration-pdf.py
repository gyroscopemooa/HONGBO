"""Create a printable, handwriting-friendly PDF from the existing Word guidance."""
from pathlib import Path
from xml.sax.saxutils import escape

from docx import Document
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/downloads/hongbo-restoration-form.pdf"
pdfmetrics.registerFont(TTFont("Korean", "C:/Windows/Fonts/malgun.ttf"))
W, H = A4
LEFT, WIDTH = 42, W - 84
style = ParagraphStyle("body", fontName="Korean", fontSize=10, leading=16, wordWrap="CJK")
c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle("더홍보 복원 신청서 - 자필 작성용")
page_number = 0
y = 0


def text(value, size=10):
    global y
    s = ParagraphStyle("line", parent=style, fontSize=size, leading=size * 1.6)
    p = Paragraph(escape(value), s)
    _, height = p.wrap(WIDTH, H)
    assert y - height >= 45, "Text exceeds printable area"
    p.drawOn(c, LEFT, y - height)
    y -= height + 8


def page(title):
    global page_number, y
    if page_number:
        c.showPage()
    page_number += 1
    c.setFont("Korean", 9)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawString(LEFT, 26, "더홍보 복원 2차 확인 신청서 · 자필 작성용")
    c.drawRightString(W - LEFT, 26, str(page_number))
    c.setFillColor(colors.black)
    y = H - 42
    text(title, 19)


def blank(label, height=40):
    global y
    text(label)
    assert y - height >= 45
    c.setStrokeColor(colors.HexColor("#bbbbbb"))
    c.rect(LEFT, y - height, WIDTH, height)
    y -= height + 12


paragraphs = list(Document(ROOT / "public/downloads/hongbo-restoration-form.docx").paragraphs)
questions = []
for i, p in enumerate(paragraphs):
    if p.style.name == "Heading 2" and p.text[:1] in "123456":
        questions.append((p.text, paragraphs[i + 1].text))
assert len(questions) == 6

page("더홍보 복원 2차 확인 신청서")
text("관리자가 추가 사실 확인을 요청한 경우 작성합니다. 일반적인 내용 보완은 내 홍보의 이의제기로 먼저 요청해주세요.")
text("출력 후 빈칸과 답변 칸에 자필로 작성하고, 모든 작성 페이지를 스캔하여 PDF로 제출할 수 있습니다. 자필은 필수가 아니며 Word 작성도 가능합니다.")
text("받는 주소: support@thehongbo.com\n메일 제목: [복원 신청] 게시글 번호 / 서비스명")
text("글자 수 제한이나 글자 수 기입은 없습니다. 확인에 필요한 내용을 자유롭게 적어주세요. 공간이 부족하면 별도 종이에 항목 번호를 적어 첨부할 수 있습니다.")
for label in ["신청일 / 더홍보 닉네임", "회신받을 이메일", "서비스명 / 운영 주체", "게시글 번호 / 제목", "게시글 주소 / 서비스 공개 주소"]:
    blank(label, 28)
text("신청 유형: □ 게시글 숨김  □ 게시글 차단  □ 계정 제한 (복수 선택)")
text("제한 확인일 / 기존 문의 일자: __________________________________")
text("비밀번호·인증번호·신분증·주민등록번호·API 키는 제출하지 마세요.")

for i, (title, guidance) in enumerate(questions):
    if i % 2 == 0:
        page(["제한 사유 및 서비스 설명", "제공 조건 및 보완 내용", "홍보글 원고 및 재발 방지"][i // 2])
    else:
        y = H / 2 + 8
    text(title, 13)
    text(guidance)
    # Intentionally leave unrestricted white space: no grid, rules or count field.

page("증빙 및 신청인 확인")
text("공개 주소, 기능·혜택 조건·운영 정보와 수정 전후 화면 자료를 정리합니다. 본문의 증빙 번호와 일치시켜주세요. 타인의 개인정보는 가려주세요.")
blank("증빙 파일명 또는 공개 주소 / 확인할 내용 / 촬영·수정일", 150)

for value in ["신청 대상 글 번호와 회신 이메일을 확인했습니다.", "필요한 설명과 증빙을 준비했습니다.", "비밀번호 등 민감정보를 제외하고 타인의 개인정보를 가렸습니다."]:
    text("□ " + value)
text("본인은 작성 내용이 사실에 근거함을 확인합니다. 추가 자료나 보완 요청이 있을 수 있으며, 신청만으로 복원이나 계정 제한 해제가 보장되지 않음을 이해합니다. 검토 중 기존 제한은 유지됩니다. 제출 자료는 복원 검토와 회신을 위해 처리됩니다.")
blank("복원 요청 범위 · 게시글 번호별 복원 / 계정 제한 해제 등을 구분", 40)
blank("확인일 / 신청인 이름 또는 닉네임 / 서명", 40)
text("신청 안내: https://www.thehongbo.com/restoration")
text("운영정책: https://www.thehongbo.com/policy")
text("개인정보처리방침: https://www.thehongbo.com/privacy")

c.save()
print(f"Created {OUT} ({page_number} pages)")
