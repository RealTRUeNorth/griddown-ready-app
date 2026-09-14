import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/providers/AppProvider";
import { DownloadProvider } from "@/providers/DownloadProvider";
import { MapPacksProvider } from "@/providers/MapPacksProvider";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { color: Colors.textPrimary },
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-member"
        options={{ presentation: "modal", title: "Add Member" }}
      />
      <Stack.Screen
        name="add-supply"
        options={{ presentation: "modal", title: "Add Supply" }}
      />
      <Stack.Screen
        name="guide-detail"
        options={{ title: "Guide" }}
      />
      <Stack.Screen
        name="checklist-detail"
        options={{ title: "Checklist" }}
      />
      <Stack.Screen
        name="member-detail"
        options={{ title: "Member" }}
      />
      <Stack.Screen
        name="add-poi"
        options={{ presentation: "modal", title: "Add POI" }}
      />
      <Stack.Screen
        name="add-route"
        options={{ presentation: "modal", title: "Add Route" }}
      />
      <Stack.Screen
        name="add-channel"
        options={{ presentation: "modal", title: "Add Channel" }}
      />
      <Stack.Screen
        name="add-repeater"
        options={{ presentation: "modal", title: "Add Repeater" }}
      />
      <Stack.Screen
        name="resource-detail"
        options={{ title: "Resource" }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: "Settings" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <AppProvider>
          <DownloadProvider>
            <MapPacksProvider>
              <RootLayoutNav />
            </MapPacksProvider>
          </DownloadProvider>
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
