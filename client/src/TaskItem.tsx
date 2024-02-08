import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import axios from "axios";
import EditTaskForm from "./EditTask";
import { Task } from "./types";
import { useTaskContext } from "./context/useTaskContext";

interface TaskItemProps {
    task: Task;
    index: number;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, index }) => {
    const { phases, syncData } = useTaskContext();
    const [taskName, setTaskName] = useState(task.name);
    const [isEditing, setIsEditing] = useState(false);

    const editTask = () => {
        setIsEditing(true);
    };

    const deleteTask = async () => {
        await axios.delete(`http://localhost:5000/tasks/${task._id}`);
        syncData(phases.map((phase) => {
            const updatedTasks = phase.tasks.filter((t) => t._id !== task._id);
            return { ...phase, tasks: updatedTasks };
        }));
    }

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
                            <EditTaskForm
                                initialName={task.name}
                                taskId={task._id}
                                onCancel={handleCancelEdit}
                                onSave={(newName: string) => {
                                    setTaskName(newName)
                                    syncData(phases.map((phase) => {
                                        const updatedTasks = phase.tasks.map((t) => {
                                            if (t._id === task._id) {
                                                return { ...t, name: newName };
                                            }
                                            return t;
                                        });
                                        return { ...phase, tasks: updatedTasks };
                                    }));
                                }}
                            />
                        ) : (
                            <>
                                <p>{taskName}</p>
                                {/* Button to open the edit form */}
                                <button onClick={editTask}>Edit</button>
                                <button onClick={deleteTask}>Delete</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TaskItem;
