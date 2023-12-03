import app from '../app.mjs';
import test from 'node:test';
import request from 'supertest';
import assert from 'node:assert';
import * as utils from '../utils.mjs';
import messages from '../messages.mjs';
import db, { client } from '../db.mjs';
import * as fixtures from './fixtures.mjs';

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_CONFLICT = 409;
const HTTP_BAD_REQUEST = 400;

const HEADER_CONTENT_HTML = 'text/html';
const HEADER_CONTENT_JSON = 'application/json';

test.beforeEach(async () => {
  await client.connect();
});

function createRegister(date) {
  return request(app).post('/batidas').send({ momento: date });
}

test('Should show swagger docs for / endpoint', async (t) => {
  const response = await request(app).get('/');
  const EXPECTED_MATCH = /swagger/;

  assert.strictEqual(response.status, HTTP_OK);
  assert.strictEqual(response.type, HEADER_CONTENT_HTML);
  assert.match(response.text, EXPECTED_MATCH);

  app.close();
});

test('Should save a new entrance for /batidas endpoint', async () => {
  const response = await createRegister('2023-11-29T08:00:00');
  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['08:00:00'] };

  assert.strictEqual(response.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response.status, HTTP_CREATED);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  const EXPECTED_DB_RETURN = {
    day: '2023-11-29',
    monthString: '2023-11',
    registers: ['08:00:00'],
  };

  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, EXPECTED_DB_RETURN);

  app.close();
});

test('Should not create two registers for same day', async () => {
  const response1 = await createRegister('2023-11-29T08:00:00');
  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['08:00:00'] };

  assert.strictEqual(response1.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response1.status, HTTP_CREATED);
  assert.deepEqual(response1.body, EXPECTED_RESPONSE);

  const EXPECTED_DB_RETURN = {
    day: '2023-11-29',
    monthString: '2023-11',
    registers: ['08:00:00'],
  };

  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, EXPECTED_DB_RETURN);

  const response2 = await createRegister('2023-11-29T12:00:00');
  assert.strictEqual(response2.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response2.status, HTTP_CREATED);

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
  const EXPECTED_RESPONSE = {
    mensagem: messages.REGISTER.INVALID_PARAMETER,
  };

  assert.strictEqual(response.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response.status, HTTP_BAD_REQUEST);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  app.close();
});

test('Should return a Bad Request error if "momento" parameter is not a valid date', async () => {
  const response = await createRegister('mdasdasdas');
  const EXPECTED_RESPONSE = {
    mensagem: messages.REGISTER.INVALID_PARAMETER_TYPE,
  };

  assert.strictEqual(response.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response.status, HTTP_BAD_REQUEST);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  app.close();
});

test('Should return a Bad Request error if hour is before than the previous added', async () => {
  const response1 = await createRegister('2023-11-29T09:00:00');
  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['09:00:00'] };

  assert.strictEqual(response1.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response1.status, HTTP_CREATED);
  assert.deepEqual(response1.body, EXPECTED_RESPONSE);

  const EXPECTED_DB_RETURN = {
    day: '2023-11-29',
    monthString: '2023-11',
    registers: ['09:00:00'],
  };

  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, EXPECTED_DB_RETURN);

  const response2 = await createRegister('2023-11-29T08:00:00');
  const EXPECTED_RESPONSE_2 = { message: messages.REGISTER.INVALID_HOUR };

  assert.strictEqual(response2.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response2.status, HTTP_BAD_REQUEST);
  assert.deepEqual(response2.body, EXPECTED_RESPONSE_2);

  const register2 = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  const EXPECTED_TOTAL_REGISTERS = 1;
  assert.strictEqual(register2.registers.length, EXPECTED_TOTAL_REGISTERS);
});

test('Should return a Bad Request error if received date is on Weekend', async () => {
  const response = await createRegister('2023-12-02'); // Saturday
  const EXPECTED_RESPONSE = {
    mensagem: messages.REGISTER.SATURDAY_SUNDAY_NOT_WORK,
  };

  assert.strictEqual(response.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response.status, HTTP_BAD_REQUEST);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  app.close();
});

test('Should return a Conflict error if hour is same than the previous added', async () => {
  const response1 = await createRegister('2023-11-29T08:00:00');
  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['08:00:00'] };

  assert.strictEqual(response1.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response1.status, HTTP_CREATED);
  assert.deepEqual(response1.body, EXPECTED_RESPONSE);

  const EXPECTED_DB_RETURN = {
    day: '2023-11-29',
    monthString: '2023-11',
    registers: ['08:00:00'],
  };

  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, EXPECTED_DB_RETURN);

  const response2 = await createRegister('2023-11-29T08:00:00');
  const EXPECTED_RESPONSE_2 = {
    message: messages.REGISTER.HOUR_ALREADY_EXISTS,
  };

  assert.strictEqual(response2.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response2.status, HTTP_CONFLICT);
  assert.deepEqual(response2.body, EXPECTED_RESPONSE_2);

  const register2 = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  const EXPECTED_TOTAL_REGISTERS = 1;
  assert.strictEqual(register2.registers.length, EXPECTED_TOTAL_REGISTERS);
});

