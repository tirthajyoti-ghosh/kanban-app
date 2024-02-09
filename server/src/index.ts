import express from 'express';
import cors from 'cors';
import { Database, MongoDatabase, FileDatabase } from './database';
import initDB from './init';

initDB();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const port = 5000;

let db: Database;

if (process.env.RUNNING_IN_DOCKER) {
  db = new MongoDatabase('mongodb://mongo:27017', 'kanban');
} else {
  db = new FileDatabase('../db/phases.json', '../db/tasks.json');
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
  if (!req.query.altPhaseId) {
    res.status(400).json({ error: 'altPhaseId query parameter is required' });
    return;
  }
  
  await db.deletePhase(req.params.id, req.query.altPhaseId as string);
  res.status(204).end();
});

app.get('/phases/:phaseId/tasks/', async (req, res) => {
  const tasks = await db.getTasks(req.params.phaseId);
  res.json(tasks);
});

app.post('/phases/:phaseId/tasks', async (req, res) => {
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
