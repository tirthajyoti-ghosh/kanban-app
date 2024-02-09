import { Droppable } from "react-beautiful-dnd";
import axios from "axios";
import { Trash, Pencil, MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import TaskItem from "./TaskItem";
import AddTaskForm from "./AddTask";
import { Phase } from "@/types";
import { useTaskContext } from "@/context/useTaskContext";
import { useState } from "react";
import EditPhaseForm from "./EditPhase";

export default function PhaseColumn({ phase, onDelete }: { phase: Phase; onDelete: (phaseId: string) => void }) {
    const { phases, syncData } = useTaskContext();
    const [phaseName, setPhaseName] = useState(phase.name);
    const [isEditing, setIsEditing] = useState(false);

    const editPhaseName = async (phaseId: string, newName: string) => {
        try {
            await axios.put(`http://localhost:5000/phases/${phaseId}`, {
                name: newName,
            });
            const updatedPhases = phases.map((phase) =>
                phase._id === phaseId ? { ...phase, name: newName } : phase
            );
            syncData(updatedPhases);
        } catch (error) {
            console.error("Error editing phase name:", error);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-4">
                {isEditing ? (
                    <EditPhaseForm
                        initialName={phaseName}
                        phaseId={phase._id}
                        onSave={(newName) => {
                            editPhaseName(phase._id, newName);
                            setIsEditing(false);
                            setPhaseName(newName);
                        }}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <>
                        <h2 className="text-lg font-bold">
                            {phaseName} ({phase.tasks.length})
                        </h2>
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <MoreVertical />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setIsEditing(true);
                                    }}
                                >
                                    <Pencil
                                        size={16}
                                        className="mr-2 h-4 w-4"
                                    />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        onDelete(phase._id)
                                    }
                                >
                                    <Trash size={16} className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}
            </div>
            <Droppable droppableId={phase._id}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-4"
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
            <AddTaskForm
                phaseId={phase._id}
                onTaskAdded={({ name, _id }) => {
                    syncData(
                        phases.map((p) => {
                            if (p._id === phase._id) {
                                return {
                                    ...p,
                                    tasks: [
                                        ...p.tasks,
                                        {
                                            _id,
                                            name,
                                            phaseId: p._id,
                                            createdAt: new Date().toISOString(),
                                            updatedAt: new Date().toISOString(),
                                        },
                                    ],
                                };
                            }
                            return p;
                        })
                    );
                }}
            />
        </>
    );
}
