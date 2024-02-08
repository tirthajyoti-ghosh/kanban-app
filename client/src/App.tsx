import React, { useState } from "react";
import axios from "axios";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import TaskItem from "./TaskItem";
import AddTaskForm from "./AddTask";
import { useTaskContext } from "./context/useTaskContext";
import "./index.css";
import DeletePhaseModal from "./DeletePhaseModal";

const KanbanBoard: React.FC = () => {
    const { phases, syncData } = useTaskContext();
    const [selectedPhaseId, setSelectedPhaseId] = useState("");
    const [newPhaseName, setNewPhaseName] = useState('');

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        try {
            if (
                source.droppableId !== destination.droppableId ||
                source.index !== destination.index
            ) {
                await axios.put(
                    `http://localhost:5000/tasks/${draggableId}/move`,
                    {
                        sourcePhaseId: source.droppableId,
                        targetPhaseId: destination.droppableId,
                        newPosition: destination.index,
                    }
                );
            }

            const updatedPhases = [...phases];
            const sourcePhaseIndex = phases.findIndex(
                (phase) => phase._id === source.droppableId
            );
            const destinationPhaseIndex = phases.findIndex(
                (phase) => phase._id === destination.droppableId
            );

            if (source.droppableId === destination.droppableId) {
                const movedTaskIndex = updatedPhases[
                    sourcePhaseIndex
                ].tasks.findIndex((task) => task._id === draggableId);
                const movedTask =
                    updatedPhases[sourcePhaseIndex].tasks[movedTaskIndex];
                updatedPhases[sourcePhaseIndex].tasks.splice(movedTaskIndex, 1);
                updatedPhases[sourcePhaseIndex].tasks.splice(
                    destination.index,
                    0,
                    movedTask
                );
            } else {
                const taskToMove = updatedPhases[sourcePhaseIndex].tasks.find(
                    (task) => task._id === draggableId
                );
                if (taskToMove) {
                    updatedPhases[sourcePhaseIndex].tasks = updatedPhases[
                        sourcePhaseIndex
                    ].tasks.filter((task) => task._id !== draggableId);
                    updatedPhases[destinationPhaseIndex].tasks.splice(
                        destination.index,
                        0,
                        taskToMove
                    );
                }
            }

            syncData(updatedPhases);
        } catch (error) {
            console.error("Error moving task:", error);
        }
    };

    const handleAddPhase = async () => {
        try {
            const { data } = await axios.post('http://localhost:5000/phases', {
                name: newPhaseName,
            });
            syncData([...phases, { _id: data, name: newPhaseName, tasks: []}]);
            setNewPhaseName('');
        } catch (error) {
            console.error('Error adding phase:', error);
        }
    };

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
        <div className="kanban-board">
            <h1>Kanban Board</h1>            
            <div className="add-phase">
                <input
                    type="text"
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    placeholder="Enter phase name"
                />
                <button onClick={handleAddPhase}>Add Phase</button>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="phases-container">
                    {phases.map((phase) => (
                        <div className="phase-column" key={phase._id}>
                            <h2>{phase.name}</h2>
                            <button onClick={() => setSelectedPhaseId(phase._id)}>
                                Delete
                            </button>
                            <button
                                onClick={() => {
                                    const newName = prompt("Enter new name:");
                                    if (newName) {
                                        editPhaseName(phase._id, newName);
                                    }
                                }}
                            >
                                Edit
                            </button>
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
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {selectedPhaseId && (
                <DeletePhaseModal
                    phaseId={selectedPhaseId}
                    onClose={() => setSelectedPhaseId("")}
                />
            )}
        </div>
    );
};

export default KanbanBoard;
