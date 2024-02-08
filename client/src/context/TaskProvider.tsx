import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Phase, Task } from '../types';

const fetchTasksForPhase = async (phaseId: string): Promise<Task[]> => {
    try {
        const response = await axios.get<Task[]>(
            `http://localhost:5000/phases/${phaseId}/tasks`
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching tasks for phase ${phaseId}:`, error);
        return [];
    }
};

const fetchPhases = async () => {
    try {
        const response = await axios.get<Phase[]>(
            "http://localhost:5000/phases"
        );
        const phasePromises = response.data.map((phase) =>
            fetchTasksForPhase(phase._id)
        );
        const phaseTasks = await Promise.all(phasePromises);
        const updatedPhases = response.data.map((phase, index) => ({
            ...phase,
            tasks: phaseTasks[index],
        }));
        return updatedPhases;
    } catch (error) {
        console.error("Error fetching phases:", error);
    }
};

export const TaskContext = createContext<{ phases: Phase[]; syncData: (newPhases: Phase[]) => void }>({
    phases: [],
    syncData: () => {},
});

export default function TaskProvider({ children }: { children: React.ReactNode }) {
    const [phases, setPhases] = useState<Phase[]>([]);

    const syncData = (newPhases: Phase[]) => {
        console.log('Syncing data');
        console.log(newPhases);

        setPhases(newPhases);
    }

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchPhases();
            if (data) {
                setPhases(data);
            }
        };
        fetchData();
    }, []);

    console.log(phases);

    return (
        <TaskContext.Provider value={{ phases, syncData }}>
            {children}
        </TaskContext.Provider>
    );
}
