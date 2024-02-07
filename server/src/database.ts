import fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

interface Database {
    getBoards(): Promise<any[]>;
    createBoard(name: string): Promise<any>;
    updateBoard(id: string, name: string): Promise<any>;
    deleteBoard(id: string): Promise<any>;
    getTasks(boardId: string): Promise<any[]>;
    createTask(boardId: string, name: string): Promise<any>;
    updateTask(id: string, name: string): Promise<any>;
    deleteTask(id: string): Promise<any>;
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

    async getBoards() {
        const col = this.client.db(this.dbName).collection('boards');
        return await col.find().toArray();
    }

    async createBoard(name: string) {
        const col = this.client.db(this.dbName).collection('boards');
        const result = await col.insertOne({ name, taskIds: [], createdAt: new Date(), updatedAt: new Date() });
        return result.insertedId;
    }

    async updateBoard(id: string, name: string) {
        const col = this.client.db(this.dbName).collection('boards');
        await col.updateOne({ _id: new ObjectId(id) }, { $set: { name, updatedAt: new Date() } });
        return await col.findOne({ _id: new ObjectId(id) });
    }

    async deleteBoard(id: string) {
        const col = this.client.db(this.dbName).collection('boards');
        await col.deleteOne({ _id: new ObjectId(id) });
    }

    async getTasks(boardId: string) {
        const taskCol = this.client.db(this.dbName).collection('tasks');
        const boardCol = this.client.db(this.dbName).collection('boards');

        const tasks = await taskCol.find({ boardId }).toArray();
        const board = await boardCol.findOne({ _id: new ObjectId(boardId) });

        if (board) {
            tasks.sort((a, b) => board.taskIds.indexOf(a._id.toString()) - board.taskIds.indexOf(b._id.toString()));
        }

        return tasks;
    }

    async createTask(boardId: string, name: string) {
        const taskCol = this.client.db(this.dbName).collection('tasks');
        const boardCol = this.client.db(this.dbName).collection('boards');

        const result = await taskCol.insertOne({ boardId, name, createdAt: new Date(), updatedAt: new Date() });
        const newTask = result.insertedId;

        await boardCol.updateOne({ _id: new ObjectId(boardId) }, { $push: { taskIds: newTask.toString() } });

        return newTask;
    }

    async updateTask(id: string, name: string) {
        const col = this.client.db(this.dbName).collection('tasks');
        await col.updateOne({ _id: new ObjectId(id) }, { $set: { name, updatedAt: new Date() } });
        return await col.findOne({ _id: new ObjectId(id) });
    }

    async deleteTask(id: string) {
        const taskCol = this.client.db(this.dbName).collection('tasks');
        const boardCol = this.client.db(this.dbName).collection('boards');

        const task = await taskCol.findOne({ _id: new ObjectId(id) });
        if (task) {
            await taskCol.deleteOne({ _id: new ObjectId(id) });
            await boardCol.updateOne({ _id: new ObjectId(task.boardId) }, { $pull: { taskIds: id } });
        }
    }

    async moveTask(taskId: string, sourceBoardId: string, targetBoardId: string, newPosition: number) {
        const boardCol = this.client.db(this.dbName).collection('boards');

        // If the task is moved within the same board
        if (sourceBoardId === targetBoardId) {
            const board = await boardCol.findOne({ _id: new ObjectId(sourceBoardId) });
            if (board) {
                const index = board.taskIds.indexOf(taskId);
                if (index > -1) {
                    board.taskIds.splice(index, 1); // Remove taskId from its old position
                    board.taskIds.splice(newPosition, 0, taskId); // Insert taskId at its new position
                    await boardCol.updateOne({ _id: new ObjectId(sourceBoardId) }, { $set: { taskIds: board.taskIds } });
                }
            }
        } 
        // If the task is moved to a different board
        else {
            // Remove taskId from source board
            await boardCol.updateOne({ _id: new ObjectId(sourceBoardId) }, { $pull: { taskIds: taskId } });

            // Add taskId to target board at the new position
            const targetBoard = await boardCol.findOne({ _id: new ObjectId(targetBoardId) });
            if (targetBoard) {
                targetBoard.taskIds.splice(newPosition, 0, taskId);
                await boardCol.updateOne({ _id: new ObjectId(targetBoardId) }, { $set: { taskIds: targetBoard.taskIds } });
            }
        }

        // Update boardId of the task
        const taskCol = this.client.db(this.dbName).collection('tasks');
        await taskCol.updateOne({ _id: new ObjectId(taskId) }, { $set: { boardId: targetBoardId } });
    }
}

