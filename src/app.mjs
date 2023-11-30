import express from 'express';
import router from './router.mjs';

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(router);

const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

export default server;
