/**
 * Wave optics · Ch 63 (interference), 64 (diffraction), 65 (thin films).
 *
 * Everything here is SI and pure. The angle formulas are exact (they use asin, not the small-angle
 * shortcut); the screen positions are the small-angle ones the course uses, y = L tanθ, so a lab
 * and a worked problem land on the same number.
 *
 * Intensity profiles are normalised to 1 at the centre so a lab can paint them straight onto a
 * screen texture.
 */

/** sin(x)/x, continuous at 0. */
export function sinc(x) {
  return Math.abs(x) < 1e-12 ? 1 : Math.sin(x) / x;
}

const asinOrNull = (s) => (Math.abs(s) <= 1 ? Math.asin(s) : null);

// ---------------------------------------------------------------- Ch 63: two slits

/**
 * Young's double slit. `d` is the slit separation, `L` the screen distance, `a` the width of each
 * slit (optional — when given, the two-slit fringes carry the single-slit envelope, which is what
 * a real pattern looks like and why some orders go missing).
 */
export function doubleSlit({ lambda, d, L, a = 0 }) {
  const dy = (lambda * L) / d; // fringe spacing, small angle
  return {
    lambda,
    d,
    L,
    a,
    dy,
    /** Angle of the m-th bright fringe: d sinθ = mλ. null when that order does not exist. */
    thetaBright: (m) => asinOrNull((m * lambda) / d),
    /** Angle of the m-th dark fringe: d sinθ = (m + ½)λ, m = 0 is the first dark one. */
    thetaDark: (m) => asinOrNull(((m + 0.5) * lambda) / d),
    /** Screen position of the m-th bright fringe, exactly: y = L tanθ. */
    yBright(m) {
      const th = this.thetaBright(m);
      return th == null ? null : L * Math.tan(th);
    },
    yDark(m) {
      const th = this.thetaDark(m);
      return th == null ? null : L * Math.tan(th);
    },
    /** Small-angle position, which is what the course's y = mλL/d gives. */
    ySmall: (m) => (m * lambda * L) / d,
    /** Highest order that exists at all (sinθ ≤ 1). */
    maxOrder: Math.floor(d / lambda),
  };
}

/** Two-slit intensity at angle θ, normalised to 1, including the single-slit envelope when a > 0. */
export function doubleSlitIntensity(theta, { lambda, d, a = 0 }) {
  const s = Math.sin(theta);
  const interference = Math.cos((Math.PI * d * s) / lambda) ** 2;
  if (!a) return interference;
  const env = sinc((Math.PI * a * s) / lambda) ** 2;
  return interference * env;
}

/** Michelson: moving one mirror by Δd changes the path by 2Δd, so N = 2Δd/λ fringes pass. */
export function michelson({ dd, lambda }) {
  return { N: (2 * dd) / lambda, pathChange: 2 * dd };
}

// ---------------------------------------------------------------- Ch 64: one slit, gratings

/** Single slit of width `a`. Dark fringes at a sinθ = mλ, m = 1, 2, … */
export function singleSlit({ lambda, a, L }) {
  const theta1 = asinOrNull(lambda / a);
  return {
    lambda,
    a,
    L,
    theta1,
    thetaDark: (m) => asinOrNull((m * lambda) / a),
    yDark(m) {
      const th = this.thetaDark(m);
      return th == null ? null : L * Math.tan(th);
    },
    /** Width of the central maximum, the small-angle 2λL/a the course uses. */
    width: (2 * lambda * L) / a,
    /** The same width read off the exact angle, for the lab to draw. */
    widthExact: theta1 == null ? Infinity : 2 * L * Math.tan(theta1),
  };
}

/** Single-slit diffraction intensity at angle θ, normalised to 1. */
export function singleSlitIntensity(theta, { lambda, a }) {
  return sinc((Math.PI * a * Math.sin(theta)) / lambda) ** 2;
}

/**
 * Diffraction grating. Give it either the line spacing `d` or `linesPerM` (lines per metre, which
 * is how a grating is sold: 600 lines/mm = 6×10⁵ /m).
 */
export function grating({ lambda, d, linesPerM, N = 0 }) {
  const spacing = d ?? 1 / linesPerM;
  return {
    lambda,
    d: spacing,
    linesPerM: linesPerM ?? 1 / spacing,
    N,
    thetaOrder: (m) => asinOrNull((m * lambda) / spacing),
    /** Highest order that fits inside sinθ ≤ 1. */
    maxOrder: Math.floor(spacing / lambda),
  };
}

/** Grating intensity at θ for N illuminated slits: the N-slit interference function, peak 1. */
export function gratingIntensity(theta, { lambda, d, N = 8 }) {
  const phi = (Math.PI * d * Math.sin(theta)) / lambda;
  const den = Math.sin(phi);
  if (Math.abs(den) < 1e-9) return 1;
  return (Math.sin(N * phi) / (N * den)) ** 2;
}

