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
