// backend/utils/passwordGenerator.js
// Generates a secure, readable temporary password

const generateTempPassword = () => {
  // Character sets — exclude confusing chars like 0/O, 1/l/I
  const upper  = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$';

  // Guarantee at least 1 of each type
  const pick = (str) => str[Math.floor(Math.random() * str.length)];

  const required = [
    pick(upper),
    pick(upper),
    pick(lower),
    pick(lower),
    pick(digits),
    pick(digits),
    pick(special),
  ];

  // Fill remaining chars to reach length 10
  const all = upper + lower + digits + special;
  while (required.length < 10) {
    required.push(pick(all));
  }

  // Shuffle to avoid predictable pattern
  return required.sort(() => Math.random() - 0.5).join('');
};

module.exports = { generateTempPassword };
