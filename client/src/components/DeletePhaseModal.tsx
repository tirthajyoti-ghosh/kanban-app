import { useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTaskContext } from "../context/useTaskContext";
import { AlertTriangle } from "lucide-react";

type DeletePhaseModalProps = {
    phaseId: string;
    open: boolean;
    onClose: () => void;
};

const DeletePhaseModal = ({ phaseId, open, onClose }: DeletePhaseModalProps) => {
    const { phases, syncData } = useTaskContext();
    const [selectedPhase, setSelectedPhase] = useState("");

    const handleDelete = async () => {
        try {
            await axios.delete(
                `http://localhost:5000/phases/${phaseId}?altPhaseId=${encodeURIComponent(
                    selectedPhase
                )}`
            );

            const tasksToMove = phases.find(
                (phase) => phase._id === phaseId
            )?.tasks;
            const updatedPhases = phases.map((phase) => {
                if (phase._id === selectedPhase) {
                    return {
                        ...phase,
                        tasks: [...phase.tasks, ...(tasksToMove || [])],
                    };
                }
                return phase;
            });

            syncData(updatedPhases.filter((phase) => phase._id !== phaseId));
            onClose();
        } catch (error) {
            console.error("Error deleting phase:", error);
        }
    };

    return (
        <Dialog open={open}>
            <DialogContent>
                <DialogHeader className="flex-row items-center gap-2">
                    <AlertTriangle className="mt-1" size="24" />
                    <p className="text-lg font-bold mt-0">
                        Delete Phase
                        </p>
                </DialogHeader>
                <DialogDescription>
                    Select a new home for the tasks in this phase
                </DialogDescription>
                <Select
                    value={selectedPhase}
                    onValueChange={(value) => setSelectedPhase(value)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Phase" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {phases.filter((phase) => phase._id !== phaseId).map((phase) => (
                                <SelectItem key={phase._id} value={phase._id}>
                                    <SelectLabel>{phase.name}</SelectLabel>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <DialogFooter className="justify-end">
                    <Button disabled={!selectedPhase}
                     onClick={handleDelete}>Delete</Button>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeletePhaseModal;
