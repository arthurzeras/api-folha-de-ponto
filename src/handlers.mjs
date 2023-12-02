import db from './db.mjs';
import messages from './messages.mjs';
import { hourStringToSeconds, secondsToISO8601Duration } from './utils.mjs';

class RegisterError extends Error {
  constructor(message, httpStatusCode) {
    super(message);
    this.status = httpStatusCode;
  }
}

const DB_COLLECTION = db.collection('registers');

async function createOrUpdateRegister(day, hour) {
  const register = await DB_COLLECTION.findOne({ day });

  if (register) {
    // Avoid save more than 4 registers
    if (register.registers.length === 4) {
      throw new RegisterError(messages.REGISTER.MAX_HOURS);
    }

    // Avoid save hours equals than already existant (same hour)
    const existsEquals = register.registers.find(
      (_register) =>
        hourStringToSeconds(_register) === hourStringToSeconds(hour),
    );

    if (existsEquals) {
      throw new RegisterError(messages.REGISTER.HOUR_ALREADY_EXISTS, 409);
    }

    // Avoid save hours before than already existant
    const existsGreater = register.registers.find(
      (_register) => hourStringToSeconds(_register) > hourStringToSeconds(hour),
    );

    if (existsGreater) {
      throw new RegisterError(messages.REGISTER.INVALID_HOUR);
    }

    // Avoid lunch time small than 1 hour
    if (register.registers.length === 2) {
      const ONE_HOUR_IN_SECONDS = 3600;
      const lunchEntryInSeconds = hourStringToSeconds(register.registers[1]);
      const lunchReturnInSeconds = hourStringToSeconds(hour);

      if (lunchReturnInSeconds - lunchEntryInSeconds < ONE_HOUR_IN_SECONDS) {
        throw new RegisterError(messages.REGISTER.LUNCH_TOO_SMALL);
      }
    }

    return DB_COLLECTION.updateOne(register, { $push: { registers: hour } });
  }

  return DB_COLLECTION.insertOne({
    day,
    registers: [hour],
    monthString: day.substr(0, 7),
  });
}

/**
 * Receive the registers from database and calculate hours worked,
 * hours exceeded and hours owed based on registers field.
 * If the register has less than 4 registers, it will be filled with 00:00:00.
 * @param {Record<string, any>} registers
 * @returns {Record<string, number>}
 */
function calculateRegistersTimes(registers) {
  return registers.reduce(
    (total, register) => {
      const totalRegisters = register.registers.length;
      let times = [...register.registers];

      if (totalRegisters < 4) {
        const toFill = Array.from({ length: 4 - totalRegisters }).fill(
          '00:00:00',
        );

        times = [...times, ...toFill];
      }

      times = times.map((r) => hourStringToSeconds(r));
      const worked = times[3] - times[2] + (times[1] - times[0]);

      total.secondsWorked += worked;
      const secondsExceeded = worked - 8 * 3600;
      total.secondsExceeded += secondsExceeded > 0 ? secondsExceeded : 0;
      total.secondsOwed += secondsExceeded < 0 ? secondsExceeded * -1 : 0;

      return total;
    },
    { secondsWorked: 0, secondsExceeded: 0, secondsOwed: 0 },
  );
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function registerHandler(req, res) {
  const data = req.body;

  if (!('momento' in data)) {
    return res
      .status(400)
      .json({ mensagem: messages.REGISTER.INVALID_PARAMETER });
  }

  if (isNaN(new Date(data.momento))) {
    return res
      .status(400)
      .json({ mensagem: messages.REGISTER.INVALID_PARAMETER_TYPE });
  }

  const [day, hour] = data.momento.split('T');

  try {
    await createOrUpdateRegister(day, hour);
    const register = await DB_COLLECTION.findOne({ day });

    res.json({ dia: register.day, pontos: register.registers });
  } catch (error) {
    if (error instanceof RegisterError) {
      return res.status(error.status || 400).json({ message: error.message });
    }

    res.status(500).json({ message: messages.REGISTER.FAILED_TO_REGISTER });
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function reportHandler(req, res) {
  const monthParam = req.params.mes;
  const isValidParam = /^20\d{2}-(?:0[1-9]|1[0-2])$/g.test(monthParam);

  if (!isValidParam) {
    return res.status(400).json({ message: messages.REPORT.INVALID_PARAMETER });
  }

  const registers = await DB_COLLECTION.find({
    monthString: monthParam,
  }).toArray();

  const times = calculateRegistersTimes(registers);
  const owedHours = secondsToISO8601Duration(times.secondsOwed);
  const workHours = secondsToISO8601Duration(times.secondsWorked);
  const exceededHours = secondsToISO8601Duration(times.secondsExceeded);

  res.json({
    mes: monthParam,
    horasDevidas: owedHours,
    horasTrabalhadas: workHours,
    horasExcedentes: exceededHours,
    expedientes: registers.map((register) => ({
      dia: register.day,
      pontos: register.registers,
    })),
  });
}
