/**
 * Malus’s law through a stack of linear polarizers.
 * `sourceAngle` null = unpolarized. Angles in degrees (transmission axis).
 * First polarizer on unpolarized light: I → I/2 and the light becomes polarized along that axis.
 */
export function malusChain(I0, anglesDeg, sourceAngle = null) {
  let I = I0;
  let axis = sourceAngle;
  const steps = [{ I, pol: sourceAngle != null, axis: sourceAngle, label: 'source' }];
  for (let n = 0; n < anglesDeg.length; n++) {
    const th = anglesDeg[n];
    if (axis == null) {
      I *= 0.5;
    } else {
      const d = ((th - axis) * Math.PI) / 180;
      I *= Math.cos(d) * Math.cos(d);
    }
    axis = th;
    steps.push({ I, pol: true, axis: th, label: `P${n + 1}` });
  }
  return { I, steps };
}

export function malus(Iin, deltaDeg) {
  const c = Math.cos((deltaDeg * Math.PI) / 180);
  return Iin * c * c;
}
