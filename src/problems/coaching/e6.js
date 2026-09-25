/** Exam 6 coaching (Ch 53–57) — see e1.js for the format. */
const BANDS = 'Going down in wavelength: radio (above 1 m), microwave (1 mm – 1 m), infrared (700 nm – 1 mm), visible (400–700 nm), ultraviolet (10–400 nm), X-ray (0.01–10 nm), gamma (below 0.01 nm).';
const SPECTRUM = 'Radio → microwave → infrared → visible → ultraviolet → X-ray → gamma: frequency rises and wavelength falls along that list.';
const SOURCE = 'The frequency is set by the source: the wave crests arrive at the boundary as often as they leave it, so it cannot change.';

export default {
  'e6.53.f-from-lambda': {
    hints: [String.raw`In vacuum $c = f\lambda$, so $f = c/\lambda$ with λ in metres (nm × 10⁻⁹).`, String.raw`The period is $T = 1/f$.`],
  },
  'e6.53.B-from-E': {
    hints: [String.raw`In an EM wave in vacuum the fields are locked together: $E = cB$.`],
  },
  'e6.53.direction': {
    why: {
      dir: {
        1: String.raw`Work out $\vec{E}\times\vec{B}$ with $\hat{x}\times\hat{y} = \hat{z}$, $\hat{y}\times\hat{z} = \hat{x}$, $\hat{z}\times\hat{x} = \hat{y}$; reversing the order flips the sign.`,
        [-1]: String.raw`Work out $\vec{E}\times\vec{B}$ with $\hat{x}\times\hat{y} = \hat{z}$, $\hat{y}\times\hat{z} = \hat{x}$, $\hat{z}\times\hat{x} = \hat{y}$; reversing the order flips the sign.`,
        2: String.raw`The wave travels perpendicular to both $\vec{E}$ and $\vec{B}$, so it cannot move along either of them.`,
        [-2]: String.raw`The wave travels perpendicular to both $\vec{E}$ and $\vec{B}$, so it cannot move along either of them.`,
        3: String.raw`The wave travels perpendicular to both $\vec{E}$ and $\vec{B}$, so it cannot move along either of them.`,
        [-3]: String.raw`The wave travels perpendicular to both $\vec{E}$ and $\vec{B}$, so it cannot move along either of them.`,
      },
    },
  },
  'e6.53.wave-eq': {
    hints: [
      String.raw`Match the form $E_0\sin(kx - \omega t)$: the number in front of $x$ is $k$, and $\lambda = 2\pi/k$.`,
      String.raw`In vacuum $\omega = ck$, $f = \omega/2\pi$ and $B_0 = E_0/c$.`,
    ],
  },
  'e6.54.band': {
    hints: [BANDS],
    why: { band: { radio: BANDS, microwave: BANDS, ir: BANDS, vis: BANDS, uv: BANDS, xray: BANDS, gamma: BANDS } },
  },
  'e6.54.order': {
    hints: [SPECTRUM, 'All of them are light, so all travel at c in vacuum.'],
    why: {
      ans: {
        1: ($) => ($.qty === 3 ? 'Every EM wave travels at c in vacuum, whatever its band.' : SPECTRUM),
        2: ($) => ($.qty === 3 ? 'Every EM wave travels at c in vacuum, whatever its band.' : SPECTRUM),
        0: String.raw`Only the speed in vacuum is the same for every band. Frequency and wavelength differ, with $c = f\lambda$.`,
      },
    },
  },
  'e6.55.intensity': {
    hints: [String.raw`$I = \tfrac12 c\varepsilon_0 E_0^2$ — the ½ is the time average of $\sin^2$.`],
  },
  'e6.55.E-from-I': {
    hints: [String.raw`Turn $I = \tfrac12 c\varepsilon_0 E_0^2$ round: $E_0 = \sqrt{\dfrac{2I}{c\varepsilon_0}}$.`, String.raw`Then $B_0 = E_0/c$.`],
  },
  'e6.55.point-source': {
    hints: [
      String.raw`The power spreads over a sphere: $I = \dfrac{P}{4\pi r^2}$.`,
      String.raw`Then $E_0 = \sqrt{2I/(c\varepsilon_0)}$.`,
    ],
  },
  'e6.55.pressure': {
    hints: [
      String.raw`Absorbed light pushes with $p = I/c$; reflected light bounces back and pushes twice as hard, $p = 2I/c$.`,
      String.raw`Force = pressure × area.`,
    ],
  },
  'e6.56.malus-two': {
    hints: [
      'The first polarizer passes half of unpolarized light, whatever its angle.',
      String.raw`After that, Malus's law: $I_2 = I_1\cos^2\theta$, with θ between the two axes.`,
    ],
  },
  'e6.56.polarized-in': {
    hints: [String.raw`The light is already polarized, so there is no factor of ½: $I = I_0\cos^2\theta$.`],
  },
  'e6.56.brewster': {
    hints: [
      String.raw`Brewster's angle: $\tan\theta_B = \dfrac{n_2}{n_1}$.`,
      String.raw`At Brewster's angle the reflected and refracted rays are 90° apart, so $\theta_r = 90^\circ - \theta_B$.`,
    ],
  },
  'e6.57.in-medium': {
    hints: [
      String.raw`$v = c/n$ and $\lambda = \lambda_0/n$.`,
      String.raw`The frequency does not change: $f = c/\lambda_0$, the same as in vacuum.`,
    ],
  },
  'e6.57.what-changes': {
    hints: [String.raw`$v = c/n$ and $\lambda = \lambda_0/n$. Which quantity is fixed by the source?`],
    why: {
      ans: {
        [-1]: SOURCE,
        0: ($) => ($.q === 1 ? String.raw`Glass has $n > 1$, so light slows down: $v = c/n$.` : String.raw`The speed drops but the frequency does not, so the wavelength shrinks: $\lambda = \lambda_0/n$.`),
        1: ($) => ($.q === 3 ? SOURCE : String.raw`Glass has $n > 1$: $v = c/n$ and $\lambda = \lambda_0/n$ both get smaller.`),
        2: 'Colour follows frequency, and the frequency is set by the source, so the colour does not change.',
        3: 'Colour follows frequency, and the frequency is set by the source, so the colour does not change.',
      },
    },
  },
  'e6.57.plane-mirror': {
    hints: [
      'A plane-mirror image is as far behind the mirror as you are in front of it.',
      'Walking toward the mirror, you and your image both close in. For the minimum height, trace rays from your eyes to your feet and head: the mirror needs only half your height.',
    ],
  },
  'e6.57.two-mirrors': {
    hints: [String.raw`Two mirrors at angle θ make $\dfrac{360^\circ}{\theta} - 1$ images (when 360°/θ is a whole number).`],
  },
};
