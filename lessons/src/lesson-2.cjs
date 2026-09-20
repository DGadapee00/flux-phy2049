const fs = require('fs');
const K = require('./kit.cjs');
const {
  Document, Paragraph, TextRun, AlignmentType, Table, BorderStyle,
  p, rich, bullet, h1, h2, q, row, nameLine, pageFooter, numbering, pageSetup, COLS,
} = K;
const { Packer } = require('docx');
const img = (file, caption) => K.img(__dirname, file, caption);

const LINK = 'https://flux-phy2049.pages.dev';

const doc = new Document({
  numbering,
  styles: { default: { document: { run: { font: K.FONT, size: 22 } } } },
  sections: [{
    properties: pageSetup,
    footers: { default: pageFooter('Interactive Lesson # 2 — The Electric Field and Potential · FLUX') },
    children: [
      p('Interactive Lessons # 2 – The Electric Field and Potential', { bold: true, size: 32 }),
      p('Calculus Physics 2', { bold: true, size: 26, after: 160 }),
      nameLine(),

      rich([
        { text: 'We will be using ' },
        { text: 'FLUX', bold: true },
        { text: ', the interactive physics simulator built for this course. It runs in a web browser — there is nothing to download or install, and it works on a laptop, a Chromebook or a phone.' },
      ]),
      p('Go to the link below', { after: 60 }),
      rich([{ text: LINK, link: LINK }], { after: 160 }),
      rich([{ text: 'This lesson uses two labs, both under Exam 3: ' }, { text: 'Potential', bold: true }, { text: ' and ' },
            { text: 'Capacitor', bold: true }, { text: '. You can jump straight to either one with ' },
            { text: `${LINK}/#/e3/potential`, link: `${LINK}/#/e3/potential` }, { text: ' or ' },
            { text: `${LINK}/#/e3/capacitor`, link: `${LINK}/#/e3/capacitor` }, { text: '.' }], { after: 200 }),

      p('Before you start', { bold: true, after: 100 }),
      bullet('Each lab has a Setup panel on the right with a Scenario dropdown. Start each Activity from the scenario named — re-selecting it resets everything if you get lost.'),
      bullet('The left panel is the one that matters: the governing equation, the live numbers, and a short explanation of what the scene is doing. The strip along the bottom is the readout — those are the values you are asked to record.'),
      bullet('In the Potential lab, the white dot is the probe (point B) and the gold marker is point A. Click empty space to move the probe, or type its position into the P row of the Setup panel. All coordinate boxes are in centimetres.'),
      rich([{ text: 'One caution. ', bold: true },
            { text: 'Very close to a point charge the potential would be infinite, so the simulator stops reporting inside a small radius (about 2 cm) and shows 0 there instead. That is a drawing convention, not physics. Keep the probe at least a few centimetres away from any charge — otherwise you will find a "zero" that is not real.' }], { after: 200 }),

      p('Learning Objectives for this simulation.', { bold: true, after: 100 }),
      bullet('Describe the electric field and the electric potential of an electric dipole, and the relationship between them.'),
      bullet('Explain how the field strength and the potential change along the line joining two charges, and why a point of zero potential is not a point of zero field.'),
      bullet('Determine how plate area and plate separation control the capacitance of a capacitor.'),
      bullet('Describe how charge, field and potential change as a capacitor is charged, isolated, and discharged.'),


      h1('Activity # 1 – The dipole: equipotentials and field lines'),
      rich([{ text: 'Open ' }, { text: 'Exam 3 → Potential', bold: true }, { text: ' and choose the scenario ' },
            { text: '“Dipole — V = 0 on the midplane”', bold: true }, { text: '.' }]),
      p('Two charges of +1.50 μC and −1.50 μC sit at x = −28 cm and x = +28 cm. The coloured loops are equipotentials — surfaces of constant V — and the toggles at the top right turn the field lines and the equipotentials on and off. Use both toggles while you answer these.', { after: 160 }),

      ...img('shot-dipole-v.png', 'Exam 3 → Potential, “Dipole — V = 0 on the midplane”, with the probe on the axis midpoint. The left panel lists each charge’s separate contribution to V at the probe.'),

      ...q(1, 'Turn on both Field lines and Equipotentials. Describe how the equipotential surfaces meet the field lines everywhere you look. State the angle between them.'),
      ...q(2, 'Move the probe along a single equipotential loop, away from the charges. What does V do as you move along it? What does that tell you about the work needed to carry a charge along that path?', 4),
      ...q(3, 'Where are the equipotentials packed closest together, and where are they most spread out? Using E = −dV/dx, explain what the spacing of the equipotentials is telling you about the field strength.', 5),
      ...q(4, 'Put the probe somewhere between the charges and read both E_x and −dV/dx from the left panel. They are computed by two completely different routes. Record both and state how close they are.', 4),


      h1('Activity # 2 – Zero potential is not zero field'),
      p('Stay in the same scenario. Type the probe position directly into the P row of the Setup panel (x, y, z in centimetres) so you can place it exactly.', { after: 160 }),

      ...q(5, 'Set the probe to x = 0, y = 0. Record V at the probe, and record |E| from the readout. What is unusual about this pair of numbers?', 4),
      ...q(6, 'The left panel lists what each charge contributes to V at the probe separately. Record both numbers. Use them to explain, in one sentence, why the total is zero.', 4),
      ...q(7, 'Potential is a scalar and the field is a vector. Using that distinction, explain why the two contributions to V cancel at this point while the two contributions to E do not.', 5),
      ...q(8, 'Predict, before you change anything: if q₁ is raised from +1.50 μC to +3.00 μC, will the point of zero potential move toward the positive charge, toward the negative charge, or stay put? Give your reasoning first.', 4),
      ...q(9, 'Now change q₁ to +3.00 μC in the Setup panel and hunt for the new zero by moving the probe along the axis. Record the x you find. Does it confirm your prediction? (It should land near x = 9 cm.)', 4),
      ...q(10, 'For two unlike charges the zero of potential sits where kq₁/r₁ = k|q₂|/r₂. Use that to show by hand that the ratio r₁/r₂ must equal 2 for the charges in Question 9, and check that the position you recorded agrees.', 5),


      h1('Activity # 3 – Three charges on a line'),
      rich([{ text: 'Set q₁ back to ' }, { text: '+1.50 μC', bold: true },
            { text: '. Then press ' }, { text: '+ Charge', bold: true },
            { text: ' to add a third charge, set its value to ' }, { text: '+1.50 μC', bold: true },
            { text: ', and type its position as x = 0, y = 0, z = 0. You now have +1.50 μC at −28 cm, +1.50 μC at 0, and −1.50 μC at +28 cm.' }]),
      p('Move the probe along the x-axis by typing values into the P row, and watch V in the readout and |E| beside it. There is a point where V = 0 and a different point where E = 0. Find both.', { after: 160 }),

      ...img('shot-three-charge.png', 'The three-charge line, with the probe at the point where the potential vanishes. The field there is not zero.'),

      ...q(11, 'Find the point between the middle charge and the negative charge where V passes through zero. Record x, and record |E| there. (It is near x = 16 cm.)', 4),
      ...q(12, 'Now find the point on the other side, between the two positive charges, where the field vanishes. Record x, and record V there. (It is near x = −14 cm.)', 4),
      ...q(13, 'You have now found a place where V = 0 but E ≠ 0, and a place where E = 0 but V ≠ 0. Explain in your own words why neither one implies the other.', 5),
      ...q(14, 'At the point in Question 12, explain in terms of the three individual field vectors why they cancel. Which two oppose each other, and what is the third one doing?', 5),
      ...q(15, 'Set the test charge q to +1.00 μC. Move the probe to the zero-potential point from Question 11 and record PE_E. Then move it to the zero-field point from Question 12 and record PE_E again. Which location would a positive charge released from rest actually move away from, and why is that the field and not the potential energy alone?', 5),


      h1('Activity # 4 – Capacitance: what area and separation do'),
      rich([{ text: 'Open ' }, { text: 'Exam 3 → Capacitor', bold: true }, { text: ' and choose the scenario ' },
            { text: '“Ch 40: 1.5 m², 2 mm, 12 V”', bold: true }, { text: '. Make sure the mode is set to ' },
            { text: 'Battery (V fixed)', bold: true }, { text: '.' }]),
      p('The battery holds the voltage across the plates at 12 V no matter what else you change. Record C, q, E and U from the panels before you change anything — that is your baseline.', { after: 160 }),

      ...q(16, 'Record the baseline: C, q, E and U. Then drag Separation d from 2.0 mm to 4.0 mm and record all four again. State what happened to each as a factor (×2, ×½, unchanged).', 5),
      ...q(17, 'Explain, using C = κε₀A/d and q = CV, why the charge fell when you pulled the plates apart even though the battery voltage never changed.', 5),
      ...q(18, 'Put d back to 2.0 mm. Now halve the Plate area A from 1.50 m² to 0.75 m² and record C, q, E and U. Which of the four behaved differently from the separation test, and why?', 5),
      ...q(19, 'The field between the plates is E = V/d. Use that to explain why changing the area left E alone while changing the separation did not.', 5),


      h1('Activity # 5 – Disconnect the battery'),
      rich([{ text: 'Reset the scenario to ' }, { text: '“Ch 40: 1.5 m², 2 mm, 12 V”', bold: true },
            { text: ', then press ' }, { text: 'Isolated (Q fixed)', bold: true }, { text: '.' }]),
      p('This is the same capacitor with the battery disconnected. The charge on the plates has nowhere to go, so now it is q that is held fixed and V that is free to move. Everything you did in Activity # 4 you will now do again, and several answers change.', { after: 160 }),

      ...img('shot-capacitor-isolated.png', 'Exam 3 → Capacitor, isolated, after the separation was doubled. The charge is unchanged at +79.7 nC and the field is unchanged at 6.00 kN/C, but the voltage has doubled.'),

      ...q(20, 'With the plates isolated, drag d from 2.0 mm to 4.0 mm. Record C, q, V, E and U. Which two quantities did not change at all?', 5),
      ...q(21, 'Compare this with your answer to Question 16, where the battery was connected. The same physical change to d produced a different result for q and for E. Explain what the battery was doing in Activity # 4 that nothing is doing now.', 5),
      ...q(22, 'Still isolated, put d back to 2.0 mm and halve the area A to 0.75 m². This time E does change. Using E = σ/(κε₀) with σ = q/A, explain why changing the area changes the field but changing the separation does not.', 5),
      ...q(23, 'The stored energy U went up when you pulled the isolated plates apart, with no battery connected to supply it. Where did that energy come from? (Consider that the two plates carry opposite charges.)', 5),


      h1('Activity # 6 – Stored energy, dielectrics and discharge'),
      p('Return to Battery (V fixed) and the scenario “Ch 40: 1.5 m², 2 mm, 12 V”.', { after: 160 }),

      ...q(24, 'Change the Dielectric from Air to “Nylon (Ch 40 example κ = 410)” with the battery still connected. Record κ, C, q and U. By what factor did each change, and which quantity did not move at all?', 5),
      ...q(25, 'Set the Dielectric back to Air (dry) and the Separation to 1.0 mm. The panel reports V_bd, the voltage this gap can hold before the air breaks down, and a Breakdown row. Record V_bd, then raise the voltage until Breakdown turns red and record the voltage at which it happened. Air breaks down at about 3 MV/m — check that V_bd matches that figure for a 1.0 mm gap.', 6),
      ...q(26, 'A capacitor discharged through a light bulb makes it glow, and the glow fades. Using U = ½CV² and q = CV, explain what is happening to q, to V and to U as it discharges, and why the bulb dims rather than going out all at once.', 5),
      ...q(27, 'A capacitor charged to −1.5 V stores the same energy as one charged to +1.5 V. Explain why, and state what is physically different between the two.', 4),

      p('When complete, upload this Lesson to this assignment in Canvas.', { bold: true, after: 200 }),


      new Paragraph({ children: [], pageBreakBefore: true }),
      h1('Note for the instructor — what carries over and what does not'),
      p('This is a direct conversion of Interactive Lesson # 2. All four original learning objectives transfer. Two activities do more than the PhET versions did; one feature of the PhET capacitor does not exist here and is named below.', { after: 160 }),

      new Table({
        columnWidths: COLS,
        rows: [
          row('Original objective', 'PhET (Charges and Fields / Capacitor Lab)', 'FLUX', { head: true }),
          row('The field and potential of a dipole',
              'Equipotential lines placed by hand, one click at a time, with a voltmeter and a field sensor dragged around.',
              'Covered. Equipotentials and field lines are drawn continuously and can be toggled independently. The probe reports V and E at the same point at once, so no sensor-swapping is needed.'),
          row('How V and E behave between the charges',
              'Read off two separate meters, one point at a time.',
              'Covered, and quantified further. The panel lists what each charge contributes to V separately, so the cancellation at the zero is visible as +48.17 kV and −48.17 kV rather than asserted.', { shade: 'E2EFDA' }),
          row('Plate area and separation vs capacitance',
              'Sliders for area and separation with a live capacitance readout.',
              'Covered. A and d are typed or dragged, with C, q, E, σ and U all reported together.'),
          row('Charge, field and potential during charge and discharge',
              'A battery, a switch with three positions, and a bulb that lights and dims.',
              'Covered for the physics, differently for the picture. “Battery (V fixed)” and “Isolated (Q fixed)” are an explicit mode switch rather than a switch position to be discovered, which makes the distinction the activity is actually about harder to miss.', { shade: 'E2EFDA' }),
          row('Zero potential vs zero field',
              'Not directly available; the student must infer it from two meters.',
              'Added. Activity # 3 puts a point where V = 0 with E ≠ 0 and a point where E = 0 with V ≠ 0 on the same axis, a few centimetres apart, both found by typing a coordinate.', { shade: 'E2EFDA' }),
          row('E = −dV/dx as a checkable statement',
              'Not available.',
              'Added. E_x and −dV/dx are computed by independent routes and displayed side by side, so the relationship is something a student can verify rather than be told.', { shade: 'E2EFDA' }),
          row('Dielectrics and breakdown',
              'Not in Capacitor Lab: Basics.',
              'Added. Eight dielectrics with real κ and dielectric strength, and a breakdown indicator, which connects this lesson to Activity # 5 of Interactive Lesson # 1.', { shade: 'E2EFDA' }),
        ],
      }),

      p('', { after: 120 }),
      p('The one thing that does not transfer: the light bulb.', { bold: true, after: 100 }),
      p('There is no animated discharge through a bulb in FLUX, because a bulb brightening and fading is a time-dependent RC problem and this lab solves the electrostatic case. Question 26 therefore asks the student to reason the discharge through from U = ½CV² and q = CV rather than watch it. If seeing the bulb fade is itself the objective, the PhET capacitor remains the better tool for that one thing.', { after: 140 }),
      p('Two differences worth knowing:', { bold: true, after: 100 }),
      bullet('Every value the simulator reports is computed a second time by an independent method and checked against the first before each release. The E_x and −dV/dx pair in Activity # 1 is that comparison made visible to the student.'),
      bullet('Each lab carries a practice bank — pressing P opens generated problems for that chapter which load their own setup into the lab. Exam 3 has 54 of them, and they could supplement or replace the written questions above.'),
      p('', { after: 120 }),
      p('A note on the numbers quoted in the questions: every value in brackets was computed from the simulator’s own physics before this lesson was written, and checked against a closed-form result by hand. The zero of potential in Activity # 3 sits at x = 16.2 cm and the zero of field at x = −13.6 cm; both were verified independently.', { italics: true }),
    ],
  }],
});

Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(__dirname + '/../Interactive-Lesson-2-Field-and-Potential-FLUX.docx', b);
  console.log('written', b.length, 'bytes');
});
