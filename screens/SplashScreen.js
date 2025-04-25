import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    authenticate();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    return () => backHandler.remove();
  }, []);

  async function authenticate() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!compatible || !enrolled) {
      Alert.alert('Error', 'Biometric authentication is not available on this device.');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Please authenticate to continue',
      fallbackLabel: 'Use passcode',
    });

    if (result.success) {
      await AsyncStorage.setItem('authenticated', 'true');
      navigation.replace('Home');
    } else {
      setAuthError(true);
      Alert.alert('Authentication Failed', 'Unable to verify identity.');
    }
  }

  function tryAgain() {
    setAuthError(false);
    authenticate();
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Image source={require('../assets/icon.png')} style={styles.icon} />
        <Text style={styles.title}>Vani Dog</Text>
      </Animated.View>

      {authError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Authentication failed, please try again.</Text>
          <TouchableOpacity onPress={tryAgain} style={styles.button}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loadingArea}>
          <Text style={styles.sub}>Checking your identity...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E00000FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  loadingArea: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  sub: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#B00020',
    fontSize: 16,
  },
});
