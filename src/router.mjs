import express from 'express';
import * as handlers from './handlers.mjs';

const router = express.Router();
router.get('/', (req, res) => res.send('Hello World!'));
router.post('/batidas', handlers.registerHandler);
router.get('/folhas-de-ponto/:mes', handlers.reportHandler);

export default router;
