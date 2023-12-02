import db from './db.mjs';
import messages from './messages.mjs';
import { hourStringToSeconds } from './utils.mjs';

class RegisterError extends Error {}

const DB_COLLECTION = db.collection('registers');

async function createOrUpdateRegister(day, hour) {
  const register = await DB_COLLECTION.findOne({ day });

  if (register) {
    const existsGreater = register.registers.find(
      (_register) =>
        hourStringToSeconds(_register) >= hourStringToSeconds(hour),
    );

    if (existsGreater) {
      throw new RegisterError(messages.REGISTER.INVALID_HOUR);
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
      return res.status(400).json({ message: error.message });
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
