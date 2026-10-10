const crypto = require('crypto');

const uniqueId = () => `${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
const randomEmail = (prefix = 'qa') => `${prefix}.${uniqueId()}@example.com`;
const randomPhone = () => String(crypto.randomInt(6, 10)) + String(crypto.randomInt(0, 1e9)).padStart(9, '0');
const strongPassword = () => `Aa1!${crypto.randomBytes(5).toString('hex')}`;
const longString = (n, ch = 'a') => ch.repeat(n);

function registrationUser(overrides = {}) {
  const password = strongPassword();
  return {
    firstName: 'Test',
    lastName: `User${uniqueId().slice(-5)}`,
    email: randomEmail('reg'),
    phone: randomPhone(),
    occupation: 'Engineer',
    gender: 'Male',
    password,
    confirmPassword: password,
    ...overrides,
  };
}

const EDGE_STRINGS = {
  empty: '',
  spaces: '     ',
  unicode: 'テスト用户Ωß😀',
  rtl: 'مرحبا',
  longInput: longString(5000),
  specialChars: `!@#$%^&*()_+-=[]{}|;':",./<>?\`~`,
  leadingTrailingSpaces: '  padded@example.com  ',
  newline: 'line1\nline2',
  nullByte: 'abc\u0000def',
};

module.exports = { uniqueId, randomEmail, randomPhone, strongPassword, longString, registrationUser, EDGE_STRINGS };
