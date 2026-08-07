import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function IntelLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' as const },
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "INTELLIGENCE" }} />
      <Stack.Screen name="group" options={{ title: "GROUP ROSTER" }} />
      <Stack.Screen name="library" options={{ title: "KIWIX LIBRARY" }} />
      <Stack.Screen name="guides" options={{ title: "FIELD GUIDES" }} />
    </Stack>
  );
}