test('Should save two registers', async () => {
  const response1 = await createRegister('2023-11-29T08:00:00');
  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['08:00:00'] };

  assert.strictEqual(response1.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response1.status, HTTP_CREATED);
  assert.deepEqual(response1.body, EXPECTED_RESPONSE);

  const EXPECTED_DB_RETURN = {
    day: '2023-11-29',
    monthString: '2023-11',
    registers: ['08:00:00'],
  };

  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, EXPECTED_DB_RETURN);

  const response2 = await createRegister('2023-11-29T12:00:00');
  EXPECTED_RESPONSE.pontos.push('12:00:00');
  assert.strictEqual(response2.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response2.status, HTTP_CREATED);
  assert.deepEqual(response2.body, EXPECTED_RESPONSE);

  const register2 = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register2._id;

  const EXPECTED_TOTAL_REGISTERS = 2;
  const EXPECTED_DB_RETURN_2 = {
    day: '2023-11-29',
    monthString: '2023-11',
    registers: ['08:00:00', '12:00:00'],
  };

  assert.strictEqual(register2.registers.length, EXPECTED_TOTAL_REGISTERS);
  assert.deepEqual(register2, EXPECTED_DB_RETURN_2);
});

test('Should save 4 registers', async () => {
  const response1 = await createRegister('2023-11-29T08:00:00');
  const response2 = await createRegister('2023-11-29T12:00:00');
  const response3 = await createRegister('2023-11-29T13:00:00');
  const response4 = await createRegister('2023-11-29T17:00:00');

  assert.strictEqual(response1.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response2.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response3.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response4.type, HEADER_CONTENT_JSON);

  assert.strictEqual(response1.status, HTTP_CREATED);
  assert.strictEqual(response2.status, HTTP_CREATED);
  assert.strictEqual(response3.status, HTTP_CREATED);
  assert.strictEqual(response4.status, HTTP_CREATED);

  const EXPECTED_RESPONSE = { dia: '2023-11-29', pontos: ['08:00:00'] };
  assert.deepEqual(response1.body, EXPECTED_RESPONSE);

  EXPECTED_RESPONSE.pontos.push('12:00:00');
  assert.deepEqual(response2.body, EXPECTED_RESPONSE);

  EXPECTED_RESPONSE.pontos.push('13:00:00');
  assert.deepEqual(response3.body, EXPECTED_RESPONSE);

  EXPECTED_RESPONSE.pontos.push('17:00:00');
  assert.deepEqual(response4.body, EXPECTED_RESPONSE);

  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  const EXPECTED_TOTAL_REGISTERS = 4;
  const EXPECTED_DB_RETURN = {
    day: '2023-11-29',
    monthString: '2023-11',
    registers: ['08:00:00', '12:00:00', '13:00:00', '17:00:00'],
  };

  assert.strictEqual(register.registers.length, EXPECTED_TOTAL_REGISTERS);
  assert.deepEqual(register, EXPECTED_DB_RETURN);
});

test('Should return a Bad Request error if four registers already exists for same day', async () => {
  const DB_DATA = {
    day: '2023-11-29',
    registers: ['08:00:00', '12:00:00', '13:00:00', '17:00:00'],
  };

  await db.collection('registers').insertOne({ ...DB_DATA });

  const response = await createRegister('2023-11-29T18:00:00');
  const EXPECTED_RESPONSE = { message: messages.REGISTER.MAX_HOURS };

  assert.strictEqual(response.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response.status, HTTP_BAD_REQUEST);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, DB_DATA);
});

test('Should not allow lunch time smallest than 1 hour', async () => {
  const DB_DATA = {
    day: '2023-11-29',
    registers: ['08:00:00', '12:00:00'],
  };

  await db.collection('registers').insertOne({ ...DB_DATA });

  const response = await createRegister('2023-11-29T12:59:59');
  const EXPECTED_RESPONSE = { message: messages.REGISTER.LUNCH_TOO_SMALL };

  assert.strictEqual(response.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response.status, HTTP_BAD_REQUEST);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  const register = await db
    .collection('registers')
    .findOne({ day: '2023-11-29' });

  delete register._id;

  assert.deepEqual(register, DB_DATA);
});

test('Should return valid /folhas-de-ponto/:mes report', async () => {
  const DB_DATA = fixtures.registersForMonth('2023-11');
  await db.collection('registers').insertMany([...DB_DATA]);

  const response = await request(app).get('/folhas-de-ponto/2023-11');

  const EXPECTED_RESPONSE = {
    mes: '2023-11',
    horasDevidas: utils.secondsToISO8601Duration(0),
    horasExcedentes: utils.secondsToISO8601Duration(0),
    horasTrabalhadas: utils.secondsToISO8601Duration(DB_DATA.length * 8 * 3600),
    expedientes: DB_DATA.map((data) => ({
      dia: data.day,
      pontos: data.registers,
    })),
  };

  assert.strictEqual(response.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response.status, HTTP_OK);
  assert.strictEqual(response.body.mes, EXPECTED_RESPONSE.mes);
  assert.strictEqual(
    response.body.horasDevidas,
    EXPECTED_RESPONSE.horasDevidas,
  );
  assert.deepEqual(response.body.expedientes, EXPECTED_RESPONSE.expedientes);
  assert.strictEqual(
    response.body.horasTrabalhadas,
    EXPECTED_RESPONSE.horasTrabalhadas,
  );
  assert.strictEqual(
    response.body.horasExcedentes,
    EXPECTED_RESPONSE.horasExcedentes,
  );

  app.close();
});

