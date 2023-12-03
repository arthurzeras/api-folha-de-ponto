import db from './db.mjs';
import messages from './messages.mjs';
import * as utils from './utils.mjs';

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
    const existsEquals = register.registers.find((_register) => {
      const receivedHoursInSeconds = utils.hourStringToSeconds(hour);
      const registeredTimeInSeconds = utils.hourStringToSeconds(_register);
      return registeredTimeInSeconds === receivedHoursInSeconds;
    });

    if (existsEquals) {
      throw new RegisterError(messages.REGISTER.HOUR_ALREADY_EXISTS, 409);
    }

    // Avoid save hours before than already existant
    const existsGreater = register.registers.find((_register) => {
      const receivedHoursInSeconds = utils.hourStringToSeconds(hour);
      const registeredTimeInSeconds = utils.hourStringToSeconds(_register);
      return registeredTimeInSeconds > receivedHoursInSeconds;
    });

    if (existsGreater) {
      throw new RegisterError(messages.REGISTER.INVALID_HOUR);
    }

    // Avoid lunch time small than 1 hour
    if (register.registers.length === 2) {
      const ONE_HOUR_IN_SECONDS = 3600;
      const lunchEntryInSeconds = utils.hourStringToSeconds(
        register.registers[1],
      );
      const lunchReturnInSeconds = utils.hourStringToSeconds(hour);

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
  const totalWorked = registers.reduce((total, register) => {
    const totalRegisters = register.registers.length;
    let times = [...register.registers];

    if (totalRegisters < 4) {
      const toFill = Array.from({ length: 4 - totalRegisters }).fill(
        '00:00:00',
      );

      times = [...times, ...toFill];
    }

    times = times.map((r) => utils.hourStringToSeconds(r));
    total += times[3] - times[2] + (times[1] - times[0]);
    return total;
  }, 0);

  const daysWorked = registers.length;
  const totalWorkableSeconds = daysWorked * 8 * 3600;
  const difference = totalWorked - totalWorkableSeconds;
  const secondsExceeded = difference > 0 ? difference : 0;
  const secondsOwed = difference < 0 ? difference * -1 : 0;

  return {
    secondsOwed,
    secondsExceeded,
    secondsWorked: totalWorked,
  };
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

  if (!utils.ISO_DATE_PATTERN.test(data.momento)) {
    return res
      .status(400)
      .json({ mensagem: messages.REGISTER.INVALID_PARAMETER_TYPE });
  }

  if ([0, 6].includes(new Date(data.momento).getDay())) {
    return res
      .status(400)
      .json({ mensagem: messages.REGISTER.SATURDAY_SUNDAY_NOT_WORK });
  }

  const [day, hour] = data.momento.split('T');

  try {
    await createOrUpdateRegister(day, hour);
    const register = await DB_COLLECTION.findOne({ day });

    res.status(201).json({ dia: register.day, pontos: register.registers });
  } catch (error) {
    if (error instanceof RegisterError) {
      return res.status(error.status || 400).json({ message: error.message });
    }

    console.debug(error.message);
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
  const owedHours = utils.secondsToISO8601Duration(times.secondsOwed);
  const workHours = utils.secondsToISO8601Duration(times.secondsWorked);
  const exceededHours = utils.secondsToISO8601Duration(times.secondsExceeded);

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
