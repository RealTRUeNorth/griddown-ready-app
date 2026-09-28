import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { legalSections } from '@/constants/legalContent';

export default function LegalScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Legal & Compliance' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {legalSections.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
        <Text style={styles.updated}>Last updated: September 2026</Text>
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
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.oliveLight,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 8,
  },
  sectionBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  updated: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
});
