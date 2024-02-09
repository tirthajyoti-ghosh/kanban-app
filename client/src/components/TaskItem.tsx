import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import axios from "axios";
import { Trash, Pencil, MoreVertical } from "lucide-react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import EditTaskForm from "./EditTask";
import { Task } from "../types";
import { useTaskContext } from "../context/useTaskContext";

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
        syncData(
            phases.map((phase) => {
                const updatedTasks = phase.tasks.filter(
                    (t) => t._id !== task._id
                );
                return { ...phase, tasks: updatedTasks };
            })
        );
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided) => (
                <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <CardContent className="p-4">
                        {isEditing ? (
                            // Render the edit form when isEditing is true
                            <EditTaskForm
                                initialName={task.name}
                                taskId={task._id}
                                onCancel={handleCancelEdit}
                                onSave={(newName: string) => {
                                    setTaskName(newName);
                                    syncData(
                                        phases.map((phase) => {
                                            const updatedTasks =
                                                phase.tasks.map((t) => {
                                                    if (t._id === task._id) {
                                                        return {
                                                            ...t,
                                                            name: newName,
                                                        };
                                                    }
                                                    return t;
                                                });
                                            return {
                                                ...phase,
                                                tasks: updatedTasks,
                                            };
                                        })
                                    );
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-between">
                                <p>{taskName}</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger><MoreVertical size={15} /></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={editTask}>
                                            <Pencil size={16} className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={deleteTask}>
                                            <Trash size={16} className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </Draggable>
    );
};

export default TaskItem;
