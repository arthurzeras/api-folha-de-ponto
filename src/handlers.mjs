import db from './db.mjs';
import messages from './messages.mjs';
import { hourStringToSeconds } from './utils.mjs';

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

  return DB_COLLECTION.insertOne({ day, registers: [hour] });
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
export function reportHandler(req, res) {
  res.json({ message: 'TO DO' });
}
