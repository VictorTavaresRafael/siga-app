const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildDailyCode,
  isValidDailyCode,
  localDay,
  startOfLocalDay,
} = require('../dist/modules/attendance/daily-code.js');

const TZ = 'America/Sao_Paulo';
const SECRET = 'test-secret';

test('localDay uses the app timezone, not UTC', () => {
  // 22h em Brasília já é dia seguinte em UTC
  const lateEvening = new Date('2026-11-21T01:00:00Z');
  assert.equal(localDay(lateEvening, TZ), '2026-11-20');
});

test('startOfLocalDay returns local midnight', () => {
  const start = startOfLocalDay(new Date('2026-11-21T01:00:00Z'), TZ);
  assert.equal(start.toISOString(), '2026-11-20T03:00:00.000Z');
});

test('daily code cannot be guessed from the date alone', () => {
  const date = new Date('2026-11-20T15:00:00Z');
  const code = buildDailyCode(SECRET, date, TZ);
  assert.match(code, /^SIGA-2026-11-20-[A-Za-z0-9_-]{16}$/);
  assert.equal(isValidDailyCode('SIGA-2026-11-20', SECRET, date, TZ), false);
  assert.equal(isValidDailyCode(code, SECRET, date, TZ), true);
});

test('daily code changes with the day and with the secret', () => {
  const day1 = new Date('2026-11-20T15:00:00Z');
  const day2 = new Date('2026-11-21T15:00:00Z');
  assert.notEqual(buildDailyCode(SECRET, day1, TZ), buildDailyCode(SECRET, day2, TZ));
  assert.notEqual(buildDailyCode(SECRET, day1, TZ), buildDailyCode('other', day1, TZ));
  assert.equal(isValidDailyCode(buildDailyCode(SECRET, day1, TZ), SECRET, day2, TZ), false);
});

test('isValidDailyCode rejects non-string input', () => {
  assert.equal(isValidDailyCode(undefined, SECRET), false);
  assert.equal(isValidDailyCode(123, SECRET), false);
});
