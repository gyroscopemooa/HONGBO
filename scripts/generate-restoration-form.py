"""Build the public restoration application with the bundled python-docx runtime."""
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

doc = Document()
section = doc.sections[0]
section.page_width, section.page_height = Inches(8.5), Inches(11)
section.top_margin = section.bottom_margin = Inches(.7)
section.left_margin = section.right_margin = Inches(.8)
for name in ['Normal', 'Title', 'Heading 1', 'Heading 2']:
    style = doc.styles[name]
    style.font.name = 'Malgun Gothic'
    style.font.color.rgb = RGBColor(0, 0, 0)
    style.element.rPr.rFonts.set(qn('w:eastAsia'), 'Malgun Gothic')
    for color in style.element.iter(qn('w:color')):
        for attr in list(color.attrib):
            if attr != qn('w:val'): del color.attrib[attr]
    for border in list(style.element.iter(qn('w:pBdr'))): border.getparent().remove(border)
doc.styles['Normal'].font.size = Pt(11)
doc.styles['Normal'].paragraph_format.space_after = Pt(6)
doc.styles['Normal'].paragraph_format.line_spacing = 1.15
doc.styles['Title'].font.size = Pt(22)
doc.styles['Heading 1'].font.size = Pt(16)
doc.styles['Heading 2'].font.size = Pt(12)
footer = section.footer.paragraphs[0]
footer.alignment = 2
footer.add_run('더홍보 복원 신청서 · 2026년 11월 7일 · ')
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); footer._p.append(field)

def p(text): doc.add_paragraph(text)
def heading(text): doc.add_heading(text, level=1)
def answer(title, count, guidance):
    doc.add_heading(title, level=2)
    p(guidance)
    space = doc.add_paragraph('')
    space.paragraph_format.space_after = Pt(140)
def page(): doc.add_page_break()

doc.add_heading('더홍보 복원 2차 확인 신청서', 0)
p('1차 이의제기 검토 후 관리자가 추가 사실 확인을 요청한 경우 작성하는 양식입니다. 일반적인 내용 보완은 내 홍보의 이의제기로 먼저 요청하세요. 2차 안내를 받은 경우 신청서와 증빙을 지원 메일로 제출해주세요.')
heading('제출 안내')
p('받는 주소  support@thehongbo.com')
p('메일 제목  [복원 신청] 게시글 번호 / 서비스명')
p('제출 파일명  복원신청_게시글번호_서비스명.pdf')
p('자필 작성은 필수가 아닙니다. Word로 작성한 뒤 PDF로 저장하거나 PDF 편집 프로그램으로 입력한 후 제출하세요. 입력 공간이 부족하면 별지를 추가할 수 있습니다.')
p('글자 수 제한이나 글자 수 기입은 없습니다. 확인에 필요한 내용을 자유롭게 작성하고, 공간이 부족하면 별지를 첨부해주세요.')
p('해당하지 않는 세부 질문에는 해당 없음과 이유를 작성하세요. 안내받은 제한 사유가 없으면 먼저 문의하고, 임의로 사유를 단정하지 마세요. 제한으로 글 수정이 불가능한 경우 이 신청서에 수정 원고를 작성하면 됩니다.')
heading('신청인 및 대상 정보')
for label in ['신청일', '더홍보 닉네임', '회신받을 이메일', '서비스명 및 운영 주체', '게시글 번호와 제목', '게시글 주소 및 서비스 공개 주소', '신청 유형  게시글 숨김 / 게시글 차단 / 계정 제한 / 복수 선택', '제한 확인일 및 기존 문의 일자']:
    p(label + '  [작성]')
p('비밀번호·인증번호·신분증 사본·주민등록번호·API 키는 제출하지 마세요. 증빙에 포함된 타인의 개인정보는 가려주세요.')

page(); heading('1 제한 사유 및 서비스 실체')
answer('1 제한 사유 이해 및 소명', '300~1,000', '안내받은 사유를 구체적으로 적고 관련 운영정책 항목을 설명하세요. 텔레그램 등 외부 메신저 유도, 현금·가입 유도, 부실한 홍보 설명, 혜택 없는 가입 요청, 운영·연락 정보 미공개, 보험·렌탈·인터넷·통신 단순 가입 유도 중 해당 사항을 빠짐없이 검토하세요. 동의하지 않는 사유에는 확인 가능한 반박 근거를 제시하세요.')
answer('2 서비스 목적 실제 기능 및 이용 과정', '500~1,500', '누구를 위한 서비스인지, 실제 제공하는 기능과 이용 순서를 구체적으로 설명하세요. 가입 전·후 및 무료·유료 기능을 구분하고, 현금 지급·추천인 가입 외에 사용할 수 있는 기능을 설명하세요. 외부 사이트나 메신저로 이동해야 한다면 목적과 이동 후 과정을 밝히세요. 실제 제공하지 않는 기능을 추가하지 마세요.')
p('서비스 확인용 공개 주소  [작성]')
p('직접 확인 가능한 기능과 화면 이름  [작성]')

