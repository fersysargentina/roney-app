import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';

// Importa tu LicenseManager
import LicenseManager from './src/utils/LicenseManager';
import { CrashHandler } from './src/utils/CrashHandler';

// Importa tus pantallas
import OperacionesScreen from './src/screens/OperacionesScreen';
import MuestrasScreen from './src/screens/MuestrasScreen';
import LotesScreen from './src/screens/LotesScreen';

const Stack = createStackNavigator();

// ✅ Componente MainApp memoizado
const MainApp = React.memo(() => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Operaciones">
        <Stack.Screen 
          name="Operaciones" 
          component={OperacionesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Muestras" 
          component={MuestrasScreen}
          options={({ route }) => ({ 
            title: route.params?.roney_op || 'Muestras'
          })}
        />
        <Stack.Screen 
          name="Lotes" 
          component={LotesScreen}
          options={({ route }) => ({ 
            title: `Lotes - ${route.params?.roney_op || 'Operación'}`
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

MainApp.displayName = 'MainApp';

export default function App() {
  const [isActivated, setIsActivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [validating, setValidating] = useState(false);

  // ✅ Inicialización memoizada
  useEffect(() => {
    // Inicializar manejo de crashes
    CrashHandler.initialize();
    
    // Verificar crashes recientes
    CrashHandler.checkRecentCrashes();
    
    checkActivation();
  }, []);

  // ✅ checkActivation memoizado
  const checkActivation = useCallback(async () => {
    try {
      const activated = await LicenseManager.isLicenseActivated();
      setIsActivated(activated);
      if (!activated) {
        const info = await LicenseManager.getDeviceInfo();
        setDeviceInfo(info);
      }
    } catch (e) {
      console.warn('Activation check failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ copyDeviceId memoizado
  const copyDeviceId = useCallback(() => {
    if (deviceInfo?.deviceId) {
      Clipboard.setString(deviceInfo.deviceId);
      Alert.alert('✓ Copiado', 'ID del dispositivo copiado al portapapeles');
    }
  }, [deviceInfo?.deviceId]);

  // ✅ handleActivation memoizado
  const handleActivation = useCallback(async () => {
    if (!licenseKey.trim()) {
      Alert.alert('Error', 'Por favor ingresa la clave de licencia');
      return;
    }

    setValidating(true);

    try {
      // Validar la clave
      const isValid = await LicenseManager.validateLicenseKey(licenseKey);
      
      if (isValid) {
        // Guardar que fue validada
        await LicenseManager.saveLicenseValidation();
        
        Alert.alert(
          '🎉 ¡Activación Exitosa!',
          'Tu aplicación ha sido activada correctamente',
          [{ text: 'Continuar', onPress: () => setIsActivated(true) }]
        );
      } else {
        Alert.alert(
          '❌ Clave Inválida',
          'La clave ingresada no es válida para este dispositivo. Verifica e intenta nuevamente.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error durante la validación');
      console.error('Validation error:', error);
    } finally {
      setValidating(false);
    }
  }, [licenseKey]);

  // ✅ handleDevReset memoizado (solo para desarrollo)
  const handleDevReset = useCallback(async () => {
    await LicenseManager.resetLicense();
    setIsActivated(false);
    setLicenseKey('');
    Alert.alert('Licencia reseteada (solo dev)');
  }, []);

  // ✅ Componente de carga memoizado
  const LoadingView = useMemo(() => (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Verificando licencia...</Text>
      </View>
    </SafeAreaView>
  ), []);

  // ✅ Device info box memoizado
  const DeviceInfoBox = useMemo(() => (
    <View style={styles.deviceInfoBox}>
      <Text style={styles.deviceInfoText}>
        📱 {deviceInfo?.model}
      </Text>
      <Text style={styles.deviceInfoText}>
        {deviceInfo?.platform === 'android' ? '🤖' : '🍎'} {deviceInfo?.platform}
      </Text>
    </View>
  ), [deviceInfo?.model, deviceInfo?.platform]);

  // Loader de carga
  if (loading) {
    return LoadingView;
  }

  // Pantalla de activación
  if (!isActivated) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.activationContainer}>
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerIcon}>🔐</Text>
                <Text style={styles.title}>Activación de Licencia</Text>
                <Text style={styles.subtitle}>
                  Sigue estos pasos para activar tu aplicación
                </Text>
              </View>

              {/* Paso 1: Device ID */}
              <View style={styles.section}>
                <Text style={styles.stepNumber}>Paso 1</Text>
                <Text style={styles.sectionTitle}>Tu ID de Dispositivo</Text>
                <Text style={styles.instructions}>
                  Comparte este código con el administrador:
                </Text>
                
                <View style={styles.deviceIdBox}>
                  <Text style={styles.deviceIdLabel}>ID del Dispositivo</Text>
                  <Text style={styles.deviceId}>{deviceInfo?.deviceId}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.copyButton} 
                  onPress={copyDeviceId}
                  activeOpacity={0.7}
                >
                  <Text style={styles.copyButtonText}>📋 Copiar ID</Text>
                </TouchableOpacity>

                {DeviceInfoBox}
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Paso 2: Ingresar clave */}
              <View style={styles.section}>
                <Text style={styles.stepNumber}>Paso 2</Text>
                <Text style={styles.sectionTitle}>Ingresa tu Clave</Text>
                <Text style={styles.instructions}>
                  Una vez que el administrador te envíe tu clave, ingrésala aquí:
                </Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                  value={licenseKey}
                  onChangeText={setLicenseKey}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={23}
                  editable={!validating}
                />

                <TouchableOpacity 
                  style={[
                    styles.activateButton,
                    validating && styles.activateButtonDisabled
                  ]} 
                  onPress={handleActivation}
                  disabled={validating}
                  activeOpacity={0.7}
                >
                  {validating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.activateButtonText}>
                      ✓ Activar Licencia
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <Text style={styles.footer}>
                ℹ️ La activación es permanente y funciona sin conexión a internet
              </Text>
            </View>
          </ScrollView>

          {/* Botón de desarrollo para resetear (ELIMINAR EN PRODUCCIÓN) */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.devResetButton}
              onPress={handleDevReset}
            >
              <Text style={styles.devResetText}>🔧 Reset License (DEV)</Text>
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // App principal - Ya está activada
  return (
    <SafeAreaView style={styles.container}>
      <MainApp />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  activationContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 15,
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  deviceIdBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deviceIdLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  deviceId: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0066cc',
    fontWeight: 'bold',
  },
  copyButton: {
    backgroundColor: '#0066cc',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  deviceInfoText: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 2,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  activateButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  activateButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  activateButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  footer: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
  devResetButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ff5722',
    padding: 12,
    borderRadius: 8,
  },
  devResetText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});