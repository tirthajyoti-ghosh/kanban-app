import fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';

interface Database {
    getPhases(): Promise<any[]>;
    createPhase(name: string): Promise<any>;
    updatePhase(id: string, name: string): Promise<any>;
    deletePhase(id: string, altPhaseId: string): Promise<any>;
    getTasks(phaseId: string): Promise<any[]>;
    createTask(phaseId: string, name: string): Promise<any>;
    updateTask(id: string, name: string): Promise<any>;
    deleteTask(id: string): Promise<any>;
    moveTask(taskId: string, sourcePhaseId: string, targetPhaseId: string, newPosition: number): Promise<any>;
}

class MongoDatabase implements Database {
    private client: MongoClient;
    private dbName: string;

    constructor(uri: string, dbName: string) {
        this.client = new MongoClient(uri);
        this.dbName = dbName;
    }

    async connect() {
        await this.client.connect();
    }

    async disconnect() {
        await this.client.close();
    }

    async getPhases() {
        const col = this.client.db(this.dbName).collection('phases');
        return await col.find().toArray();
    }

    async createPhase(name: string) {
        const col = this.client.db(this.dbName).collection('phases');
        const result = await col.insertOne({ name, taskIds: [], createdAt: new Date(), updatedAt: new Date() });
        return result.insertedId;
    }

    async updatePhase(id: string, name: string) {
        const col = this.client.db(this.dbName).collection('phases');
        await col.updateOne({ _id: new ObjectId(id) }, { $set: { name, updatedAt: new Date() } });
        return await col.findOne({ _id: new ObjectId(id) });
    }

    async deletePhase(id: string, altPhaseId: string) {
        const col = this.client.db(this.dbName).collection('phases');
        const tasksCol = this.client.db(this.dbName).collection('tasks');
        const phase = await col.findOne({ _id: new ObjectId(id) });
        const altPhase = await col.findOne({ _id: new ObjectId(altPhaseId) });
        if (!phase || !altPhase) {
            return;
        }

        await tasksCol.updateMany({ phaseId: id }, { $set: { phaseId: altPhaseId } });
        await col.updateOne({ _id: new ObjectId(altPhaseId) }, { $push: { taskIds: { $each: phase.taskIds } } });

        // Delete the phase
        await col.deleteOne({ _id: new ObjectId(id) });
    }

    async getTasks(phaseId: string) {
        const taskCol = this.client.db(this.dbName).collection('tasks');
        const phaseCol = this.client.db(this.dbName).collection('phases');

        const tasks = await taskCol.find({ phaseId }).toArray();
        const phase = await phaseCol.findOne({ _id: new ObjectId(phaseId) });

        if (phase) {
            tasks.sort((a, b) => phase.taskIds.indexOf(a._id.toString()) - phase.taskIds.indexOf(b._id.toString()));
        }

        return tasks;
    }

    async createTask(phaseId: string, name: string) {
        const taskCol = this.client.db(this.dbName).collection('tasks');
        const phaseCol = this.client.db(this.dbName).collection('phases');

        const result = await taskCol.insertOne({ phaseId, name, createdAt: new Date(), updatedAt: new Date() });
        const newTask = result.insertedId;

        await phaseCol.updateOne({ _id: new ObjectId(phaseId) }, { $push: { taskIds: newTask.toString() } });

        return newTask;
    }

    async updateTask(id: string, name: string) {
        const col = this.client.db(this.dbName).collection('tasks');
        await col.updateOne({ _id: new ObjectId(id) }, { $set: { name, updatedAt: new Date() } });
        return await col.findOne({ _id: new ObjectId(id) });
    }

    async deleteTask(id: string) {
        const taskCol = this.client.db(this.dbName).collection('tasks');
        const phaseCol = this.client.db(this.dbName).collection('phases');

        const task = await taskCol.findOne({ _id: new ObjectId(id) });
        if (task) {
            await taskCol.deleteOne({ _id: new ObjectId(id) });
            await phaseCol.updateOne({ _id: new ObjectId(task.phaseId) }, { $pull: { taskIds: id } });
        }
    }

    async moveTask(taskId: string, sourcePhaseId: string, targetPhaseId: string, newPosition: number) {
        const phaseCol = this.client.db(this.dbName).collection('phases');

        // If the task is moved within the same phase
        if (sourcePhaseId === targetPhaseId) {
            const phase = await phaseCol.findOne({ _id: new ObjectId(sourcePhaseId) });
            if (phase) {
                const index = phase.taskIds.indexOf(taskId);
                if (index > -1) {
                    phase.taskIds.splice(index, 1); // Remove taskId from its old position
                    phase.taskIds.splice(newPosition, 0, taskId); // Insert taskId at its new position
                    await phaseCol.updateOne({ _id: new ObjectId(sourcePhaseId) }, { $set: { taskIds: phase.taskIds } });
                }
            }
        }
        // If the task is moved to a different phase
        else {
            // Remove taskId from source phase
            await phaseCol.updateOne({ _id: new ObjectId(sourcePhaseId) }, { $pull: { taskIds: taskId } });

            // Add taskId to target phase at the new position
            const targetPhase = await phaseCol.findOne({ _id: new ObjectId(targetPhaseId) });
            if (targetPhase) {
                targetPhase.taskIds.splice(newPosition, 0, taskId);
                await phaseCol.updateOne({ _id: new ObjectId(targetPhaseId) }, { $set: { taskIds: targetPhase.taskIds } });
            }
        }

        // Update phaseId of the task
        const taskCol = this.client.db(this.dbName).collection('tasks');
        await taskCol.updateOne({ _id: new ObjectId(taskId) }, { $set: { phaseId: targetPhaseId } });
    }
}

