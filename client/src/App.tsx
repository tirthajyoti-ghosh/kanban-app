import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "react-beautiful-dnd";
import AddTaskForm from "./AddTask";
import EditTaskForm from './EditTask'; // Import the EditTaskForm component
import "./index.css";

type Task = {
    _id: string;
    name: string;
}

type Phase = {
    _id: string;
    name: string;
    tasks: Task[];
}

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
        const response = await axios.get<Phase[]>("http://localhost:5000/phases");
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

const KanbanBoard: React.FC = () => {
    const [phases, setPhases] = useState<Phase[]>([]);

    const syncData = async () => {
        const data = await fetchPhases();
        setPhases(data || []);
    }

    useEffect(() => {
        syncData();            
    }, []);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
    
        try {
            // Update backend if task is moved to another phase or its position changes within the same phase
            if (source.droppableId !== destination.droppableId || source.index !== destination.index) {
                await axios.put(`http://localhost:5000/tasks/${draggableId}/move`, {
                    sourcePhaseId: source.droppableId,
                    targetPhaseId: destination.droppableId,
                    newPosition: destination.index,
                });
            }
    
            // Update frontend state based on the drag and drop result
            const updatedPhases = [...phases];
            const sourcePhaseIndex = phases.findIndex(phase => phase._id === source.droppableId);
            const destinationPhaseIndex = phases.findIndex(phase => phase._id === destination.droppableId);
    
            if (source.droppableId === destination.droppableId) {
                // Task is rearranged within the same phase
                const movedTaskIndex = updatedPhases[sourcePhaseIndex].tasks.findIndex(task => task._id === draggableId);
                const movedTask = updatedPhases[sourcePhaseIndex].tasks[movedTaskIndex];
                updatedPhases[sourcePhaseIndex].tasks.splice(movedTaskIndex, 1); // Remove task from old position
                updatedPhases[sourcePhaseIndex].tasks.splice(destination.index, 0, movedTask); // Insert task at new position
            } else {
                // Task is moved to another phase
                const taskToMove = updatedPhases[sourcePhaseIndex].tasks.find(task => task._id === draggableId);
                if (taskToMove) { // Check if taskToMove is defined
                    updatedPhases[sourcePhaseIndex].tasks = updatedPhases[sourcePhaseIndex].tasks.filter(task => task._id !== draggableId); // Remove task from source phase
                    updatedPhases[destinationPhaseIndex].tasks.splice(destination.index, 0, taskToMove); // Add task to destination phase
                }
            }

            setPhases(updatedPhases);
        } catch (error) {
            console.error("Error moving task:", error);
        }
    };
    

    return (
        <div className="kanban-board">
            <h1>Kanban Board</h1>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="phases-container">
                    {phases.map((phase) => (
                        // <PhaseColumn key={phase._id} phase={phase} />
                        <div className="phase-column" key={phase._id}>
                            <h2>{phase.name}</h2>
                            <Droppable droppableId={phase._id}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="task-list"
                                    >
                                        {phase.tasks.map((task, index) => (
                                            <TaskItem
                                                key={task._id}
                                                task={task}
                                                index={index}
                                            />
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                            <AddTaskForm phaseId={phase._id} onTaskAdded={syncData} />
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

interface TaskItemProps {
    task: Task;
    index: number;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, index }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="task-item"
                >
                    <div>
                        {isEditing ? (
                            // Render the edit form when isEditing is true
                            <EditTaskForm initialName={task.name} taskId={task._id} onCancel={handleCancelEdit} onSave={() => { /* Add onSave logic */ }} />
                        ) : (
                            // Render the task details when isEditing is false
                            <>
                                <p>{task.name}</p>
                                {/* Button to open the edit form */}
                                <button onClick={handleEditClick}>Edit</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default KanbanBoard;
