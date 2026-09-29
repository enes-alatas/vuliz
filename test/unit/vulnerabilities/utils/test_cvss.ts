import {cvss3BaseScore} from 'src/vulnerabilities/utils/cvss';

describe('cvss3BaseScore', () => {
  it.each([
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8],
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', 10.0],
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N', 4.3],
    ['CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H', 5.9],
    ['CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 7.8],
    ['CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:L/I:L/A:N', 6.4],
    ['CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N', 7.5],
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N', 0],
  ])('scores %s as %d', (vector, expected) => {
    expect(cvss3BaseScore(vector)).toBe(expected);
  });

  it('ignores temporal and environmental metrics', () => {
    expect(
      cvss3BaseScore('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:U/RL:O'),
    ).toBe(9.8);
  });

  it.each([
    ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N'],
    ['AV:N/AC:L/Au:N/C:P/I:P/A:P'],
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H'],
    ['CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'],
    [''],
  ])('returns undefined for invalid vector %s', vector => {
    expect(cvss3BaseScore(vector)).toBeUndefined();
  });
});
