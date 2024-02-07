import express from 'express';
import fs from 'fs';
import { Database, MongoDatabase, FileDatabase } from './database';

const app = express();
const port = 5000;

let db: Database;

if (process.env.RUNNING_IN_DOCKER) {
  db = new MongoDatabase('mongodb://mongo:27017', 'kanban');
} else {
  if (!fs.existsSync('./data/boards.json')) {
    fs.writeFileSync('./data/boards.json', '[]');
  }
  if (!fs.existsSync('./data/tasks.json')) {
    fs.writeFileSync('./data/tasks.json', '[]');
  }
  db = new FileDatabase('./data/boards.json', './data/tasks.json');
}

app.get('/boards', async (req, res) => {
  const boards = await db.getBoards();
  res.json(boards);
});

app.post('/boards', async (req, res) => {
  const board = await db.createBoard(req.body.name);
  res.json(board);
});

app.put('/boards/:id', async (req, res) => {
  const board = await db.updateBoard(req.params.id, req.body.name);
  res.json(board);
});

app.delete('/boards/:id', async (req, res) => {
  await db.deleteBoard(req.params.id);
  res.status(204).end();
});

app.get('/tasks/:boardId', async (req, res) => {
  const tasks = await db.getTasks(req.params.boardId);
  res.json(tasks);
});

app.post('/tasks/:boardId', async (req, res) => {
  const task = await db.createTask(req.params.boardId, req.body.name);
  res.json(task);
});

app.put('/tasks/:id', async (req, res) => {
  const task = await db.updateTask(req.params.id, req.body.name);
  res.json(task);
});

app.delete('/tasks/:id', async (req, res) => {
  await db.deleteTask(req.params.id);
  res.status(204).end();
});

app.put('/tasks/:id/move', async (req, res) => {
  const { sourceBoardId, targetBoardId, newPosition } = req.body;
  const task = await db.moveTask(req.params.id, sourceBoardId, targetBoardId, newPosition);
  res.json(task);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});