import { Stack, router } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Settings } from "lucide-react-native";
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
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/settings" as never)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="settings-btn"
            >
              <Settings color={Colors.textSecondary} size={20} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
