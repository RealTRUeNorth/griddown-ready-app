import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { HelpCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { faqEntries } from '@/constants/legalContent';

export default function HelpFaqScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Help & FAQ' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {faqEntries.map((entry) => (
          <View key={entry.question} style={styles.card}>
            <View style={styles.header}>
              <HelpCircle color={Colors.orangeLight} size={16} />
              <Text style={styles.question}>{entry.question}</Text>
            </View>
            <Text style={styles.answer}>{entry.answer}</Text>
          </View>
        ))}
      </ScrollView>
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
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  question: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700' as const,
    flex: 1,
  },
  answer: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
