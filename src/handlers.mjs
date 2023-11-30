import messages from './messages.mjs';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function registerHandler(req, res) {
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
  res.json({ dia: day, pontos: [hour] });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function reportHandler(req, res) {
  res.json({ message: 'TO DO' });
}
