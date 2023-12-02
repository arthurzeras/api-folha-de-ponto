import { MongoClient } from 'mongodb';

const connection = process.env.DB_CONNECTION;
const client = new MongoClient(connection);

try {
  await client.connect();
  console.log('DB connected');
} catch (error) {
  console.log('Failed to connect with database');
}

export { client };
export default client.db(process.env.DB_NAME);
