import test from 'node:test';
import assert from 'node:assert';
import * as utils from '../utils.mjs';

test('Should format 08:00:00 hours to seconds', () => {
  const INPUT = '08:00:00';
  const EXPECTED = 28800;
  const seconds = utils.hourStringToSeconds(INPUT);
  assert.strictEqual(seconds, EXPECTED);
});

test('Should format 17:43:11 hours to seconds', () => {
  const INPUT = '17:43:11';
  const EXPECTED = 63791;
  const seconds = utils.hourStringToSeconds(INPUT);
  assert.strictEqual(seconds, EXPECTED);
});

test('Should format 0 seconds to correct ISO 8601 duration', () => {
  const INPUT = 0;
  const EXPECTED = 'PT0S';
  const duration = utils.secondsToISO8601Duration(INPUT);
  assert.strictEqual(duration, EXPECTED);
});

test('Should format 3600 seconds (1 hour) to correct ISO 8601 duration', () => {
  const INPUT = 3600;
  const EXPECTED = 'PT1H0S';
  const duration = utils.secondsToISO8601Duration(INPUT);
  assert.strictEqual(duration, EXPECTED);
});

test('Should format 252922 seconds (70:15:22) to correct ISO 8601 duration', () => {
  const INPUT = 252922;
  const EXPECTED = 'PT70H15M22S';
  const duration = utils.secondsToISO8601Duration(INPUT);
  assert.strictEqual(duration, EXPECTED);
});
