import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Brightness from 'expo-brightness';
import { Flashlight, FlashlightOff, Siren, Sun } from 'lucide-react-native';
import Colors from '@/constants/colors';

type LanternMode = 'off' | 'steady' | 'sos';

const MODE_LABELS: Record<LanternMode, string> = {
  off: 'OFF',
  steady: 'STEADY',
  sos: 'SOS',
};

/**
 * Emergency lantern: rear LED torch (steady + Morse SOS) with an automatic
 * full-white screen fallback when the camera/torch isn't available, and a
 * brightness pin so the screen is usable as a light.
 */
export default function LanternScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<LanternMode>('off');
  const [torchPulse, setTorchPulse] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [brightness, setBrightness] = useState(0.5);
  const savedBrightness = useRef<number | null>(null);

  const canUseTorch = Platform.OS !== 'web' && permission?.granted === true;

  // Save and restore system brightness around the lantern session
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        const current = await Brightness.getSystemBrightnessAsync();
        savedBrightness.current = current;
        setBrightness(Math.max(current, 0.5));
      } catch {
        // Brightness control unavailable — slider just won't stick
      }
    })();
    return () => {
      if (savedBrightness.current != null) {
        Brightness.setSystemBrightnessAsync(savedBrightness.current).catch(() => {});
      }
    };
  }, []);

  // Drive the light source for the current mode
  useEffect(() => {
    if (mode !== 'sos') {
      setTorchPulse(false);
      setScreenFlash(mode === 'steady' && !canUseTorch);
      return;
    }
    if (canUseTorch) {
      setScreenFlash(false);
      const interval = setInterval(() => setTorchPulse((p) => !p), 250);
      return () => clearInterval(interval);
    }
    const interval = setInterval(() => setScreenFlash((f) => !f), 250);
    return () => clearInterval(interval);
  }, [mode, canUseTorch]);

  const handleBrightness = (value: number) => {
    setBrightness(value);
    if (Platform.OS !== 'web') {
      Brightness.setSystemBrightnessAsync(value).catch(() => {});
    }
  };

  const torchLit = canUseTorch && (mode === 'steady' || (mode === 'sos' && torchPulse));
  const screenLit = !canUseTorch && mode !== 'off' && (mode === 'steady' || screenFlash);

  return (
    <>
      <Stack.Screen options={{ title: 'Lantern' }} />
      <View style={styles.container}>
        <View style={[styles.lightStage, { backgroundColor: screenLit || torchLit ? '#FFF7D6' : Colors.bgElevated }]}>
          {torchLit ? (
            <Flashlight color="#5A4A1A" size={52} />
          ) : screenLit ? (
            <Sun color="#5A4A1A" size={52} />
          ) : (
            <FlashlightOff color={Colors.textMuted} size={52} />
          )}
        </View>

        {!canUseTorch && Platform.OS !== 'web' && permission?.granted === false && (
          <TouchableOpacity style={styles.permissionBtn} onPress={() => requestPermission()} activeOpacity={0.7}>
            <Text style={styles.permissionText}>Allow camera access to use the LED torch</Text>
          </TouchableOpacity>
        )}
        {!canUseTorch && mode !== 'off' && (
          <Text style={styles.fallbackNote}>
            {Platform.OS === 'web' ? 'Screen light mode' : 'No torch — using screen light'}
          </Text>
        )}

        <View style={styles.modeRow}>
          {(['off', 'steady', 'sos'] as LanternMode[]).map((m) => {
            const isActive = mode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, isActive && styles.modeBtnActive, m === 'sos' && styles.modeBtnSos]}
                onPress={() => setMode(m)}
                activeOpacity={0.7}
                testID={`lantern-mode-${m}`}
              >
                {m === 'sos' ? (
                  <Siren color={isActive ? Colors.white : Colors.statusRed} size={16} />
                ) : isActive ? (
                  <Flashlight color={Colors.white} size={16} />
                ) : (
                  <FlashlightOff color={Colors.textSecondary} size={16} />
                )}
                <Text style={[styles.modeText, isActive && styles.modeTextActive]}>{MODE_LABELS[m]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.brightnessCard}>
          <View style={styles.brightnessHeader}>
            <Sun color={Colors.amberLight} size={15} />
            <Text style={styles.brightnessTitle}>Screen Brightness</Text>
            <Text style={styles.brightnessValue}>{Math.round(brightness * 100)}%</Text>
          </View>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${brightness * 100}%` }]} />
          </View>
          <View style={styles.sliderButtons}>
            {[0.5, 0.75, 1].map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.brightnessPreset, brightness === v && styles.brightnessPresetActive]}
                onPress={() => handleBrightness(v)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.brightnessPresetText,
                    brightness === v && styles.brightnessPresetTextActive,
                  ]}
                >
                  {v === 1 ? 'MAX' : `${v * 100}%`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>
            Turn the screen all the way up before dark so you're not fumbling with settings later.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: 16,
    gap: 16,
  },
  lightStage: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtn: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  permissionText: {
    color: Colors.oliveLight,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  fallbackNote: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtnActive: {
    backgroundColor: Colors.olive,
    borderColor: Colors.olive,
  },
  modeBtnSos: {
    borderColor: Colors.statusRed,
  },
  modeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  modeTextActive: {
    color: Colors.white,
  },
  brightnessCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  brightnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brightnessTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700' as const,
    flex: 1,
  },
  brightnessValue: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.bgElevated,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.amber,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  brightnessPreset: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  brightnessPresetActive: {
    backgroundColor: Colors.orangeMuted,
    borderColor: Colors.amber,
  },
  brightnessPresetText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  brightnessPresetTextActive: {
    color: Colors.textPrimary,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
