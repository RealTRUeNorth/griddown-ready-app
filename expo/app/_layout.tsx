import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Alert, Platform } from "react-native";
import { AppProvider, useAppData } from "@/providers/AppProvider";
import { DownloadProvider } from "@/providers/DownloadProvider";
import { MapPacksProvider } from "@/providers/MapPacksProvider";
import Colors from "@/constants/colors";
import { useShakeSos } from "@/utils/shakeSos";
import { useBarometer } from "@/utils/barometer";
import { sendStormWarningNotification } from "@/utils/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Native-only side effects that need provider data: portrait lock on boot,
 * shake-to-SOS detection, and the barometric storm warning notification.
 * Renders nothing.
 */
function SensorEffects() {
  const { shakeSosEnabled, updateAlertLevel, remindersEnabled } = useAppData();
  const barometer = useBarometer();
  const stormNotified = useRef(false);

  const confirmSos = useCallback(() => {
    Alert.alert(
      "Shake Detected",
      "Set the group alert level to RED?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set RED",
          style: "destructive",
          onPress: () => updateAlertLevel("red"),
        },
      ]
    );
  }, [updateAlertLevel]);

  useShakeSos(shakeSosEnabled, confirmSos);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const ScreenOrientation = require("expo-screen-orientation");
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch((e: Error) =>
      console.log("Orientation lock failed:", e)
    );
  }, []);

  useEffect(() => {
    if (!remindersEnabled || !barometer.stormRisk || stormNotified.current) return;
    stormNotified.current = true;
    void sendStormWarningNotification(barometer.ratePerHour ?? 0);
  }, [remindersEnabled, barometer.stormRisk, barometer.ratePerHour]);

  return null;
}

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
              <SensorEffects />
              <RootLayoutNav />
            </MapPacksProvider>
          </DownloadProvider>
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
