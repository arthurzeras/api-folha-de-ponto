import app from '../app.mjs';
import test from 'node:test';
import request from 'supertest';
import assert from 'node:assert';
import messages from '../messages.mjs';
import db, { client } from '../db.mjs';

test.beforeEach(async () => {
  await client.connect();
});

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

  const EXPECTED_DB_RETURN = { day: '2023-11-29', registers: ['08:00:00'] };
  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, EXPECTED_DB_RETURN);

  app.close();
});

test('Should not create two registers for same day', async () => {
  const response1 = await request(app)
    .post('/batidas')
    .send({ momento: '2023-11-29T08:00:00' });

  const EXPECTED_STATUS_CODE = 200;
  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['08:00:00'] };
  const EXPECTED_RESPONSE_TYPE = 'application/json';

  assert.strictEqual(response1.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response1.status, EXPECTED_STATUS_CODE);
  assert.deepEqual(response1.body, EXPECTED_RESPONSE);

  const EXPECTED_DB_RETURN = { day: '2023-11-29', registers: ['08:00:00'] };
  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, EXPECTED_DB_RETURN);

  const response2 = await request(app)
    .post('/batidas')
    .send({ momento: '2023-11-29T12:00:00' });

  assert.strictEqual(response2.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response2.status, EXPECTED_STATUS_CODE);

  const totalRegisters = await db
    .collection('registers')
    .countDocuments({ day: '2023-11-29' });

  const EXPECTED_TOTAL_REGISTERS = 1;
  assert.strictEqual(totalRegisters, EXPECTED_TOTAL_REGISTERS);

  const registerUpdated = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete registerUpdated._id;

  EXPECTED_DB_RETURN.registers.push('12:00:00');
  assert.deepEqual(registerUpdated, EXPECTED_DB_RETURN);
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

test('Should return a Bad Request error if hour is before than the previous added', async () => {
  const response1 = await request(app)
    .post('/batidas')
    .send({ momento: '2023-11-29T09:00:00' });

  const EXPECTED_STATUS_CODE = 200;
  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['09:00:00'] };
  const EXPECTED_RESPONSE_TYPE = 'application/json';

  assert.strictEqual(response1.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response1.status, EXPECTED_STATUS_CODE);
  assert.deepEqual(response1.body, EXPECTED_RESPONSE);

  const EXPECTED_DB_RETURN = { day: '2023-11-29', registers: ['09:00:00'] };
  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, EXPECTED_DB_RETURN);

  const response2 = await request(app)
    .post('/batidas')
    .send({ momento: '2023-11-29T08:00:00' });

  const EXPECTED_STATUS_CODE_2 = 400;
  const EXPECTED_RESPONSE_2 = { message: messages.REGISTER.INVALID_HOUR };

  assert.strictEqual(response2.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response2.status, EXPECTED_STATUS_CODE_2);
  assert.deepEqual(response2.body, EXPECTED_RESPONSE_2);

  const register2 = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  const EXPECTED_TOTAL_REGISTERS = 1;
  assert.strictEqual(register2.registers.length, EXPECTED_TOTAL_REGISTERS);
});

test('Should return a Bad Request error if hour is same than the previous added', async () => {
  const response1 = await request(app)
    .post('/batidas')
    .send({ momento: '2023-11-29T08:00:00' });

  const EXPECTED_STATUS_CODE = 200;
  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['08:00:00'] };
  const EXPECTED_RESPONSE_TYPE = 'application/json';

  assert.strictEqual(response1.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response1.status, EXPECTED_STATUS_CODE);
  assert.deepEqual(response1.body, EXPECTED_RESPONSE);

  const EXPECTED_DB_RETURN = { day: '2023-11-29', registers: ['08:00:00'] };
  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, EXPECTED_DB_RETURN);

  const response2 = await request(app)
    .post('/batidas')
    .send({ momento: '2023-11-29T08:00:00' });

  const EXPECTED_STATUS_CODE_2 = 400;
  const EXPECTED_RESPONSE_2 = { message: messages.REGISTER.INVALID_HOUR };

  assert.strictEqual(response2.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response2.status, EXPECTED_STATUS_CODE_2);
  assert.deepEqual(response2.body, EXPECTED_RESPONSE_2);

  const register2 = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  const EXPECTED_TOTAL_REGISTERS = 1;
  assert.strictEqual(register2.registers.length, EXPECTED_TOTAL_REGISTERS);
});

test('Should save two registers', async () => {
  const response1 = await request(app)
    .post('/batidas')
    .send({ momento: '2023-11-29T08:00:00' });

  const EXPECTED_STATUS_CODE = 200;
  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['08:00:00'] };
  const EXPECTED_RESPONSE_TYPE = 'application/json';

  assert.strictEqual(response1.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response1.status, EXPECTED_STATUS_CODE);
  assert.deepEqual(response1.body, EXPECTED_RESPONSE);

  const EXPECTED_DB_RETURN = { day: '2023-11-29', registers: ['08:00:00'] };
  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, EXPECTED_DB_RETURN);

  const response2 = await request(app)
    .post('/batidas')
    .send({ momento: '2023-11-29T12:00:00' });

  EXPECTED_RESPONSE.pontos.push('12:00:00');
  assert.strictEqual(response2.type, EXPECTED_RESPONSE_TYPE);
  assert.strictEqual(response2.status, EXPECTED_STATUS_CODE);
  assert.deepEqual(response2.body, EXPECTED_RESPONSE);

  const register2 = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register2._id;

  const EXPECTED_TOTAL_REGISTERS = 2;
  const EXPECTED_DB_RETURN_2 = {
    day: '2023-11-29',
    registers: ['08:00:00', '12:00:00'],
  };

  assert.strictEqual(register2.registers.length, EXPECTED_TOTAL_REGISTERS);
  assert.deepEqual(register2, EXPECTED_DB_RETURN_2);
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

test.afterEach(async () => {
  await db.collection('registers').drop();
  await client.close();
});
