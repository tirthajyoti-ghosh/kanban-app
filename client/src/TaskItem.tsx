import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
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
                            // Render the task details when isEditing is false
                            <>
                                <p>{taskName}</p>
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

export default TaskItem;