test('Should return valid /folhas-de-ponto/:mes report when exists exceeded hours', async () => {
  const DB_DATA = fixtures.registersForMonth('2023-12');

  // Add 1h25 of exceeded time for this month
  DB_DATA[2].registers[0] = '07:45:00';
  DB_DATA[2].registers[3] = '17:15:00';
  DB_DATA[7].registers[3] = '17:15:00';
  DB_DATA[9].registers[3] = '17:15:00';
  DB_DATA[14].registers[3] = '17:25:00';

  await db.collection('registers').insertMany([...DB_DATA]);

  const response = await request(app).get('/folhas-de-ponto/2023-12');
  const EXPECTED_EXCEDEED_SECONDS = 3600 + 25 * 60;
  const EXPECTED_WORKED_SECONDS =
    DB_DATA.length * 8 * 3600 + EXPECTED_EXCEDEED_SECONDS;

  const EXPECTED_RESPONSE = {
    mes: '2023-12',
    horasDevidas: utils.secondsToISO8601Duration(0),
    horasExcedentes: utils.secondsToISO8601Duration(EXPECTED_EXCEDEED_SECONDS),
    horasTrabalhadas: utils.secondsToISO8601Duration(EXPECTED_WORKED_SECONDS),
    expedientes: DB_DATA.map((data) => ({
      dia: data.day,
      pontos: data.registers,
    })),
  };

  assert.strictEqual(response.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response.status, HTTP_OK);
  assert.strictEqual(response.body.mes, EXPECTED_RESPONSE.mes);
  assert.strictEqual(
    response.body.horasDevidas,
    EXPECTED_RESPONSE.horasDevidas,
  );
  assert.deepEqual(response.body.expedientes, EXPECTED_RESPONSE.expedientes);
  assert.strictEqual(
    response.body.horasTrabalhadas,
    EXPECTED_RESPONSE.horasTrabalhadas,
  );
  assert.strictEqual(
    response.body.horasExcedentes,
    EXPECTED_RESPONSE.horasExcedentes,
  );

  app.close();
});

test('Should return valid /folhas-de-ponto/:mes report when exists owed hours', async () => {
  const DB_DATA = fixtures.registersForMonth('2023-12');

  // Add 2h45 of owed time for this month
  DB_DATA[2].registers[0] = '08:30:00';
  DB_DATA[2].registers[2] = '13:30:00';
  DB_DATA[7].registers[3] = '16:30:00';
  DB_DATA[9].registers[0] = '09:00:00';
  DB_DATA[14].registers[3] = '16:45:00';

  await db.collection('registers').insertMany([...DB_DATA]);

  const response = await request(app).get('/folhas-de-ponto/2023-12');

  const EXPECTED_OWED_SECONDS = 7200 + 45 * 60;
  const EXPECTED_WORKED_SECONDS =
    DB_DATA.length * 8 * 3600 - EXPECTED_OWED_SECONDS;

  const EXPECTED_RESPONSE = {
    mes: '2023-12',
    horasExcedentes: utils.secondsToISO8601Duration(0),
    horasDevidas: utils.secondsToISO8601Duration(EXPECTED_OWED_SECONDS),
    horasTrabalhadas: utils.secondsToISO8601Duration(EXPECTED_WORKED_SECONDS),
    expedientes: DB_DATA.map((data) => ({
      dia: data.day,
      pontos: data.registers,
    })),
  };

  assert.strictEqual(response.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response.status, HTTP_OK);
  assert.strictEqual(response.body.mes, EXPECTED_RESPONSE.mes);
  assert.strictEqual(
    response.body.horasDevidas,
    EXPECTED_RESPONSE.horasDevidas,
  );
  assert.deepEqual(response.body.expedientes, EXPECTED_RESPONSE.expedientes);
  assert.strictEqual(
    response.body.horasTrabalhadas,
    EXPECTED_RESPONSE.horasTrabalhadas,
  );
  assert.strictEqual(
    response.body.horasExcedentes,
    EXPECTED_RESPONSE.horasExcedentes,
  );

  app.close();
});

test('Should return a Bad Request error if URL parameter is not valid in "/folhas-de-ponto" endpoint', async () => {
  const response = await request(app).get('/folhas-de-ponto/22312');
  const EXPECTED_RESPONSE = { message: messages.REPORT.INVALID_PARAMETER };

  assert.strictEqual(response.type, HEADER_CONTENT_JSON);
  assert.strictEqual(response.status, HTTP_BAD_REQUEST);
  assert.deepEqual(response.body, EXPECTED_RESPONSE);

  app.close();
});

test.afterEach(async () => {
  await db.collection('registers').drop();
  await client.close();
});
