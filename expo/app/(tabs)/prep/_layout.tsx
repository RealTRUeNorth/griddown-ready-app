import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function PrepLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' as const },
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "READINESS" }} />
      <Stack.Screen name="weather" options={{ title: "WEATHER" }} />
      <Stack.Screen name="supplies" options={{ title: "SUPPLIES" }} />
      <Stack.Screen name="checklists" options={{ title: "CHECKLISTS" }} />
    </Stack>
  );
}
