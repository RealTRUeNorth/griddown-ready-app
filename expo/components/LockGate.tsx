import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Shield, Fingerprint } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { authenticateUser, hasBiometricCapability } from '@/utils/deviceServices';

/**
 * Full-screen biometric gate rendered over the app while App Lock is
 * engaged. Re-locks when the app returns to the background and prompts the
 * system auth UI automatically once per lock.
 */
export function LockGate({ enabled }: { enabled: boolean }) {
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [usesBiometrics, setUsesBiometrics] = useState(false);
  const autoTriedRef = useRef(false);

  useEffect(() => {
    if (enabled && Platform.OS !== 'web') {
      setIsLocked(true);
      void hasBiometricCapability().then(setUsesBiometrics);
    } else {
      setIsLocked(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' && enabled) {
        autoTriedRef.current = false;
        setIsLocked(true);
      }
    });
    return () => subscription.remove();
  }, [enabled]);

  const unlock = useCallback(async () => {
    setIsAuthenticating(true);
    const ok = await authenticateUser('Unlock your GRIDDOWN ops kit');
    setIsAuthenticating(false);
    if (ok) setIsLocked(false);
  }, []);

  useEffect(() => {
    if (isLocked && !autoTriedRef.current) {
      autoTriedRef.current = true;
      void unlock();
    }
  }, [isLocked, unlock]);

  if (!isLocked) return null;

  return (
    <View style={styles.overlay}>
      <Shield color={Colors.orange} size={48} />
      <Text style={styles.title}>GRIDDOWN</Text>
      <Text style={styles.subtitle}>Your ops kit is locked</Text>
      <TouchableOpacity style={styles.button} onPress={() => void unlock()} activeOpacity={0.7} testID="unlock-btn">
        {isAuthenticating ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <>
            {usesBiometrics && <Fingerprint color={Colors.white} size={16} />}
            <Text style={styles.buttonText}>
              Unlock with {usesBiometrics ? 'Biometrics' : 'Passcode'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    zIndex: 100,
    elevation: 100,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.olive,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
