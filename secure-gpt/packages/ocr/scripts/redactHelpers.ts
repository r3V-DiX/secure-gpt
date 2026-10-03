import { execFileSync } from 'child_process'

export const DRAW_BOXES_PYTHON_SCRIPT = `
import sys, json
from PIL import Image, ImageDraw

input_p = sys.argv[1]
out_png = sys.argv[2]
out_pdf = sys.argv[3] if sys.argv[3] != 'none' else None
boxes = json.loads(sys.argv[4])

img = Image.open(input_p).convert('RGB')
draw = ImageDraw.Draw(img)

for b in boxes:
    x0 = max(0, b['x0'] - 4)
    y0 = max(0, b['y0'] - 4)
    x1 = min(img.width, b['x1'] + 4)
    y1 = min(img.height, b['y1'] + 4)
    draw.rectangle([x0, y0, x1, y1], fill='black')

img.save(out_png, 'PNG')
if out_pdf:
    img.save(out_pdf, 'PDF', resolution=200.0)
`

export const COMPILE_MULTI_PAGE_PDF_SCRIPT = `
import sys, json
from PIL import Image

page_images = json.loads(sys.argv[1])
out_pdf_path = sys.argv[2]

if page_images:
    first_img = Image.open(page_images[0]).convert('RGB')
    other_images = [Image.open(p).convert('RGB') for p in page_images[1:]]
    first_img.save(out_pdf_path, 'PDF', resolution=200.0, save_all=True, append_images=other_images)
`

export function drawBoxesOnImage(
  inputPath: string,
  outPngPath: string,
  bboxes: any[],
  outPdfPath: string = 'none'
) {
  execFileSync('python3', [
    '-c',
    DRAW_BOXES_PYTHON_SCRIPT,
    inputPath,
    outPngPath,
    outPdfPath,
    JSON.stringify(bboxes),
  ])
}

export function compileMultiPagePdf(pageImages: string[], outPdfPath: string) {
  execFileSync('python3', [
    '-c',
    COMPILE_MULTI_PAGE_PDF_SCRIPT,
    JSON.stringify(pageImages),
    outPdfPath,
  ])
}
