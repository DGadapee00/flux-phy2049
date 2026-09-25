/** Exam 7 coaching (Ch 58–62) — see e1.js for the format. */
const IMAGE = String.raw`Read the image off your signs: $d_i > 0$ means real and $m < 0$ means inverted; $d_i < 0$ means virtual and upright. $|m| > 1$ is enlarged, $|m| < 1$ reduced.`;

export default {
  'e7.58.snell': {
    hints: [
      String.raw`Snell's law: $n_1\sin\theta_1 = n_2\sin\theta_2$, angles from the normal.`,
      'The reflected ray leaves at the same angle it came in.',
    ],
    why: {
      bend: {
        1: 'Going into a lower index the light speeds up and bends away from the normal.',
        [-1]: 'Going into a higher index the light slows down and bends toward the normal.',
      },
    },
  },
  'e7.58.tir': {
    hints: [
      'Total internal reflection needs light going from a higher index to a lower one.',
      String.raw`Try Snell's law: if $\dfrac{n_1\sin\theta_1}{n_2} > 1$ there is no refraction angle, so all the light reflects.`,
    ],
    why: {
      tir: {
        1: String.raw`Check $n_1\sin\theta_1/n_2$: total internal reflection needs it above 1, and it can only happen going from higher $n$ to lower $n$.`,
        0: String.raw`Check $n_1\sin\theta_1/n_2$: when it is above 1 there is no refraction angle, so no light gets through.`,
      },
    },
  },
  'e7.58.apparent-depth': {
    hints: [String.raw`Looking straight down, small angles give $d' = d\,\dfrac{n_{\text{viewer}}}{n_{\text{object}}}$.`],
  },
  'e7.58.dispersion': {
    hints: ['In glass the index is slightly larger for shorter wavelengths. A larger n means more bending and a lower speed, v = c/n.'],
    why: {
      ans: {
        1: ($) => ($.q === 2 ? 'Violet has the largest index, so it is the slowest: v = c/n.' : 'Violet has the largest index; check which way the question asks.'),
        2: 'Red has the smallest index in glass, so it bends the least.',
        3: 'The index depends on wavelength — that is exactly why a prism spreads white light into colours.',
      },
    },
  },
  'e7.59.mirror': {
    why: { type: { 1: IMAGE, 2: IMAGE, 3: IMAGE, 4: IMAGE, 5: IMAGE } },
  },
  'e7.60.lens': {
    why: { type: { 1: IMAGE, 2: IMAGE, 3: IMAGE, 4: IMAGE, 5: IMAGE } },
  },
  'e7.62.magnifier': {
    hints: [
      'Angular magnification compares the angle through the lens with the angle at the near point, 25 cm.',
      String.raw`Relaxed eye (image at infinity): $M = \dfrac{25\ \text{cm}}{f}$. Image at the near point: $M = 1 + \dfrac{25\ \text{cm}}{f}$.`,
    ],
  },
  'e7.62.telescope': {
    hints: [
      String.raw`A relaxed-eye telescope has $M = -\dfrac{f_o}{f_e}$.`,
      'The focal points of the two lenses coincide, so the lenses are separated by the sum of the focal lengths.',
    ],
  },
  'e7.62.microscope': {
    hints: [
      String.raw`The objective magnifies by about $-L/f_o$, and the eyepiece works as a magnifier, $25\ \text{cm}/f_e$.`,
      'The overall magnification is the product of the two.',
    ],
  },
};
