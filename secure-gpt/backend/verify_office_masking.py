#!/usr/bin/env python3
"""Verification for redact_office_file: build office fixtures in-memory, mask, assert."""
import io
import os
import sys
import zipfile
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.redaction_service import redact_office_file  # noqa: E402

PAN = "ABCDE1234F"
MASK = "[PAN-REDACTED]"
CARD = "4111111111111111"
CARD_MASK = "[CARD-REDACTED]"

CT = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>{overrides}</Types>'
RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="{type}" Target="{target}"/></Relationships>'


def build_docx(with_split=False, extra_part=False):
    w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    if with_split:
        # PAN split across two runs in the same paragraph
        runs = (f'<w:r><w:t xml:space="preserve">PAN: ABC</w:t></w:r>'
                f'<w:r><w:t xml:space="preserve">DE1234F</w:t></w:r>')
        body = f'<w:p>{runs}</w:p>'
    else:
        body = f'<w:p><w:r><w:t>PAN: {PAN}</w:t></w:r></w:p><w:p><w:r><w:t>Card: {CARD}</w:t></w:r></w:p>'
    document = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                f'<w:document xmlns:w="{w_ns}"><w:body>{body}</w:body></w:document>')
    overrides = '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    entries = [
        ('[Content_Types].xml', CT.format(overrides=overrides)),
        ('_rels/.rels', RELS.format(type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument', target='word/document.xml')),
        ('word/document.xml', document),
    ]
    if extra_part:
        entries.append(('word/header1.xml', f'<w:hdr xmlns:w="{w_ns}"><w:p><w:r><w:t>Confidential</w:t></w:r></w:p></w:hdr>'))
    return entries


def build_xlsx():
    ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    overrides = ('<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                 '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
    sheet = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
             f'<worksheet xmlns="{ns}"><sheetData><row>'
             f'<c r="A1" t="inlineStr"><is><t>{PAN}</t></is></c>'
             f'</row></sheetData></worksheet>')
    workbook = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="{ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="S" sheetId="1" r:id="rId1"/></sheets></workbook>'
    return [
        ('[Content_Types].xml', CT.format(overrides=overrides)),
        ('_rels/.rels', RELS.format(type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument', target='xl/workbook.xml')),
        ('xl/workbook.xml', workbook),
        ('xl/_rels/workbook.xml.rels', RELS.format(type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet', target='worksheets/sheet1.xml')),
        ('xl/worksheets/sheet1.xml', sheet),
    ]


def build_pptx():
    a_ns = 'http://schemas.openxmlformats.org/drawingml/2006/main'
    p_ns = 'http://schemas.openxmlformats.org/presentationml/2006/main'
    overrides = ('<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
                 '<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>')
    slide = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
             f'<p:sld xmlns:a="{a_ns}" xmlns:p="{p_ns}"><p:cSld><p:spTree><p:sp><p:txBody>'
             f'<a:p><a:r><a:t>Investor PAN: {PAN}</a:t></a:r></a:p>'
             f'</p:txBody></p:sp></p:spTree></p:cSld></p:sld>')
    presentation = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:presentation xmlns:a="{a_ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="{p_ns}"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>'
    return [
        ('[Content_Types].xml', CT.format(overrides=overrides)),
        ('_rels/.rels', RELS.format(type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument', target='ppt/presentation.xml')),
        ('ppt/presentation.xml', presentation),
        ('ppt/_rels/presentation.xml.rels', RELS.format(type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide', target='slides/slide1.xml')),
        ('ppt/slides/slide1.xml', slide),
    ]


def write_zip(path, entries):
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in entries:
            z.writestr(name, data)


def read_zip_text(path, part):
    with zipfile.ZipFile(path) as z:
        return z.read(part).decode('utf-8')


def check(name, cond):
    print(f'  {"OK" if cond else "FAIL"}  {name}')
    if not cond:
        raise SystemExit(1)


def main():
    tmp = '/tmp/office_mask_verify'
    os.makedirs(tmp, exist_ok=True)

    entities_doc = [{"value": PAN, "maskedValue": MASK}, {"value": CARD, "maskedValue": CARD_MASK}]

    # ── docx (document.xml + header1.xml) ──
    p = os.path.join(tmp, 'in.docx')
    write_zip(p, build_docx(extra_part=True))
    out = redact_office_file(p, entities_doc, 'docx')
    doc_text = read_zip_text(out, 'word/document.xml')
    hdr_text = read_zip_text(out, 'word/header1.xml')
    check('docx: PAN masked', PAN not in doc_text)
    check('docx: MASK present', MASK in doc_text)
    check('docx: CARD masked', CARD not in doc_text)
    check('docx: header untouched (no PII)', 'Confidential' in hdr_text)
    with zipfile.ZipFile(out) as z:
        check('docx: zip valid', z.testzip() is None)
        check('docx: parts preserved', set(z.namelist()) == {'[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/header1.xml'})

    # ── docx split-run value ──
    p = os.path.join(tmp, 'split.docx')
    write_zip(p, build_docx(with_split=True))
    out = redact_office_file(p, [{"value": "ABCDE1234F", "maskedValue": MASK}], 'docx')
    doc_text = read_zip_text(out, 'word/document.xml')
    check('docx split-run: masked', PAN not in doc_text)
    check('docx split-run: MASK present', MASK in doc_text)

    # ── xlsx inline string ──
    p = os.path.join(tmp, 'in.xlsx')
    write_zip(p, build_xlsx())
    out = redact_office_file(p, [{"value": PAN, "maskedValue": MASK}], 'xlsx')
    check('xlsx: PAN masked', PAN not in read_zip_text(out, 'xl/worksheets/sheet1.xml'))
    check('xlsx: MASK present', MASK in read_zip_text(out, 'xl/worksheets/sheet1.xml'))

    # ── pptx ──
    p = os.path.join(tmp, 'in.pptx')
    write_zip(p, build_pptx())
    out = redact_office_file(p, [{"value": PAN, "maskedValue": MASK}], 'pptx')
    check('pptx: PAN masked', PAN not in read_zip_text(out, 'ppt/slides/slide1.xml'))
    check('pptx: MASK present', MASK in read_zip_text(out, 'ppt/slides/slide1.xml'))

    # ── csv plain-text ──
    p = os.path.join(tmp, 'in.csv')
    with open(p, 'w') as f:
        f.write(f'name,pan\nArjun,{PAN}\n')
    out = redact_office_file(p, [{"value": PAN, "maskedValue": MASK}], 'csv')
    with open(out) as f:
        check('csv: PAN masked', PAN not in f.read())

    # ── odt (ODF, text in text:p — not a "t" element) ──
    p = os.path.join(tmp, 'in.odt')
    content = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">'
               '<office:body><office:text><text:p>PAN: ABCDE1234F</text:p></office:text></office:body>'
               '</office:document-content>')
    write_zip(p, [('content.xml', content)])
    out = redact_office_file(p, [{"value": PAN, "maskedValue": MASK}], 'odt')
    c = read_zip_text(out, 'content.xml')
    check('odt: PAN masked', PAN not in c)
    check('odt: MASK present', MASK in c)

    # ── epub (XHTML, generic text elements) ──
    p = os.path.join(tmp, 'in.epub')
    xhtml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
             '<html xmlns="http://www.w3.org/1999/xhtml"><body><p>PAN: ABCDE1234F</p></body></html>')
    write_zip(p, [('OEBPS/chapter1.xhtml', xhtml)])
    out = redact_office_file(p, [{"value": PAN, "maskedValue": MASK}], 'epub')
    c = read_zip_text(out, 'OEBPS/chapter1.xhtml')
    check('epub: PAN masked', PAN not in c)
    check('epub: MASK present', MASK in c)

    # ── miss → ValueError (fail closed) ──
    p = os.path.join(tmp, 'miss.docx')
    write_zip(p, build_docx())
    try:
        redact_office_file(p, [{"value": "ZZZZZ9999Z", "maskedValue": MASK}], 'docx')
        check('miss: raises', False)
    except ValueError:
        check('miss: raises', True)

    print('\nAll checks passed.')


if __name__ == '__main__':
    main()
