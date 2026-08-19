import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
}

export default function SwipeableRow({
  children,
  onDelete,
  disabled = false,
}: SwipeableRowProps) {
  const swipeRef = useRef<Swipeable>(null);

  const handleDelete = useCallback(() => {
    swipeRef.current?.close();
    onDelete();
  }, [onDelete]);

  const renderRightActions = useCallback(() => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={handleDelete}
        activeOpacity={0.8}
      >
        <Trash2 color={Colors.white} size={18} />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    );
  }, [handleDelete]);

  if (disabled) {
    return <View>{children}</View>;
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    backgroundColor: Colors.statusRed,
    justifyContent: 'center',
    alignItems: 'center',
    width: 84,
    marginBottom: 6,
    borderRadius: 10,
    gap: 4,
  },
  deleteText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
  },
});
