/**
 * CVSS v3.x base score calculation.
 *
 * Implements the base score formula from the CVSS v3.1 specification
 * (https://www.first.org/cvss/v3.1/specification-document), which is
 * also used for v3.0 vectors.
 */

const ATTACK_VECTOR: Record<string, number> = {
  N: 0.85,
  A: 0.62,
  L: 0.55,
  P: 0.2,
};
const ATTACK_COMPLEXITY: Record<string, number> = {L: 0.77, H: 0.44};
const PRIVILEGES_REQUIRED_UNCHANGED: Record<string, number> = {
  N: 0.85,
  L: 0.62,
  H: 0.27,
};
const PRIVILEGES_REQUIRED_CHANGED: Record<string, number> = {
  N: 0.85,
  L: 0.68,
  H: 0.5,
};
const USER_INTERACTION: Record<string, number> = {N: 0.85, R: 0.62};
const IMPACT: Record<string, number> = {H: 0.56, L: 0.22, N: 0};

/**
 * Rounds up to one decimal place as defined in CVSS v3.1 Appendix A,
 * avoiding floating point artifacts.
 */
function roundUp(value: number): number {
  const intInput = Math.round(value * 100000);
  if (intInput % 10000 === 0) {
    return intInput / 100000;
  }
  return (Math.floor(intInput / 10000) + 1) / 10;
}

/**
 * Calculates the base score of a CVSS v3.x vector string.
 *
 * @param vector A vector such as `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`
 * @returns The base score (0-10), or undefined if the vector is not a valid v3.x vector
 */
export function cvss3BaseScore(vector: string): number | undefined {
  const parts = vector.split('/');
  if (!/^CVSS:3\.[01]$/.test(parts[0])) {
    return undefined;
  }

  const metrics = new Map<string, string>();
  for (const part of parts.slice(1)) {
    const [key, value] = part.split(':');
    if (key && value) {
      metrics.set(key, value);
    }
  }

  const scope = metrics.get('S');
  const av = ATTACK_VECTOR[metrics.get('AV') ?? ''];
  const ac = ATTACK_COMPLEXITY[metrics.get('AC') ?? ''];
  const pr = (
    scope === 'C' ? PRIVILEGES_REQUIRED_CHANGED : PRIVILEGES_REQUIRED_UNCHANGED
  )[metrics.get('PR') ?? ''];
  const ui = USER_INTERACTION[metrics.get('UI') ?? ''];
  const c = IMPACT[metrics.get('C') ?? ''];
  const i = IMPACT[metrics.get('I') ?? ''];
  const a = IMPACT[metrics.get('A') ?? ''];

  if (
    (scope !== 'U' && scope !== 'C') ||
    [av, ac, pr, ui, c, i, a].some(weight => weight === undefined)
  ) {
    return undefined;
  }

  const iss = 1 - (1 - c) * (1 - i) * (1 - a);
  const impact =
    scope === 'U'
      ? 6.42 * iss
      : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  const exploitability = 8.22 * av * ac * pr * ui;

  if (impact <= 0) {
    return 0;
  }
  if (scope === 'U') {
    return roundUp(Math.min(impact + exploitability, 10));
  }
  return roundUp(Math.min(1.08 * (impact + exploitability), 10));
}
