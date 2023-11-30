import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from './app.mjs';

test('Should return Hello World for / endpoint', async (t) => {
  const response = await request(app).get('/');

  const EXPECTED_STATUS_CODE = 200;
  const EXPECTED_RESPONSE = 'Hello World!';

  assert.strictEqual(response.status, EXPECTED_STATUS_CODE);
  assert.strictEqual(response.text, EXPECTED_RESPONSE);

  app.close();
});

test('Tests for registers', async (t) => {
  await t.test('Should return TO DO /batidas endpoint', async () => {
    const response = await request(app).post('/batidas');

    const EXPECTED_STATUS_CODE = 200;
    const EXPECTED_RESPONSE = { message: 'TO DO' };
    const EXPECTED_RESPONSE_TYPE = 'application/json';

    assert.strictEqual(response.type, EXPECTED_RESPONSE_TYPE);
    assert.strictEqual(response.status, EXPECTED_STATUS_CODE);
    assert.deepEqual(response.body, EXPECTED_RESPONSE);

    app.close();
  });
});

test('Tests for reports', async (t) => {
  await t.test(
    'Should return TO DO for /folhas-de-ponto/:mes endpoint',
    async () => {
      const response = await request(app).get('/folhas-de-ponto/22222');

      const EXPECTED_STATUS_CODE = 200;
      const EXPECTED_RESPONSE = { message: 'TO DO' };
      const EXPECTED_RESPONSE_TYPE = 'application/json';

      assert.strictEqual(response.type, EXPECTED_RESPONSE_TYPE);
      assert.strictEqual(response.status, EXPECTED_STATUS_CODE);
      assert.deepEqual(response.body, EXPECTED_RESPONSE);

      app.close();
    },
  );
});