page(); heading('2 제공 조건과 수정 내역')
answer('3 가입 결제 혜택 조건 및 운영 정보', '300~1,000', '가입·상담·결제의 필수 여부, 무료 범위, 유료 전환 조건, 해지 또는 환불 안내 경로를 적으세요. 이벤트가 있으면 기간·대상·지급 조건·제외 조건을 설명하세요. 보험·렌탈·인터넷·통신 홍보는 구체적인 이벤트나 혜택과 조건을 기재하세요. 운영 주체 및 공개 문의 경로를 제시하고, 해당 없는 조건은 이유를 적으세요.')
answer('4 제한 사유별 수정 전후와 보완 내용', '500~2,000', '각 제한 사유를 번호로 구분하고 수정 전 문제점 → 수정 후 내용 → 수정 완료일 → 확인 가능한 공개 주소 또는 증빙 번호 순서로 작성하세요. 아직 수정하지 못한 부분은 미완료로 표시하고 계획을 구분하세요. 단순히 수정 완료라고 쓰지 말고 달라진 문장과 기능을 제시하세요.')
p('작성 형식 예시  사유 1 / 수정 전 / 수정 후 / 완료일 / 증빙 번호')

page(); heading('3 복원 후 홍보 내용과 재발 방지')
answer('5 복원 후 게시할 홍보글 원고', '300~1,500', '원고 제목, 서비스 핵심 기능, 이용 방법, 실제 혜택과 조건, 운영·문의 안내를 포함하세요. 가입이나 메신저 이동만 반복 요구하지 마세요. 사이트의 글자 수 제한이 별도로 있으면 최종 등록 시 그 제한을 따르세요. 원고에 포함될 공개 주소는 답변과 구분하여 적으세요.')
answer('6 재발 방지 계획 및 복원 요청 이유', '300~1,000', '문제 발생 원인과 확인 절차, 향후 홍보글 검수 담당, 정보 변경 시 수정 방법, 문의 대응 경로, 동일 위반 예방 계획을 적으세요. 현재 복원이 가능하다고 판단하는 구체적인 이유와 남아 있는 확인 사항도 설명하세요.')
p('복원 요청 범위  [게시글 번호별 복원 / 계정 제한 해제 / 각각 구분하여 작성]')

page(); heading('4 증빙 목록과 제출 확인')
p('기능·혜택 조건·운영 정보·문의 방법 및 수정 전후를 확인할 수 있는 공개 주소나 화면 자료를 정리하세요. 증빙을 만들기 위해 허위 정보를 게시하지 마세요. 비공개 내부 시스템 접근 권한이나 비밀번호는 제출하지 마세요.')
table = doc.add_table(rows=1, cols=4)
table.style = 'Table Grid'
for cell, text in zip(table.rows[0].cells, ['번호', '파일명 또는 공개 주소', '확인할 내용', '촬영 또는 수정일']): cell.text = text
for i in range(1, 5):
    cells = table.add_row().cells
    for cell, text in zip(cells, [str(i), '[작성]', '[작성]', '[작성]']): cell.text = text
p('추가 증빙은 행을 늘려 작성하고 본문의 증빙 번호와 일치시켜주세요.')
doc.add_heading('제출 전 확인', level=2)
for text in ['신청 대상 글 번호와 회신 이메일을 확인했습니다.', '필요한 설명을 작성했습니다.', '수정 전후와 증빙을 서로 연결해 설명했습니다.', '확인되지 않은 사실과 허위 혜택을 작성하지 않았습니다.', '비밀번호 등 민감정보를 제외하고 타인의 개인정보를 가렸습니다.', '작성된 신청서와 필요한 증빙을 이메일에 직접 첨부했습니다.']:
    p('□ ' + text)
doc.add_heading('신청인 확인', level=2)
p('본인은 작성 내용이 사실에 근거함을 확인합니다. 추가 자료나 보완 요청이 있을 수 있으며, 신청만으로 복원이나 계정 제한 해제가 보장되지 않음을 이해합니다. 검토 중 기존 제한은 유지됩니다. 제출 자료는 복원 검토와 회신을 위해 처리되며 개인정보처리방침을 확인할 수 있습니다.')
p('확인일  [작성]                 신청인 이름 또는 닉네임  [작성]')
p('신청 안내  https://www.thehongbo.com/restoration\n운영정책  https://www.thehongbo.com/policy\n개인정보처리방침  https://www.thehongbo.com/privacy')
out = Path(__file__).resolve().parents[1] / 'public/downloads/hongbo-restoration-form.docx'
out.parent.mkdir(parents=True, exist_ok=True)
doc.save(out)
print(out)
