import React, { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

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
            await axios.put(`http://localhost:5000/tasks/${taskId}`, {
                name: taskName,
            });
            handleSave(taskName);
            handleClose();
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-x-2"
        >
            <Input
                type="text"
                placeholder="Enter task name"
                value={taskName}
                onChange={handleInputChange}
                required
            />
            <div className="space-x-2 flex mt-4 justify-end">
                <Button type="submit" className="text-white pv-2 ph-4">
                    <Check />
                </Button>
                <Button type="button" onClick={handleClose}>
                    <X />
                </Button>
            </div>
        </form>
    );
};

export default EditTaskForm;
