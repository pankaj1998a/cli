import React from 'react';
import { useInput } from 'ink';

interface ConfirmProps {
    onConfirm: (confirmed: boolean) => void;
}

const Confirm = ({ onConfirm }: ConfirmProps) => {
    useInput((input, key) => {
        if (input.toLowerCase() === 'y' || key.return) {
            onConfirm(true);
        } else if (input.toLowerCase() === 'n' || key.escape) {
            onConfirm(false);
        }
    });

    // This component doesn't render anything itself, it just listens for input.
    return null;
};

export default Confirm;