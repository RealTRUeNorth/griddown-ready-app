import { Tabs } from "expo-router";
import { Shield, Package, Map, Radio, BookOpen } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.orange,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          letterSpacing: 0.5,
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Status",
          tabBarIcon: ({ color }) => <Shield color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="prep"
        options={{
          title: "Prep",
          tabBarIcon: ({ color }) => <Package color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <Map color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="comms"
        options={{
          title: "Comms",
          tabBarIcon: ({ color }) => <Radio color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="intel"
        options={{
          title: "Intel",
          tabBarIcon: ({ color }) => <BookOpen color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
