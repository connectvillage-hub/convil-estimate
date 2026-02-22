import io
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from models.estimate import EstimateRequest, EstimateResult

# ── 색상 ──
PRIMARY    = colors.HexColor('#2E75B6')
PRIMARY_LT = colors.HexColor('#EBF3FB')
GRAY_DARK  = colors.HexColor('#333333')
GRAY_MID   = colors.HexColor('#666666')
GRAY_LIGHT = colors.HexColor('#F5F5F5')
GRAY_BDR   = colors.HexColor('#CCCCCC')
WHITE      = colors.white
RED        = colors.HexColor('#CC3333')

# ── 한글 폰트 등록 ──
_FONT_NAME = 'Helvetica'   # fallback

def _register_korean_font() -> str:
    global _FONT_NAME
    # 프로젝트 내 번들 폰트 경로
    bundled_font = os.path.join(os.path.dirname(__file__), '..', 'fonts', 'NanumGothic-Regular.ttf')
    candidates = [
        ('MalgunGothic', 'C:/Windows/Fonts/malgun.ttf'),
        ('MalgunGothicBold', 'C:/Windows/Fonts/malgunbd.ttf'),
        ('NanumGothic', bundled_font),
        ('NanumGothic', 'C:/Windows/Fonts/NanumGothic.ttf'),
        ('NanumGothic', '/usr/share/fonts/truetype/nanum/NanumGothic.ttf'),
        ('AppleSDGothicNeo', '/System/Library/Fonts/AppleSDGothicNeo.ttc'),
    ]
    for name, path in candidates:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont(name, path))
                _FONT_NAME = name
                return name
            except Exception:
                continue
    return _FONT_NAME

_register_korean_font()


def _fmt(value: float) -> str:
    return f"{int(value):,}"


