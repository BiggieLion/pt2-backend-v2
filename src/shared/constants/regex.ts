const STATE_CODES = [
  'AS',
  'BC',
  'BS',
  'CC',
  'CL',
  'CM',
  'CS',
  'CH',
  'DF',
  'DG',
  'GT',
  'GR',
  'HG',
  'JC',
  'MC',
  'MN',
  'MS',
  'NT',
  'NL',
  'OC',
  'PL',
  'QT',
  'QR',
  'SP',
  'SL',
  'SR',
  'TC',
  'TS',
  'TL',
  'VZ',
  'YN',
  'ZS',
  'NE',
] as const;

const STATE_GROUP = STATE_CODES.join('|');

export const CURP_REGEX: RegExp = new RegExp(
  '^' +
    '[A-Z][AEIOU][A-Z]{2}' +
    '\\d{2}' +
    '(0[1-9]|1[0-2])' +
    '(0[1-9]|[12]\\d|3[01])' +
    '[HM]' +
    `(?:${STATE_GROUP})` +
    '[B-DF-HJ-NP-TV-Z]{3}' +
    '[0-9A-Z]' +
    '\\d' +
    '$',
);

export const RFC_REGEX: RegExp = new RegExp(
  '^' +
    '[A-ZÑ]{4}' +
    '\\d{2}' +
    '(0[1-9]|1[0-2])' +
    '(0[1-9]|[12]\\d|3[01])' +
    '[A-Z\\d]{3}' +
    '$',
);

export const PASSWORD_REGEX: RegExp =
  /^(?=.*\d)(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{6,}$/;
