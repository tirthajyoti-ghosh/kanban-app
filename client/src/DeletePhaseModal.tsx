import React, { useState } from 'react';
import axios from 'axios';
import { useTaskContext } from './context/useTaskContext';

type DeletePhaseModalProps = {
    phaseId: string;
    onClose: () => void;
};

const DeletePhaseModal = ({ phaseId, onClose }: DeletePhaseModalProps) => {
    const {phases, syncData } = useTaskContext();
    const [selectedPhase, setSelectedPhase] = useState('');
  
    const handleDelete = async () => {
        try {
            await axios.delete(`http://localhost:5000/phases/${phaseId}?altPhaseId=${encodeURIComponent(selectedPhase)}`);

            const tasksToMove = phases.find((phase) => phase._id === phaseId)?.tasks;
            const updatedPhases = phases.map((phase) => {
                if (phase._id === selectedPhase) {
                    return { ...phase, tasks: [...phase.tasks, ...(tasksToMove || [])] };
                }
                return phase;
            });

            syncData(updatedPhases.filter((phase) => phase._id !== phaseId));
        } catch (error) {
            console.error('Error deleting phase:', error);
        }
        onClose();
    };

    return (
        <div className="modal">
            <h3>Move tasks to:</h3>
            <select value={selectedPhase} onChange={(e) => setSelectedPhase(e.target.value)}>
                <option value="">Select Phase</option>
                {phases.map((phase) => (
                    <option key={phase._id} value={phase._id}>{phase.name}</option>
                ))}
            </select>
            <button onClick={handleDelete}>Delete</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    );
};

export default DeletePhaseModal;