/** Rayleigh's criterion for a circular aperture: θ_min = 1.22 λ/D. */
export function rayleigh({ lambda, D, L = 0 }) {
  const thetaMin = (1.22 * lambda) / D;
  return { thetaMin, separation: thetaMin * L, L, D, lambda };
}

/** Airy-disk intensity at angle θ (normalised to 1), for drawing two overlapping sources. */
export function airyIntensity(theta, { lambda, D }) {
  const x = (Math.PI * D * Math.sin(theta)) / lambda;
  if (Math.abs(x) < 1e-9) return 1;
  // 2 J1(x)/x, with J1 from its series — plenty accurate over the few rings a lab draws.
  return (2 * besselJ1(x) / x) ** 2;
}

/** J₁ by power series, switched to the large-x asymptotic form where the series loses precision. */
export function besselJ1(x) {
  const ax = Math.abs(x);
  if (ax < 12) {
    let term = x / 2;
    let sum = term;
    for (let k = 1; k < 40; k++) {
      term *= -(x * x) / (4 * k * (k + 1));
      sum += term;
      if (Math.abs(term) < 1e-16 * Math.abs(sum)) break;
    }
    return sum;
  }
  const z = ax - (3 * Math.PI) / 4;
  const j = Math.sqrt(2 / (Math.PI * ax)) * Math.cos(z);
  return x < 0 ? -j : j;
}

// ---------------------------------------------------------------- Ch 65: thin films

/**
 * A film of index `nFilm` and thickness `t`, sitting on `nSub` with `nTop` above it (air = 1).
 *
 * A reflection off a higher-index medium flips the wave by half a wavelength. Count how many of
 * the two reflections do that: an odd count means the two paths already disagree by half a
 * wavelength before any travelling, so the conditions swap.
 */
export function thinFilm({ nFilm, nSub, nTop = 1, lambda, t = 0 }) {
  const shifts = (nFilm > nTop ? 1 : 0) + (nSub > nFilm ? 1 : 0);
  const odd = shifts % 2 === 1;
  const lamFilm = lambda / nFilm;
  // With an odd number of shifts, 2t = (m + ½)λ_film is bright; with an even number it is dark.
  const brightHalfInteger = odd;
  return {
    shifts,
    lambdaFilm: lamFilm,
    /** Thinnest nonzero film that reflects this wavelength strongly. */
    tBright: brightHalfInteger ? lamFilm / 4 : lamFilm / 2,
    /** Thinnest nonzero film that cancels it. */
    tDark: brightHalfInteger ? lamFilm / 2 : lamFilm / 4,
    /** Phase difference between the two reflected rays, in wavelengths, for the given t. */
    pathWaves: (2 * nFilm * t) / lambda + (odd ? 0.5 : 0),
    /** Reflected intensity for the given t, normalised to 1: cos² of half the phase difference. */
    reflectance: Math.cos(Math.PI * ((2 * nFilm * t) / lambda + (odd ? 0.5 : 0))) ** 2,
    /** Every thickness that is bright / dark, in order, so a lab can mark them. */
    tBrightOrder: (m) => (brightHalfInteger ? ((m + 0.5) * lamFilm) / 2 : (m * lamFilm) / 2),
    tDarkOrder: (m) => (brightHalfInteger ? (m * lamFilm) / 2 : ((m + 0.5) * lamFilm) / 2),
  };
}

/** Does a reflection going from `nFrom` into `nTo` pick up the half-wave shift? */
export function hasPhaseShift(nFrom, nTo) {
  return nTo > nFrom;
}

/** Wavelength inside a medium: λ_n = λ_vacuum / n. */
export const lambdaIn = (lambda, n) => lambda / n;

// ---------------------------------------------------------------- colour, for the labs

/**
 * Approximate sRGB for a visible wavelength (380–780 nm). Used only for drawing — no physics
 * depends on it. Based on the piecewise fit that every optics demo uses.
 */
export function wavelengthRGB(lambdaM) {
  const nm = lambdaM * 1e9;
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / 60;
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = -(nm - 510) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = -(nm - 645) / 65;
  } else if (nm <= 780) {
    r = 1;
  }
  // Fade at the ends of the visible range, then gamma-correct.
  let f = 1;
  if (nm >= 380 && nm < 420) f = 0.3 + (0.7 * (nm - 380)) / 40;
  else if (nm > 700 && nm <= 780) f = 0.3 + (0.7 * (780 - nm)) / 80;
  else if (nm < 380 || nm > 780) f = 0;
  const g22 = (v) => Math.round(255 * Math.pow(Math.max(0, v) * f, 0.8));
  return { r: g22(r), g: g22(g), b: g22(b) };
}