class FileDatabase implements Database {
    private phasesDbPath: string;
    private tasksDbPath: string;

    constructor(phasesDbPath: string, tasksDbPath: string) {
        this.phasesDbPath = path.join(__dirname, phasesDbPath);
        this.tasksDbPath = path.join(__dirname, tasksDbPath);
    }

    private readPhasesDB() {
        const data = fs.readFileSync(this.phasesDbPath, 'utf8');
        return JSON.parse(data);
    }

    private writePhasesDB(data: any) {
        const jsonData = JSON.stringify(data);
        fs.writeFileSync(this.phasesDbPath, jsonData);
    }

    private readTasksDB() {
        const data = fs.readFileSync(this.tasksDbPath, 'utf8');
        return JSON.parse(data);
    }

    private writeTasksDB(data: any) {
        const jsonData = JSON.stringify(data);
        fs.writeFileSync(this.tasksDbPath, jsonData);
    }

    async getPhases() {
        const data = this.readPhasesDB();
        return data || [];
    }

    async createPhase(name: string) {
        const data = this.readPhasesDB();
        const newPhase = { _id: new ObjectId().toString(), name, taskIds: [], createdAt: new Date(), updatedAt: new Date() };
        data.push(newPhase);
        this.writePhasesDB(data);
        return newPhase._id;
    }

    async updatePhase(id: string, name: string) {
        const data = this.readPhasesDB();
        const phase = data.find((b: any) => b._id === id);
        if (phase) {
            phase.name = name;
            phase.updatedAt = new Date();
            this.writePhasesDB(data);
        }
        return phase;
    }

    async deletePhase(id: string, altPhaseId: string) {
        const data = this.readPhasesDB();
        const tasks = this.readTasksDB();

        const phaseIndex = data.findIndex((b: any) => b._id === id);
        if (phaseIndex > -1) {
            const phase = data[phaseIndex];
            console.log(phase);
            
            const altPhase = data.find((b: any) => b._id === altPhaseId);
            console.log(altPhase);
            
            if (altPhase) {
                altPhase.taskIds.push(...phase.taskIds);
            }

            tasks.forEach((task: any) => {
                if (task.phaseId === id) {
                    task.phaseId = altPhaseId;
                }
            });
        }  

        this.writePhasesDB(data.filter((b: any) => b._id !== id));
        this.writeTasksDB(tasks);
    }

    async getTasks(phaseId: string) {
        const data = this.readTasksDB();
        const phases = this.readPhasesDB();
        const tasks = data.filter((t: any) => t.phaseId === phaseId);
        const phase = phases.find((b: any) => b._id === phaseId);

        if (phase) {
            tasks.sort((a: any, b: any) => phase.taskIds.indexOf(a._id) - phase.taskIds.indexOf(b._id));
        }

        return tasks;
    }

    async createTask(phaseId: string, name: string) {
        const data = this.readTasksDB();
        const phases = this.readPhasesDB();
        const newTask = { _id: new ObjectId().toString(), phaseId, name, createdAt: new Date(), updatedAt: new Date() };

        data.push(newTask);
        const phase = phases.find((b: any) => b._id === phaseId);
        
        if (phase) {
            phase.taskIds.push(newTask._id);
        }

        this.writeTasksDB(data);
        this.writePhasesDB(phases);
        return newTask._id;
    }

    async updateTask(id: string, name: string) {
        const data = this.readTasksDB();
        const task = data.find((t: any) => t._id === id);
        if (task) {
            task.name = name;
            task.updatedAt = new Date();
            this.writeTasksDB(data);
        }
        return task;
    }

    async deleteTask(id: string) {
        const data = this.readTasksDB();
        const phases = this.readPhasesDB();

        const taskIndex = data.findIndex((t: any) => t._id === id);
        if (taskIndex > -1) {
            const [task] = data.splice(taskIndex, 1);
            const phase = phases.find((b: any) => b._id === task.phaseId);
            if (phase) {
                phase.taskIds = phase.taskIds.filter((taskId: string) => taskId !== id);
            }
        }

        this.writeTasksDB(data);
        this.writePhasesDB(phases);
    }

    async moveTask(taskId: string, sourcePhaseId: string, targetPhaseId: string, newPosition: number) {
        const data = this.readTasksDB();
        const phases = this.readPhasesDB();

        // If the task is moved within the same phase
        if (sourcePhaseId === targetPhaseId) {
            const phase = phases.find((b: any) => b._id === sourcePhaseId);
            if (phase) {
                const index = phase.taskIds.indexOf(taskId);
                if (index > -1) {
                    phase.taskIds.splice(index, 1); // Remove taskId from its old position
                    phase.taskIds.splice(newPosition, 0, taskId); // Insert taskId at its new position
                }
            }
        }
        // If the task is moved to a different phase
        else {
            // Remove taskId from source phase
            const sourcePhase = phases.find((b: any) => b._id === sourcePhaseId);
            if (sourcePhase) {
                sourcePhase.taskIds = sourcePhase.taskIds.filter((id: string) => id !== taskId);
            }

            // Add taskId to target phase at the new position
            const targetPhase = phases.find((b: any) => b._id === targetPhaseId);
            if (targetPhase) {
                targetPhase.taskIds.splice(newPosition, 0, taskId);
            }
        }
        // Update phaseId of the task
        const task = data.find((t: any) => t._id === taskId);
        if (task) {
            task.phaseId = targetPhaseId;
        }

        this.writeTasksDB(data);
        this.writePhasesDB(phases);
    }
}

export { Database, MongoDatabase, FileDatabase };