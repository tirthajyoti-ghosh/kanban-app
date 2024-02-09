import React, { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
        <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-sm items-center space-x-2 mt-4 border-t border-gray-300 pt-4"
        >
            <Input
                type="text"
                placeholder="Enter task name"
                value={taskName}
                onChange={handleInputChange}
                required
            />
            <Button type="submit"><Plus /></Button>
        </form>
    );
};

export default AddTaskForm;
