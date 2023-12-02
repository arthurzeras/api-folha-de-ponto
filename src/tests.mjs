import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from './app.mjs';
import messages from './messages.mjs';

test('Should return Hello World for / endpoint', async (t) => {
  const response = await request(app).get('/');

  const EXPECTED_STATUS_CODE = 200;
  const EXPECTED_RESPONSE = 'Hello World!';

  assert.strictEqual(response.status, EXPECTED_STATUS_CODE);
  assert.strictEqual(response.text, EXPECTED_RESPONSE);

  app.close();
});

test('Should save a new entrance for /batidas endpoint', async () => {
  const response = await request(app)
    .post('/batidas')
    .send({ momento: '2023-11-29T08:00:00' });

  const EXPECTED_STATUS_CODE = 200;
  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['08:00:00'] };
  const EXPECTED_RESPONSE_TYPE = 'application/json';

  assert.strictEqual(response.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response.status, EXPECTED_STATUS_CODE);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  app.close();
});

test('Should return a Bad Request error if not receive "momento" parameter', async () => {
  const response = await request(app).post('/batidas');

  const EXPECTED_STATUS_CODE = 400;
  const EXPECTED_RESPONSE_TYPE = 'application/json';
  const EXPECTED_RESPONSE = {
    mensagem: messages.REGISTER.INVALID_PARAMETER,
  };

  assert.strictEqual(response.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response.status, EXPECTED_STATUS_CODE);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  app.close();
});

test('Should return a Bad Request error if "momento" parameter is not a valid date', async () => {
  const response = await request(app)
    .post('/batidas')
    .send({ momento: 'dasdsadsa' });

  const EXPECTED_STATUS_CODE = 400;
  const EXPECTED_RESPONSE_TYPE = 'application/json';
  const EXPECTED_RESPONSE = {
    mensagem: messages.REGISTER.INVALID_PARAMETER_TYPE,
  };

  assert.strictEqual(response.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response.status, EXPECTED_STATUS_CODE);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  app.close();
});

test('Should return TO DO for /folhas-de-ponto/:mes endpoint', async () => {
  const response = await request(app).get('/folhas-de-ponto/22222');

  const EXPECTED_STATUS_CODE = 200;
  const EXPECTED_RESPONSE = { message: 'TO DO' };
  const EXPECTED_RESPONSE_TYPE = 'application/json';

  assert.strictEqual(response.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response.status, EXPECTED_STATUS_CODE);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  app.close();
});
