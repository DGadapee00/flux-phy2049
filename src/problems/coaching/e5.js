/** Exam 5 coaching (Ch 48–52) — see e1.js for the format. */
const LENZ = String.raw`Lenz: the loop's current makes a field that fights the change in flux. An approaching N pole gets an N face (counterclockwise as you look at it); a receding one gets an S face. S poles flip both.`;
const ICE_ELI = String.raw`"ELI the ICE man": in an inductor $V$ (E) leads $I$; in a capacitor $I$ leads $V$ (E). A pure element is 90° off, and adding $R$ pulls the angle to between 0° and 90°.`;

export default {
  'e5.48.flux': {
    hints: [
      String.raw`$\Phi_B = BA\cos\theta$, with θ between $\vec{B}$ and the loop's normal.`,
      String.raw`The area of a circle is $\pi r^2$, with $r$ in metres (10 cm = 0.1 m).`,
    ],
  },
  'e5.48.changing-B': {
    hints: [
      String.raw`Faraday: $|\mathcal{E}| = N\dfrac{\Delta\Phi_B}{\Delta t}$, and only $B$ changes, so $\Delta\Phi_B = A\,\Delta B$.`,
      String.raw`$A = \pi r^2$ in m²; then $I = \mathcal{E}/R$.`,
    ],
  },
  'e5.48.lenz': {
    why: {
      dir: {
        1: LENZ,
        [-1]: LENZ,
        0: 'The flux through the loop is changing, so there is an induced emf and a current.',
      },
      force: {
        1: 'A magnet moving away is attracted back: the induced current always opposes the motion that causes it.',
        [-1]: 'An approaching magnet is pushed back: the induced current always opposes the motion that causes it.',
      },
    },
  },
  'e5.48.rotate-avg': {
    hints: [
      String.raw`Average emf $= N\dfrac{|\Delta\Phi_B|}{\Delta t}$, with $\Phi_B = BA\cos\theta$ at each angle.`,
      String.raw`$\Delta\Phi_B = BA(\cos\theta_2 - \cos\theta_1)$; the area in m² (100 cm² = 0.01 m²).`,
    ],
  },
  'e5.49.solenoid-L': {
    hints: [
      String.raw`$L = \dfrac{N\Phi_B}{I}$, with $B = \mu_0 nI$ inside and $n = N/\ell$.`,
      String.raw`That gives $L = \dfrac{\mu_0 N^2 A}{\ell}$, with $A = \pi r^2$ in m².`,
    ],
  },
  'e5.49.self-emf': {
    hints: [
      String.raw`$|\mathcal{E}| = L\dfrac{\Delta I}{\Delta t}$ — it depends on how fast the current changes.`,
      'Convert first: mH to H, ms to s.',
    ],
    why: {
      dir: {
        2: 'The self-induced emf opposes the change — that is why an inductor resists sudden changes in current.',
        4: String.raw`$\mathcal{E} = -L\,dI/dt$: it depends on how fast $I$ changes, so a large steady current gives no emf at all.`,
      },
    },
  },
  'e5.50.transformer': {
    hints: [
      String.raw`The voltage goes with the turns: $\dfrac{V_s}{V_p} = \dfrac{N_s}{N_p}$.`,
      String.raw`Ideal means power in = power out: $I_pV_p = I_sV_s$, so the current goes the other way.`,
    ],
    why: {
      type: {
        1: 'Fewer secondary turns means less voltage out: that is step-down.',
        [-1]: 'More secondary turns means more voltage out: that is step-up.',
      },
    },
  },
  'e5.50.motor': {
    hints: [
      String.raw`The back emf opposes the supply, so the windings see only $V - \mathcal{E}_b$: $I = \dfrac{V - \mathcal{E}_b}{R}$.`,
      'At the moment it starts the coil is not turning yet, so the back emf is zero.',
    ],
  },
  'e5.50.generator': {
    hints: [
      String.raw`A spinning coil gives $\mathcal{E} = NBA\omega\sin\omega t$, so the peak is $NBA\omega$.`,
      String.raw`$\omega = 2\pi f$ and $A = \pi r^2$ in m². Then $\mathcal{E}_{\text{rms}} = \mathcal{E}_{\max}/\sqrt2$.`,
    ],
  },
  'e5.51.applications': {
    hints: ['Induction needs a changing magnetic flux through a conductor. Look for that in each case.'],
    why: {
      ans: {
        4: 'Magnetic fields pass straight through glass. The difference is that glass does not conduct, so no eddy currents flow in it.',
        8: 'Heat conduction is not the point: the cooktop heats the pan by driving eddy currents in it, and glass carries none.',
        5: 'A transformer works only by induction: the changing flux from the primary drives the secondary.',
        6: 'A pickup is a coil around a magnet; the vibrating steel string changes the flux and induces the signal.',
        7: 'An induction cooktop drives changing flux through the pan, and the eddy currents heat it.',
        9: 'Copper is not magnetic: a magnet held still next to copper feels nothing. The drag appears only while it moves.',
        10: 'The pipe is open at both ends, so air is not trapped. The drag comes from eddy currents in the copper.',
      },
    },
  },
  'e5.52.reactance-C': {
    hints: [
      String.raw`$X_C = \dfrac{1}{2\pi fC}$, with $C$ in farads (μF × 10⁻⁶).`,
      String.raw`The reactance plays the part of resistance: $I_{\text{rms}} = V_{\text{rms}}/X_C$.`,
    ],
    why: { f: { 2: String.raw`$f$ is in the denominator of $X_C = 1/(2\pi fC)$: a capacitor passes high frequencies more easily.` } },
  },
  'e5.52.reactance-L': {
    hints: [
      String.raw`$X_L = 2\pi fL$, with $L$ in henries (mH × 10⁻³).`,
      String.raw`$I_{\text{rms}} = V_{\text{rms}}/X_L$.`,
    ],
    why: { f: { 1: String.raw`$X_L = 2\pi fL$ grows with $f$: an inductor fights faster changes harder.` } },
  },
  'e5.52.rlc': {
    why: {
      lead: {
        1: String.raw`When $X_L > X_C$ the circuit acts like an inductor, so the voltage leads the current (ELI) and φ > 0.`,
        [-1]: String.raw`When $X_C > X_L$ the circuit acts like a capacitor, so the current leads the voltage (ICE) and φ < 0.`,
        0: String.raw`In phase needs $X_L = X_C$ (resonance). Here they differ, so $\tan\varphi = (X_L - X_C)/R \ne 0$.`,
      },
    },
  },
  'e5.52.lead-lag': {
    hints: [ICE_ELI],
    why: {
      ans: {
        1: ICE_ELI,
        2: ICE_ELI,
        3: String.raw`Only a pure resistor keeps $I$ and $V$ in phase. A capacitor or inductor shifts them.`,
        4: ICE_ELI,
        5: ICE_ELI,
      },
    },
  },
};