def generate_pdf(req: EstimateRequest, result: EstimateResult) -> bytes:
    buffer = io.BytesIO()
    font = _FONT_NAME

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18*mm,
        rightMargin=18*mm,
        topMargin=15*mm,
        bottomMargin=15*mm,
    )

    story = []
    page_w = A4[0] - 36*mm  # 사용 가능한 너비

    # ── 헤더 테이블 ──
    header_data = [[
        Paragraph(f'<font name="{font}" size="20" color="#2E75B6"><b>CONVIL DESIGN</b></font>', ParagraphStyle('h')),
        Paragraph(
            f'<font name="{font}" size="9" color="#888888">'
            f'{req.estimateDate}<br/>{req.customerName} 고객님<br/>{req.projectName}</font>',
            ParagraphStyle('sub', alignment=1)
        ),
        Paragraph(
            f'<font name="{font}" size="18" color="#2E75B6"><b>견 적 서</b></font><br/>'
            f'<font name="{font}" size="8" color="#888888">www.convil.net</font>',
            ParagraphStyle('right', alignment=2)
        ),
    ]]

    header_table = Table(header_data, colWidths=[page_w*0.35, page_w*0.35, page_w*0.30])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width='100%', thickness=3, color=PRIMARY, spaceAfter=8))

    # ── 고객 정보 ──
    info_style = ParagraphStyle('info', fontName=font, fontSize=8.5, textColor=GRAY_DARK, leading=14)
    info_data = [
        [
            Paragraph(f'<b>고객명</b>  {req.customerName or "—"}', info_style),
            Paragraph(f'<b>프로젝트</b>  {req.projectName or "—"}', info_style),
            Paragraph(f'<b>평수</b>  {req.pyeongsu}평 ({result.pyeongRange})', info_style),
        ],
        [
            Paragraph(f'<b>서비스</b>  {"단건 의뢰" if req.serviceType == "single" else "패키지"}', info_style),
            Paragraph(f'<b>방문</b>  {"비대면" if req.meetingType == "remote" else "출장"}', info_style),
            Paragraph(f'<b>견적일</b>  {req.estimateDate}', info_style),
        ],
    ]
    info_table = Table(info_data, colWidths=[page_w/3, page_w/3, page_w/3])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_LT),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [PRIMARY_LT, WHITE]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_BDR),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 8))

    # ── 항목 테이블 ──
    col_w = [page_w*0.14, page_w*0.43, page_w*0.07, page_w*0.18, page_w*0.18]

    # 헤더
    th_style = ParagraphStyle('th', fontName=font, fontSize=9, textColor=WHITE, alignment=1)
    items_data = [[
        Paragraph('Scope', th_style),
        Paragraph('Item', th_style),
        Paragraph('QTY', th_style),
        Paragraph('Unit Cost', th_style),
        Paragraph('Cost', th_style),
    ]]

    # 항목 행
    cell_l = ParagraphStyle('cl', fontName=font, fontSize=8.5, textColor=GRAY_DARK, leading=12)
    cell_r = ParagraphStyle('cr', fontName=font, fontSize=8.5, textColor=GRAY_DARK, alignment=2, leading=12)
    cell_c = ParagraphStyle('cc', fontName=font, fontSize=8.5, textColor=GRAY_DARK, alignment=1, leading=12)

    for i, item in enumerate(result.itemDetails):
        items_data.append([
            Paragraph(item.scope, cell_l),
            Paragraph(item.item, cell_l),
            Paragraph(str(item.quantity), cell_c),
            Paragraph(_fmt(item.unitCost), cell_r),
            Paragraph(_fmt(item.cost), cell_r),
        ])

    # 빈 행 채우기 (최소 10행 확보)
    min_rows = 10
    while len(items_data) - 1 < min_rows:
        items_data.append([Paragraph('', cell_l)] * 5)

    items_table = Table(items_data, colWidths=col_w, repeatRows=1)
    row_count = len(items_data)

    ts = [
        # 헤더
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), font),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_BDR),
        ('ROWBACKGROUNDS', (0, 1), (-1, row_count - 1), [GRAY_LIGHT, WHITE]),
    ]
    items_table.setStyle(TableStyle(ts))
    story.append(items_table)
    story.append(Spacer(1, 6))

    # ── 합계 테이블 ──
    summary_font = ParagraphStyle('sf', fontName=font, fontSize=9, textColor=GRAY_DARK)
    summary_r = ParagraphStyle('sr', fontName=font, fontSize=9, textColor=GRAY_DARK, alignment=2)

    def bold_p(text, align=0, color=GRAY_DARK):
        a_map = {0: 'LEFT', 1: 'CENTER', 2: 'RIGHT'}
        return Paragraph(f'<b>{text}</b>', ParagraphStyle('bp', fontName=font, fontSize=9,
                                                          textColor=color, alignment=align))

    summary_data = [
        [bold_p('Subtotal'), '', '', '', bold_p(f'₩ {_fmt(result.subtotal)}', 2)],
    ]
    if result.discount > 0:
        summary_data.append([
            Paragraph('Discount', summary_font), '', '', '',
            Paragraph(f'- ₩ {_fmt(result.discount)}', ParagraphStyle('rd', fontName=font, fontSize=9, textColor=RED, alignment=2)),
        ])
    summary_data += [
        [bold_p('Total'), '', '', '', bold_p(f'₩ {_fmt(result.total)}', 2)],
        [Paragraph('VAT (10%)', summary_font), '', '', '', Paragraph(f'₩ {_fmt(result.vat)}', summary_r)],
    ]

    summary_table = Table(summary_data, colWidths=col_w)
    summary_table.setStyle(TableStyle([
        ('SPAN', (0, r), (3, r)) for r in range(len(summary_data))
    ] + [
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_LT),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_BDR),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (0, -1), 8),
        ('RIGHTPADDING', (-1, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 4))

    # ── 최종 합계 ──
    final_style_l = ParagraphStyle('fl', fontName=font, fontSize=12, textColor=WHITE, leading=16)
    final_style_r = ParagraphStyle('fr', fontName=font, fontSize=14, textColor=PRIMARY, alignment=2, leading=18)
    final_data = [[
        Paragraph('<b>최종 합계금액 (VAT 포함)</b>', final_style_l),
        Paragraph(f'<b>₩ {_fmt(result.finalAmount)}</b>', final_style_r),
    ]]
    final_table = Table(final_data, colWidths=[page_w * 0.5, page_w * 0.5])
    final_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), PRIMARY),
        ('BACKGROUND', (1, 0), (1, 0), PRIMARY_LT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (0, 0), 12),
        ('RIGHTPADDING', (1, 0), (1, 0), 12),
        ('BOX', (0, 0), (-1, -1), 0.5, PRIMARY),
    ]))
    story.append(final_table)
    story.append(Spacer(1, 14))

    # ── 안내 문구 ──
    notice_style = ParagraphStyle('ns', fontName=font, fontSize=8, textColor=GRAY_MID, leading=13)
    story.append(Paragraph('※ 본 견적서는 발행일로부터 30일간 유효합니다.', notice_style))
    story.append(Paragraph('※ 계약금 입금 후 작업이 시작되며, 작업 완료 후 잔금을 납부하여 주시기 바랍니다.', notice_style))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width='100%', thickness=0.5, color=GRAY_BDR))

    # ── 연락처 ──
    footer_style = ParagraphStyle('fs', fontName=font, fontSize=8, textColor=GRAY_MID, leading=12)
    story.append(Spacer(1, 6))
    story.append(Paragraph('컨빌디자인  |  대표 박진하  |  www.convil.net', footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
