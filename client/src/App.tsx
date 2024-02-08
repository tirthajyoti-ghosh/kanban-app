import axios from "axios";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import TaskItem from "./TaskItem";
import AddTaskForm from "./AddTask";
import { useTaskContext } from "./context/useTaskContext";
import "./index.css";

const KanbanBoard: React.FC = () => {
    const { phases, syncData } = useTaskContext();

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        try {
            // Update backend if task is moved to another phase or its position changes within the same phase
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

            // Update frontend state based on the drag and drop result
            const updatedPhases = [...phases];
            const sourcePhaseIndex = phases.findIndex(
                (phase) => phase._id === source.droppableId
            );
            const destinationPhaseIndex = phases.findIndex(
                (phase) => phase._id === destination.droppableId
            );

            if (source.droppableId === destination.droppableId) {
                // Task is rearranged within the same phase
                const movedTaskIndex = updatedPhases[
                    sourcePhaseIndex
                ].tasks.findIndex((task) => task._id === draggableId);
                const movedTask =
                    updatedPhases[sourcePhaseIndex].tasks[movedTaskIndex];
                updatedPhases[sourcePhaseIndex].tasks.splice(movedTaskIndex, 1); // Remove task from old position
                updatedPhases[sourcePhaseIndex].tasks.splice(
                    destination.index,
                    0,
                    movedTask
                ); // Insert task at new position
            } else {
                // Task is moved to another phase
                const taskToMove = updatedPhases[sourcePhaseIndex].tasks.find(
                    (task) => task._id === draggableId
                );
                if (taskToMove) {
                    // Check if taskToMove is defined
                    updatedPhases[sourcePhaseIndex].tasks = updatedPhases[
                        sourcePhaseIndex
                    ].tasks.filter((task) => task._id !== draggableId); // Remove task from source phase
                    updatedPhases[destinationPhaseIndex].tasks.splice(
                        destination.index,
                        0,
                        taskToMove
                    ); // Add task to destination phase
                }
            }

            syncData(updatedPhases);
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
                                                            createdAt:
                                                                new Date().toISOString(),
                                                            updatedAt:
                                                                new Date().toISOString(),
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
        </div>
    );
};

export default KanbanBoard;
