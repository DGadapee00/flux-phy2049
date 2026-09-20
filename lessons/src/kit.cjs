/**
 * Shared building blocks for the interactive-lesson handouts.
 *
 * Both lessons are built from these, so a formatting fix lands in both.
 */
const fs = require('fs');
const {
  Document, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, LevelFormat,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, ExternalHyperlink,
  Header, Footer, PageNumber,
} = require('docx');

const FONT = 'Calibri';
const INK = '1F3864';
const INK2 = '2E5496';

const p = (text, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 120, line: 276 },
  alignment: o.align,
  keepNext: o.keepNext,
  children: [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size ?? 22, font: FONT, color: o.color })],
});

const rich = (runs, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 120, line: 276 },
  keepNext: o.keepNext,
  children: runs.map((r) => (r.link
    ? new ExternalHyperlink({ link: r.link, children: [new TextRun({ text: r.text, style: 'Hyperlink', size: 22, font: FONT })] })
    : new TextRun({ text: r.text, bold: r.bold, italics: r.italics, size: r.size ?? 22, font: FONT, color: r.color }))),
});

const bullet = (text, o = {}) => new Paragraph({
  numbering: { reference: 'dot', level: 0 },
  spacing: { after: 80, line: 276 },
  children: [new TextRun({ text, size: 22, font: FONT, bold: o.bold })],
});

/** Headings stay with the text that follows them, so one never strands at the foot of a page. */
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 }, keepNext: true, keepLines: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D6DCE5', space: 6 } },
  children: [new TextRun({ text, bold: true, size: 30, font: FONT, color: INK })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, keepNext: true, keepLines: true,
  children: [new TextRun({ text, bold: true, size: 26, font: FONT, color: INK2 })],
});

/**
 * A numbered question with ruled space to write in.
 *
 * The rule colour alternates by one imperceptible step. Word and LibreOffice both merge
 * *consecutive paragraphs carrying identical borders* into a single bordered block, so a run of
 * four identical ruled paragraphs draws one rule with a void above it rather than four lines to
 * write on. Alternating the colour keeps them distinct. See lessons/README.md.
 */
const RULE_A = 'BFBFBF';
const RULE_B = 'C0C0C0';
const q = (n, text, lines = 3) => [
  new Paragraph({
    spacing: { before: 220, after: 60, line: 276 },
    keepNext: true, keepLines: true,
    children: [
      new TextRun({ text: `Question ${n}) `, bold: true, size: 22, font: FONT, color: INK }),
      new TextRun({ text, size: 22, font: FONT }),
    ],
  }),
  ...Array.from({ length: lines }, (_, i) => new Paragraph({
    spacing: { after: 0, line: 340 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: i % 2 ? RULE_A : RULE_B, space: 5 } },
    children: [new TextRun({ text: '', size: 22, font: FONT })],
  })),
  new Paragraph({ children: [], spacing: { after: 100 } }),
];

/** A figure and its caption, kept together and kept with the text that introduces them. */
const img = (dir, file, caption) => [
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 }, keepNext: true,
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(dir + '/' + file), transformation: { width: 624, height: 374 } })],
  }),
  p(caption, { italics: true, size: 18, align: AlignmentType.CENTER, after: 220, color: '595959' }),
];

const COLS = [2600, 3400, 3400];
const cell = (text, { bold = false, shade, width } = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: 'auto' } : undefined,
  margins: { top: 90, bottom: 90, left: 120, right: 120 },
  children: [p(text, { bold, size: 20, after: 0 })],
});
const row = (a, b, c, o = {}) => new TableRow({
  // A row broken across a page leaves half a sentence at the foot and half at the head of the next.
  cantSplit: true,
  tableHeader: !!o.head,
  children: [cell(a, { bold: o.head, shade: o.head ? 'DEEAF6' : undefined, width: COLS[0] }),
             cell(b, { shade: o.shade, width: COLS[1] }),
             cell(c, { shade: o.shade, width: COLS[2] })],
});

/** Name / date rule at the top of a handout that gets filled in and handed back. */
const nameLine = () => new Paragraph({
  spacing: { before: 60, after: 240, line: 276 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE_A, space: 6 } },
  children: [new TextRun({ text: 'Name: ', bold: true, size: 22, font: FONT }),
             new TextRun({ text: ' '.repeat(46), size: 22, font: FONT }),
             new TextRun({ text: 'Date: ', bold: true, size: 22, font: FONT })],
});

const pageFooter = (title) => new Footer({
  children: [new Paragraph({
    spacing: { before: 60 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'D6DCE5', space: 6 } },
    tabStops: [{ type: 'right', position: 9360 }],
    children: [
      new TextRun({ text: title, size: 16, font: FONT, color: '808080' }),
      new TextRun({ text: '\t', size: 16, font: FONT }),
      new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], size: 16, font: FONT, color: '808080' }),
    ],
  })],
});

const numbering = {
  config: [{ reference: 'dot', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 460, hanging: 260 } } } }] }],
};

const pageSetup = { page: { size: { width: 12240, height: 15840 }, margin: { top: 1000, bottom: 1000, left: 1080, right: 1080 } } };

module.exports = {
  FONT, INK, INK2, COLS, p, rich, bullet, h1, h2, q, img, cell, row, nameLine, pageFooter, numbering, pageSetup,
  Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Header, Footer,
};
