"""Shared page-level scaffolding for every Taqon doc.

A canvas drawer that paints the page header + footer chrome on every
sheet, so individual builders don't have to manage running content
manually.
"""
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from .styles import (
    ORANGE, INK, MUTED, HAIRLINE,
    PAGE_MARGIN_LEFT, PAGE_MARGIN_RIGHT, PAGE_MARGIN_TOP, PAGE_MARGIN_BOTTOM,
)


class PageNumCanvas(canvas.Canvas):
    """Canvas subclass that paints a thin running footer with brand line +
    'Page X of N' on every page except the very first.

    We collect all save() calls first, then on close() loop over them
    and stamp the page count, since ReportLab can only know total pages
    after the doc has been built.
    """

    def __init__(self, *args, doc_title=None, suppress_first_page=False, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_pages = []
        self.doc_title = doc_title or 'TAQON ELECTRICO'
        self.suppress_first_page = suppress_first_page

    def showPage(self):  # noqa: N802 — ReportLab API
        self._saved_pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        page_count = len(self._saved_pages)
        for idx, state in enumerate(self._saved_pages, start=1):
            self.__dict__.update(state)
            if not (self.suppress_first_page and idx == 1):
                self._draw_chrome(idx, page_count)
            super().showPage()
        super().save()

    def _draw_chrome(self, page_num, total_pages):
        """Header strip on top, page footer line at the bottom."""
        w, h = self._pagesize

        # Top hairline + brand line
        self.setStrokeColor(HAIRLINE)
        self.setLineWidth(0.5)
        self.line(PAGE_MARGIN_LEFT, h - 12 * mm,
                  w - PAGE_MARGIN_RIGHT, h - 12 * mm)

        self.setFont('Helvetica-Bold', 7)
        self.setFillColor(INK)
        self.drawString(PAGE_MARGIN_LEFT, h - 9 * mm, self.doc_title)

        self.setFont('Helvetica', 7)
        self.setFillColor(MUTED)
        right_text = 'www.taqon.co.zw · +263 77 277 1036'
        self.drawRightString(w - PAGE_MARGIN_RIGHT, h - 9 * mm, right_text)

        # Bottom hairline + page count
        self.setStrokeColor(HAIRLINE)
        self.setLineWidth(0.5)
        self.line(PAGE_MARGIN_LEFT, 14 * mm,
                  w - PAGE_MARGIN_RIGHT, 14 * mm)

        self.setFont('Helvetica', 7)
        self.setFillColor(MUTED)
        self.drawString(PAGE_MARGIN_LEFT, 10 * mm,
                        '203 Sherwood Drive, Strathaven, Harare')
        self.drawRightString(w - PAGE_MARGIN_RIGHT, 10 * mm,
                             f'Page {page_num} of {total_pages}')


def render_doc(flowables, *, doc_title='TAQON ELECTRICO',
               suppress_first_page=False,
               margin_top=PAGE_MARGIN_TOP,
               margin_bottom=PAGE_MARGIN_BOTTOM,
               margin_left=PAGE_MARGIN_LEFT,
               margin_right=PAGE_MARGIN_RIGHT):
    """Build the PDF and return the bytes. The canvasmaker injects the
    running header + footer on every interior page."""
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=margin_left,
        rightMargin=margin_right,
        topMargin=margin_top,
        bottomMargin=margin_bottom,
        title=doc_title,
        author='Taqon Electrico',
        subject=doc_title,
        creator='Taqon Electrico',
    )

    def make_canvas(*args, **kwargs):
        return PageNumCanvas(
            *args, doc_title=doc_title,
            suppress_first_page=suppress_first_page, **kwargs,
        )

    doc.build(flowables, canvasmaker=make_canvas)
    return buf.getvalue()


def format_date_label(dt=None):
    return (dt or datetime.now()).strftime('%d %B %Y')
