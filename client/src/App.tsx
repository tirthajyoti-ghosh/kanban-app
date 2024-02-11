import React, { useRef, useState } from "react";
import axios from "axios";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTaskContext } from "./context/useTaskContext";
import "./index.css";
import DeletePhaseModal from "./components/DeletePhaseModal";
import PhaseColumn from "./components/PhaseColumn";
import { Plus } from "lucide-react";

const KanbanBoard: React.FC = () => {
    const { phases, syncData } = useTaskContext();
    const [selectedPhaseId, setSelectedPhaseId] = useState("");
    const [newPhaseName, setNewPhaseName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

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

    const handleAddPhase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await axios.post("http://localhost:5000/phases", {
                name: newPhaseName,
            });
            syncData([...phases, { _id: data, name: newPhaseName, tasks: [] }]);
            setNewPhaseName("");
        } catch (error) {
            console.error("Error adding phase:", error);
        }
    };

    const filteredPhases = phases.map((phase) => ({
        ...phase,
        tasks: phase.tasks.filter((task) =>
            task.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    }));

    return (
        <div className="container mx-auto p-8 h-full">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-12">Kanban Board</h1>
            <div className="relative w-full mb-8">
                <Input
                    type="text"
                    ref={inputRef}
                    placeholder="Search tasks..."
                    className="w-96"
                    onChange={(e) => {
                        setTimeout(() => setSearchQuery(e.target.value), 500);
                    }}
                />
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex space-x-4 items-start mt-8 overflow-x-auto h-full">
                    {filteredPhases.map((phase) => (
                        <div
                            key={phase._id}
                            className="border border-gray-200 p-4 rounded-lg h-100 w-full min-w-[300px]"
                        >
                            <PhaseColumn
                                phase={phase}
                                onDelete={setSelectedPhaseId}
                            />
                        </div>
                    ))}
                    <form
                        onSubmit={handleAddPhase}
                        className="flex w-full max-w-sm items-center space-x-2 w-full min-w-[300px]"
                    >
                        <Input
                            type="text"
                            value={newPhaseName}
                            onChange={(e) => setNewPhaseName(e.target.value)}
                            placeholder="Enter phase name"
                        />
                        <Button type="submit"><Plus /></Button>
                    </form>
                </div>
            </DragDropContext>

            {selectedPhaseId && (
                <DeletePhaseModal
                    phaseId={selectedPhaseId}
                    open={!!selectedPhaseId}
                    onClose={() => setSelectedPhaseId("")}
                />
            )}
        </div>
    );
};

export default KanbanBoard;
