import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';

export default function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    checklists,
    toggleChecklistItem,
    addChecklistItem,
    removeChecklistItem,
  } = useAppData();
  const checklist = checklists.find((cl) => cl.id === id);
  const [newItemText, setNewItemText] = useState('');
  const [showAddField, setShowAddField] = useState(false);

  const handleToggle = useCallback(
    (itemId: string) => {
      if (!id) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleChecklistItem(id, itemId);
    },
    [id, toggleChecklistItem]
  );

  const handleAddItem = useCallback(() => {
    if (!newItemText.trim() || !id) return;
    const newItem = {
      id: `item_${Date.now()}`,
      text: newItemText.trim(),
      completed: false,
    };
    addChecklistItem(id, newItem);
    setNewItemText('');
    setShowAddField(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newItemText, id, addChecklistItem]);

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      if (!id) return;
      Alert.alert('Remove Item', 'Remove this item from the checklist?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeChecklistItem(id, itemId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]);
    },
    [id, removeChecklistItem]
  );

  if (!checklist) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Checklist not found</Text>
      </View>
    );
  }

  const completedCount = checklist.items.filter((i) => i.completed).length;
  const totalCount = checklist.items.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <Stack.Screen options={{ title: checklist.title }} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.progressHeader}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressPercent}>{percent}%</Text>
              <Text style={styles.progressLabel}>
                {completedCount}/{totalCount} complete
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${percent}%`,
                    backgroundColor:
                      percent === 100
                        ? Colors.statusGreen
                        : percent > 50
                        ? Colors.statusAmber
                        : Colors.orange,
                  },
                ]}
              />
            </View>
          </View>

          <Text style={styles.description}>{checklist.description}</Text>

          {checklist.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <TouchableOpacity
                style={styles.itemCheckArea}
                onPress={() => handleToggle(item.id)}
                activeOpacity={0.7}
              >
                {item.completed ? (
                  <CheckCircle2 color={Colors.statusGreen} size={22} />
                ) : (
                  <Circle color={Colors.textMuted} size={22} />
                )}
                <Text
                  style={[
                    styles.itemText,
                    item.completed && styles.itemTextCompleted,
                  ]}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRemoveItem(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 color={Colors.textMuted} size={16} />
              </TouchableOpacity>
            </View>
          ))}

          {showAddField ? (
            <View style={styles.addFieldRow}>
              <TextInput
                style={styles.addInput}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="New item..."
                placeholderTextColor={Colors.textMuted}
                autoFocus
                onSubmitEditing={handleAddItem}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addConfirm} onPress={handleAddItem}>
                <Text style={styles.addConfirmText}>ADD</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddField(true)}
            >
              <Plus color={Colors.orange} size={18} />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  progressHeader: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  progressPercent: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '800' as const,
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.bgElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemCheckArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  itemText: {
    color: Colors.textPrimary,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  itemTextCompleted: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  addFieldRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.orange,
  },
  addConfirm: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addConfirmText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: Colors.orange,
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
