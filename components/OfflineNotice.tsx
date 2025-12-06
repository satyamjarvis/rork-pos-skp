import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      console.log('Network state changed:', state.isConnected);
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOffline) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOffline, fadeAnim, scaleAnim]);

  const handleRetry = async () => {
    setIsChecking(true);
    const state = await NetInfo.fetch();
    console.log('Manual check - Network state:', state.isConnected);
    setIsOffline(!state.isConnected);
    setTimeout(() => setIsChecking(false), 1000);
  };

  if (!isOffline) return null;

  return (
    <Modal
      visible={isOffline}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <WifiOff size={48} color="#EF4444" strokeWidth={2} />
            </View>
          </View>

          <Text style={styles.title}>Ingen internettilkobling</Text>
          <Text style={styles.message}>
            Vennligst sjekk internettforbindelsen din og prøv igjen.
          </Text>

          <TouchableOpacity
            style={[styles.retryButton, isChecking && styles.retryButtonChecking]}
            onPress={handleRetry}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            <RefreshCw
              size={20}
              color="#fff"
              strokeWidth={2.5}
              style={isChecking ? styles.spinning : undefined}
            />
            <Text style={styles.retryButtonText}>
              {isChecking ? 'Sjekker...' : 'Prøv igjen'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Kontroller at Wi-Fi eller mobildata er aktivert
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FECACA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center' as const,
    marginBottom: 28,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonChecking: {
    backgroundColor: '#9CA3AF',
  },
  retryButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center' as const,
    marginTop: 20,
    lineHeight: 18,
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
  },
});

export default OfflineNotice;
