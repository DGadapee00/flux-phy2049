const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun,
  LevelFormat, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, ExternalHyperlink,
} = require('docx');

const FONT = 'Calibri';
const blank = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [] }));
const p = (text, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 120, line: 276 },
  alignment: o.align,
  children: [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size ?? 22, font: FONT, color: o.color })],
});
const rich = (runs, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 120, line: 276 },
  children: runs.map((r) => (r.link
    ? new ExternalHyperlink({ link: r.link, children: [new TextRun({ text: r.text, style: 'Hyperlink', size: 22, font: FONT })] })
    : new TextRun({ text: r.text, bold: r.bold, italics: r.italics, size: r.size ?? 22, font: FONT, color: r.color }))),
});
const bullet = (text, o = {}) => new Paragraph({
  numbering: { reference: 'dot', level: 0 },
  spacing: { after: 80, line: 276 },
  children: [new TextRun({ text, size: 22, font: FONT, bold: o.bold })],
});
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 140 },
  children: [new TextRun({ text, bold: true, size: 30, font: FONT, color: '1F3864' })],
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, bold: true, size: 26, font: FONT, color: '2E5496' })],
});
/** A numbered question with ruled answer space, like the original's blank lines. */
const q = (n, text, lines = 3) => [
  new Paragraph({
    spacing: { before: 200, after: 100, line: 276 },
    children: [
      new TextRun({ text: `Question ${n}) `, bold: true, size: 22, font: FONT }),
      new TextRun({ text, size: 22, font: FONT }),
    ],
  }),
  ...Array.from({ length: lines }, () => new Paragraph({
    spacing: { after: 0, line: 360 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF', space: 4 } },
    children: [new TextRun({ text: '', size: 22, font: FONT })],
  })),
  new Paragraph({ children: [], spacing: { after: 80 } }),
];
const img = (file, caption) => [
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 160, after: 60 },
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(__dirname + '/' + file), transformation: { width: 600, height: 360 } })],
  }),
  p(caption, { italics: true, size: 18, align: AlignmentType.CENTER, after: 200 }),
];
const cell = (text, { bold = false, shade, width } = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: 'auto' } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [p(text, { bold, size: 20, after: 0 })],
});

const COLS = [2600, 3400, 3400];
const row = (a, b, c, o = {}) => new TableRow({
  children: [cell(a, { bold: o.head, shade: o.head ? 'DEEAF6' : undefined, width: COLS[0] }),
             cell(b, { shade: o.shade, width: COLS[1] }),
             cell(c, { shade: o.shade, width: COLS[2] })],
});

const LINK = 'https://flux-phy2049.pages.dev';