class FileDatabase implements Database {
    private dbPath: string;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
    }

    private readDB() {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        return JSON.parse(data);
    }

    private writeDB(data: any) {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(this.dbPath, jsonData);
    }

    async getBoards() {
        const data = this.readDB();
        return data.boards || [];
    }

    async createBoard(name: string) {
        const data = this.readDB();
        const newBoard = { id: Date.now().toString(), name, taskIds: [], createdAt: new Date(), updatedAt: new Date() };
        data.boards.push(newBoard);
        this.writeDB(data);
        return newBoard;
    }

    async updateBoard(id: string, name: string) {
        const data = this.readDB();
        const board = data.boards.find((b: any) => b.id === id);
        if (board) {
            board.name = name;
            board.updatedAt = new Date();
            this.writeDB(data);
        }
        return board;
    }

    async deleteBoard(id: string) {
        const data = this.readDB();
        data.boards = data.boards.filter((b: any) => b.id !== id);
        this.writeDB(data);
    }

    async getTasks(boardId: string) {
        const data = this.readDB();
        const tasks = data.tasks.filter((t: any) => t.boardId === boardId);
        const board = data.boards.find((b: any) => b.id === boardId);

        if (board) {
            tasks.sort((a: { id: any; }, b: { id: any; }) => board.taskIds.indexOf(a.id) - board.taskIds.indexOf(b.id));
        }

        return tasks;
    }

    async createTask(boardId: string, name: string) {
        const data = this.readDB();
        const newTask = { id: Date.now().toString(), boardId, name, createdAt: new Date(), updatedAt: new Date() };

        data.tasks.push(newTask);
        const board = data.boards.find((b: any) => b.id === boardId);
        if (board) {
            board.taskIds.push(newTask.id);
        }

        this.writeDB(data);
        return newTask;
    }

    async updateTask(id: string, name: string) {
        const data = this.readDB();
        const task = data.tasks.find((t: any) => t.id === id);
        if (task) {
            task.name = name;
            task.updatedAt = new Date();
            this.writeDB(data);
        }
        return task;
    }

    async deleteTask(id: string) {
        const data = this.readDB();

        const taskIndex = data.tasks.findIndex((t: any) => t.id === id);
        if (taskIndex > -1) {
            const [task] = data.tasks.splice(taskIndex, 1);
            const board = data.boards.find((b: any) => b.id === task.boardId);
            if (board) {
                board.taskIds = board.taskIds.filter((taskId: string) => taskId !== id);
            }
        }

        this.writeDB(data);
    }

    async moveTask(taskId: string, sourceBoardId: string, targetBoardId: string, newPosition: number) {
        const data = this.readDB();

        // If the task is moved within the same board
        if (sourceBoardId === targetBoardId) {
            const board = data.boards.find((b: any) => b.id === sourceBoardId);
            if (board) {
                const index = board.taskIds.indexOf(taskId);
                if (index > -1) {
                    board.taskIds.splice(index, 1); // Remove taskId from its old position
                    board.taskIds.splice(newPosition, 0, taskId); // Insert taskId at its new position
                }
            }
        }
        // If the task is moved to a different board
        else {
            // Remove taskId from source board
            const sourceBoard = data.boards.find((b: any) => b.id === sourceBoardId);
            if (sourceBoard) {
                sourceBoard.taskIds = sourceBoard.taskIds.filter((id: string) => id !== taskId);
            }

            // Add taskId to target board at the new position
            const targetBoard = data.boards.find((b: any) => b.id === targetBoardId);
            if (targetBoard) {
                targetBoard.taskIds.splice(newPosition, 0, taskId);
            }
        }
    }
}

export { Database, MongoDatabase, FileDatabase };