import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' as const },
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "GRIDDOWN",
          headerTitleStyle: {
            color: Colors.orange,
            fontWeight: '800' as const,
            fontSize: 18,
            letterSpacing: 1.5,
          },
        }}
      />
    </Stack>
  );
}
