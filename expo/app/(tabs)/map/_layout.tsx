import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function MapLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' as const },
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Tactical Map" }} />
    </Stack>
  );
}
