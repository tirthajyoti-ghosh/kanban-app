import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

// MongoDB setup
const url = 'mongodb://mongo:27017';
const dbName = 'kanban';
const client = new MongoClient(url);

// Filesystem DB setup
const dbPath = '../data/phases.json';

// Phases
const phases = ['todo', 'in progress', 'done'];

async function initDB() {
    try {
        await client.connect();
        console.log("Connected correctly to server");
        const db = client.db(dbName);
        const collection = db.collection('phases');

        for (let phase of phases) {
            const phaseExist = await collection.findOne({ name: phase });
            if (!phaseExist) {
                await collection.insertOne({ name: phase, taskIds: [], createdAt: new Date(), updatedAt: new Date() });
            }
        }

        const fileDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

        for (let phase of phases) {
            if (!fileDB.find((p: any) => p.name === phase)) {
                fileDB.push({ _id: new ObjectId().toString(), name, taskIds: [], createdAt: new Date(), updatedAt: new Date() });
            }
        }

        fs.writeFileSync(dbPath, JSON.stringify(fileDB));

    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
}

export default initDB;