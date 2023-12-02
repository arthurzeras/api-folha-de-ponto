import db from './db.mjs';
import messages from './messages.mjs';

async function createOrUpdateRegister(day, hour) {
  const collection = db.collection('registers');
  const register = await collection.findOne({ day });

  if (register) {
    return collection.updateOne(register, { $push: { registers: hour } });
  }

  return collection.insertOne({ day, registers: [hour] });
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
  } catch (error) {
    res.status(500).json({ message: messages.REGISTER.FAILED_TO_REGISTER });
  }

  res.json({ dia: day, pontos: [hour] });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function reportHandler(req, res) {
  res.json({ message: 'TO DO' });
}