const doc = new Document({
  numbering: { config: [{ reference: 'dot', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 460, hanging: 260 } } } }] }] },
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    children: [
      p('Interactive Lessons # 1 – Static Electricity, Charge and Coulomb’s Law', { bold: true, size: 32 }),
      p('Calculus Physics 2', { bold: true, size: 26, after: 240 }),

      rich([
        { text: 'We will be using ' },
        { text: 'FLUX', bold: true },
        { text: ', the interactive physics simulator built for this course, for this Interactive Lesson. It runs in a web browser — there is nothing to download or install, and it works on a laptop, a Chromebook or a phone.' },
      ]),
      p('Go to the link below', { after: 60 }),
      rich([{ text: LINK, link: LINK }], { after: 160 }),
      rich([{ text: 'Note: ', bold: true }, { text: 'the simulator opens on the last lab you used. The exam number tabs (1–7, W) run across the top, with that exam’s labs listed underneath. A lab’s address is bookmarkable, so a link such as ' },
            { text: `${LINK}/#/e2/conductors`, link: `${LINK}/#/e2/conductors` }, { text: ' opens that lab directly.' }], { after: 200 }),

      p('Before you start', { bold: true, after: 100 }),
      bullet('Open the simulator and click through the exam tabs to see what is there. Drag to orbit, scroll to zoom, and press R to reset the camera if you lose the scene.'),
      bullet('Every lab has a Setup panel on the right with a Scenario dropdown. The lesson tells you which scenario to choose — start each Activity from the one named.'),
      bullet('The panel on the left is the important one: it shows the governing equation, the live numbers, and a short explanation of what the scene is doing. Read it.'),
      bullet('The strip along the bottom is the readout. Those are the values you are asked to record.'),
      bullet('If you change something and want to start over, re-select the scenario from the dropdown.'),

      p('Learning Objectives for this simulation.', { bold: true, after: 100 }),
      bullet('Explain what conservation of charge means for a neutral object placed in an electric field.'),
      bullet('Describe the polarization effect and explain why a charged object attracts a neutral one.'),
      bullet('Use Coulomb’s law quantitatively: predict a force, then check it against the simulator.'),
      bullet('Explain why the electric field is zero inside a conductor, and what grounding changes.'),

      new Paragraph({ children: [], pageBreakBefore: true }),

      h1('Activity # 1 – Coulomb’s law: attraction and repulsion'),
      rich([{ text: 'Open ' }, { text: 'Exam 1 → Force', bold: true }, { text: '. Choose the scenario ' },
            { text: '“Two positives (repel)”', bold: true }, { text: '.' }]),
      p('Click a charge to select it. The gold arrow is the net force on the selected charge; the thin arrows are the individual pairs. You can drag a charge, or type exact coordinates into the boxes in the Setup panel (they are in centimetres).', { after: 160 }),

      ...q(1, 'Select the +2.00 μC charge and record |F_net| from the readout. Which way does the gold arrow point, and why?'),
      ...q(2, 'Now select the other charge. How does the magnitude of the force on it compare with your answer to Question 1? Which law of motion does that illustrate?'),
      ...q(3, 'Using the coordinate boxes, double the separation between the two charges. Predict what happens to |F_net| before you look, then record the new value. Does it match Coulomb’s law?', 4),

      rich([{ text: 'Now switch the scenario to ' }, { text: '“Opposite charges (attract)”', bold: true }, { text: '.' }], { after: 120 }),
      ...img('shot-attract.png', 'Exam 1 → Force, “Opposite charges (attract)”. The readout reports the net force on the selected charge.'),
      ...q(4, 'Describe what changes about the force arrows when one charge is made negative. What stays the same?'),
      ...q(5, 'Change q₂ from −1.50 μC to −3.00 μC in the Setup panel. Predict the new |F_net| from your Question 4 reading first, then record the value the simulator gives.', 4),

      new Paragraph({ children: [], pageBreakBefore: true }),

      h1('Activity # 2 – Polarization: a neutral conductor near a charge'),
      rich([{ text: 'Open ' }, { text: 'Exam 2 → Conductors', bold: true }, { text: ' and choose the scenario ' },
            { text: '“Neutral isolated sphere + outside q”', bold: true }, { text: '.' }]),
      p('The sphere is a neutral metal ball. The point charge q sits to its right. Surface colour shows the surface charge density σ — blue is induced negative, red is positive (the key is at the bottom left). Click on empty space to move the probe.', { after: 160 }),
      ...img('shot-polarization.png', 'Exam 2 → Conductors, “Neutral isolated sphere + outside q”. The left panel reports σ on the near and far faces, and the induced charge against the compensating charge at the centre.'),

      ...q(6, 'Describe the charge on the side of the sphere facing q, and on the far side. Record σ facing q (θ = 0) and σ far side (θ = π) from the left panel.', 4),
      ...q(7, 'The left panel reports an induced charge and an equal, opposite charge at the centre, so that Q_net = 0. Explain what this is telling you about conservation of charge. Has any charge been added to the sphere?', 4),
      ...q(8, 'Explain why the electrons in the metal arrange themselves this way. What would happen to a free electron inside the metal if they did not?', 4),
      ...q(9, 'The sphere is electrically neutral overall. Explain why it is nevertheless attracted to q. (Hint: compare the distance from q to the induced negative charge with the distance to the positive charge.)', 4),
      ...q(10, 'Move the probe to a point inside the metal and record Region and |E| from the readout. Then move it outside. State the rule this demonstrates in one sentence.', 4),
      ...q(11, 'Drag the “Distance d of q” slider to bring q closer. What happens to the induced σ, and why?'),

      new Paragraph({ children: [], pageBreakBefore: true }),

      h1('Activity # 3 – Grounding'),
      rich([{ text: 'Stay in ' }, { text: 'Conductors', bold: true }, { text: ' and switch the scenario to ' },
            { text: '“Grounded sphere + outside point charge”', bold: true }, { text: '.' }]),
      p('A grounded conductor can exchange charge with the earth, so it is no longer required to stay neutral.', { after: 160 }),

      ...q(12, 'Compare the surface charge on the grounded sphere with the neutral sphere in Activity # 2. What is different?', 4),
      ...q(13, 'Is the grounded sphere still neutral overall? Explain what grounding has allowed to happen.', 4),
      ...q(14, 'A balloon rubbed on a sweater sticks to a wall. Using your answers to Activities 2 and 3, explain why the wall does not need to be charged for this to work.', 5),

      h1('Activity # 4 – Shielding'),
      rich([{ text: 'Switch the scenario to ' }, { text: '“Faraday cage — charge in the cavity”', bold: true }, { text: '.' }], { after: 160 }),

      ...q(15, 'A charge sits inside a hollow conductor. Describe the charge that appears on the inner wall and on the outer surface, and explain why each one is there.', 5),
      ...q(16, 'Move the probe into the metal shell and record |E|. Explain what this means for someone sitting inside a car during a lightning strike.', 5),

      p('When complete, upload this Lesson to this assignment in Canvas.', { bold: true, after: 200 }),

      new Paragraph({ children: [], pageBreakBefore: true }),

      h1('Note for the instructor — what carries over and what does not'),
      p('This is a direct conversion of Interactive Lesson # 1. It is honest about coverage: two of the three original learning objectives transfer to FLUX and are strengthened by it, and one does not transfer at all.', { after: 160 }),

      new Table({
        columnWidths: COLS,
        rows: [
          row('Original objective', 'PhET (Balloons / Travoltage)', 'FLUX', { head: true }),
          row('Polarization; a charged object attracting a neutral one',
              'Qualitative. Charges shown as coloured dots that shift.',
              'Covered, and quantified. σ is reported on the near and far faces in C/m², and the induced charge is shown against the compensating charge so Q_net = 0 is visible as a number.'),
          row('Conservation of charge',
              'Shown by electrons transferring from the sweater to the balloon.',
              'Covered for induction only. The sphere stays neutral while separating charge. FLUX has no triboelectric charging — nothing is rubbed against anything.'),
          row('Breakdown in air, and the factors affecting it',
              'The spark in John Travoltage.',
              'Not covered. FLUX does not model dielectric breakdown. Keep the PhET activity for this, or drop the objective.', { shade: 'FBE4E4' }),
          row('Quantitative Coulomb’s law',
              'Not available.',
              'Added. Exact charges and coordinates can be typed in, and forces are read in newtons, so a prediction can be checked against a number.', { shade: 'E2EFDA' }),
          row('Field inside a conductor',
              'Not available.',
              'Added. A movable probe reports E = 0 inside the metal and the region it is in.', { shade: 'E2EFDA' }),
        ],
      }),

      p('', { after: 120 }),
      p('Two further differences worth knowing:', { bold: true, after: 100 }),
      bullet('Every value the simulator reports is computed a second time by an independent method and checked against the first — 307 such checks run before each release. The two figures shown side by side in several labs (“numerical” and “analytic”) are that comparison, visible to the student.'),
      bullet('Each lab carries a practice bank. Pressing P opens generated problems for that chapter which load their own setup into the lab, so a student can be asked to predict a number and have it checked. That is not something the PhET activities can do, and it could replace or supplement the written questions above.'),
      p('', { after: 120 }),
      p('Suggested reading of the above: use FLUX for Activities 1–4 as written, and keep John Travoltage as a short fifth activity if the breakdown objective is to be assessed.', { italics: true }),
    ],
  }],
});

Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(__dirname + '/../Interactive-Lesson-1-Static-Electricity-FLUX.docx', b);
  console.log('written', b.length, 'bytes');
});
