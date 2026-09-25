/** Wave-optics coaching (Ch 63–65) — see e1.js for the format. */
const SPACING = String.raw`$\Delta y = \dfrac{\lambda L}{d}$: the spacing grows with λ and L and shrinks with d. In water the wavelength becomes $\lambda/n$.`;
const SPREAD = String.raw`$\sin\theta \propto \lambda/a$ for a slit, or $\lambda/d$ for a grating. A wider slit or a shorter wavelength narrows the pattern; more lines per mm means a smaller $d$, which spreads it.`;
const FLIP = 'A reflection gets a half-wave shift only off a medium with a higher index than the one the light is travelling in.';

export default {
  'wave.63.find-lambda': {
    hints: [
      String.raw`Neighbouring bright fringes are $\Delta y = \dfrac{\lambda L}{d}$ apart.`,
      String.raw`Solve for $\lambda = \dfrac{\Delta y\,d}{L}$, with everything in metres.`,
    ],
  },
  'wave.63.what-if': {
    hints: [SPACING],
    why: { ans: { 1: SPACING, [-1]: SPACING, 0: SPACING } },
  },
  'wave.64.grating': {
    hints: [
      String.raw`The line spacing is $d = 1/N$: 600 lines/mm gives $d = 1/600$ mm.`,
      String.raw`Maxima at $d\sin\theta = m\lambda$. Since $\sin\theta \le 1$, the highest order is the largest whole number $m \le d/\lambda$.`,
    ],
  },
  'wave.64.rayleigh': {
    hints: [
      String.raw`Rayleigh's criterion for a circular aperture: $\theta_{\min} = \dfrac{1.22\lambda}{D}$, in radians.`,
      String.raw`At distance $L$ the smallest separation is $s = \theta_{\min}L$.`,
    ],
  },
  'wave.64.what-if': {
    hints: [SPREAD],
    why: { ans: { 1: SPREAD, [-1]: SPREAD, 0: SPREAD } },
  },
  'wave.65.thin-film': {
    why: {
      shifts: {
        0: String.raw`The top surface always flips: light in air meets the film, which has a higher index.`,
        1: ($) => ($.sub > $.nf ? String.raw`The bottom surface flips too: below the film is a higher index than the film's.` : FLIP),
        2: String.raw`The top surface flips (air to film), but at the bottom the light goes from the film to a lower index, so no flip there.`,
      },
    },
  },
  'wave.65.phase-shift': {
    hints: [FLIP],
    why: { ans: { 1: FLIP, 0: FLIP } },
  },
};
