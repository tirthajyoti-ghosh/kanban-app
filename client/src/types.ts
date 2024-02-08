export type Task = {
    _id: string;
    name: string;
}

export type Phase = {
    _id: string;
    name: string;
    tasks: Task[];
}