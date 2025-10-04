import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface Item {
    label: string;
    value: string;
    isSelected: boolean;
}

interface MultiSelectProps {
    items: Item[];
    onSelect: (selectedItems: Item[]) => void;
}

const MultiSelect = ({ items: initialItems, onSelect }: MultiSelectProps) => {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [focusedIndex, setFocusedIndex] = useState(0);

    useInput((input, key) => {
        if (key.upArrow) {
            setFocusedIndex(prev => Math.max(0, prev - 1));
        }
        if (key.downArrow) {
            setFocusedIndex(prev => Math.min(items.length - 1, prev + 1));
        }
        if (input === ' ') {
            setItems(prevItems =>
                prevItems.map((item, index) =>
                    index === focusedIndex ? { ...item, isSelected: !item.isSelected } : item
                )
            );
        }
        if (key.return) {
            onSelect(items);
        }
    });

    return (
        <Box flexDirection="column">
            {items.map((item, index) => {
                const isFocused = index === focusedIndex;
                const checkbox = item.isSelected ? '[x]' : '[ ]';
                return (
                    <Text key={item.value} color={isFocused ? 'cyan' : 'white'}>
                        {isFocused ? '> ' : '  '}
                        {checkbox} {item.label}
                    </Text>
                );
            })}
        </Box>
    );
};

export default MultiSelect;