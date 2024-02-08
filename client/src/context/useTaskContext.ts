import { useContext } from 'react';
import { TaskContext } from './TaskProvider';

export const useTaskContext = () => {
    return useContext(TaskContext);
};