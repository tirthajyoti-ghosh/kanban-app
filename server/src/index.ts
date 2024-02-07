import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
const port = 5000;

const url = 'mongodb://mongo:27017';
const dbName = 'kanban';

let db;

const client = new MongoClient(url);

app.get('/', async (req, res) => {
  db = (await client.connect()).db(dbName);
  const boards = await db.collection('boards').find({}).toArray();

  res.json(boards);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});