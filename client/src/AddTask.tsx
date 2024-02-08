import React, { useState } from "react";
import axios from "axios";

interface AddTaskProps {
    phaseId: string;
    onTaskAdded: ({ name, _id }: { name: string; _id: string }) => void;
}

const AddTaskForm: React.FC<AddTaskProps> = ({ phaseId, onTaskAdded }) => {
    const [taskName, setTaskName] = useState("");

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTaskName(event.target.value);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const { data } = await axios.post(
                `http://localhost:5000/phases/${phaseId}/tasks`,
                { name: taskName }
            );
            setTaskName("");
            onTaskAdded({ name: taskName, _id: data });
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Enter task name"
                value={taskName}
                onChange={handleInputChange}
                required
            />
            <button type="submit">Add Task</button>
        </form>
    );
};

export default AddTaskForm;
