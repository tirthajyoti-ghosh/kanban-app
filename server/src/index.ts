import express from 'express';
import fs from 'fs';
import { Database, MongoDatabase, FileDatabase } from './database';

const app = express();
const port = 5000;

let db: Database;

if (process.env.RUNNING_IN_DOCKER) {
  db = new MongoDatabase('mongodb://mongo:27017', 'kanban');
} else {
  if (!fs.existsSync('./data/phases.json')) {
    fs.writeFileSync('./data/phases.json', '[]');
  }
  if (!fs.existsSync('./data/tasks.json')) {
    fs.writeFileSync('./data/tasks.json', '[]');
  }
  db = new FileDatabase('./data/phases.json', './data/tasks.json');
}

app.get('/phases', async (req, res) => {
  const phases = await db.getPhases();
  res.json(phases);
});

app.post('/phases', async (req, res) => {
  const phase = await db.createPhase(req.body.name);
  res.json(phase);
});

app.put('/phases/:id', async (req, res) => {
  const phase = await db.updatePhase(req.params.id, req.body.name);
  res.json(phase);
});

app.delete('/phases/:id', async (req, res) => {
  await db.deletePhase(req.params.id);
  res.status(204).end();
});

app.get('/tasks/:phaseId', async (req, res) => {
  const tasks = await db.getTasks(req.params.phaseId);
  res.json(tasks);
});

app.post('/tasks/:phaseId', async (req, res) => {
  const task = await db.createTask(req.params.phaseId, req.body.name);
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
  const { sourcePhaseId, targetPhaseId, newPosition } = req.body;
  const task = await db.moveTask(req.params.id, sourcePhaseId, targetPhaseId, newPosition);
  res.json(task);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});