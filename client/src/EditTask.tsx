import React, { useState } from "react";
import axios from "axios";

interface EditTaskProps {
    taskId: string;
    initialName: string;
    onSave: (newName: string) => void;
    onCancel: () => void;
}

const EditTaskForm: React.FC<EditTaskProps> = ({
    taskId,
    initialName,
    onSave: handleSave,
    onCancel: handleClose,
}) => {
    const [taskName, setTaskName] = useState(initialName);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTaskName(event.target.value);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await axios.put(`http://localhost:5000/tasks/${taskId}`, { name: taskName });
            handleSave(taskName);
            handleClose();
        } catch (error) {
            console.error("Error updating task:", error);
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
            <button type="submit">Update</button>
            <button type="button" onClick={handleClose}>
                Cancel
            </button>
        </form>
    );
};

export default EditTaskForm;
