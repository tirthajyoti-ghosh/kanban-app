import React, { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface EditPhaseProps {
    phaseId: string;
    initialName: string;
    onSave: (newName: string) => void;
    onCancel: () => void;
}

const EditPhaseForm: React.FC<EditPhaseProps> = ({
    phaseId,
    initialName,
    onSave: handleSave,
    onCancel: handleClose,
}) => {
    const [phaseName, setPhaseName] = useState(initialName);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPhaseName(event.target.value);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await axios.put(`http://localhost:5000/tasks/${phaseId}`, {
                name: phaseName,
            });
            handleSave(phaseName);
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
                value={phaseName}
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

export default EditPhaseForm;
