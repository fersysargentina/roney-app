import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Maneja crashes de la aplicación de forma global
 */
export class CrashHandler {
  static isInitialized = false;
  
  /**
   * Inicializa el manejo global de errores
   */
  static initialize() {
    if (this.isInitialized) return;
    
    try {
      // Manejo global de errores no capturados (safe check for global.ErrorUtils)
      const globalErrorUtils = typeof global !== 'undefined' && global.ErrorUtils ? global.ErrorUtils : null;
      
      if (globalErrorUtils && typeof globalErrorUtils.getGlobalHandler === 'function') {
        const originalHandler = globalErrorUtils.getGlobalHandler();
        
        globalErrorUtils.setGlobalHandler((error, isFatal) => {
          console.error('Global error caught:', error, 'Fatal:', isFatal);
          
          // Log del error para debugging
          this.logCrash(error, isFatal);
          
          Alert.alert(
            'Error de Aplicación',
            'Ha ocurrido un error inesperado. Tus datos están a salvo.',
            [{ text: 'OK' }]
          );
          
          // En modo desarrollo llamar al handler original para ver la pantalla roja
          if (typeof __DEV__ !== 'undefined' && __DEV__ && originalHandler) {
            originalHandler(error, isFatal);
          }
        });
      }

      // Manejo global de promesas no capturadas (Unhandled Rejections)
      if (typeof global !== 'undefined') {
        const previousRejectionHandler = global.onunhandledrejection;
        global.onunhandledrejection = (event) => {
          const reason = event?.reason || event;
          console.error('Unhandled Promise Rejection caught:', reason);
          this.logCrash(reason instanceof Error ? reason : new Error(String(reason)), false);
          if (typeof previousRejectionHandler === 'function') {
            previousRejectionHandler(event);
          }
        };
      }
    } catch (e) {
      console.warn('CrashHandler initialize failed:', e);
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Registra un crash para análisis posterior
   */
  static async logCrash(error, isFatal = false) {
    try {
      const crashLog = {
        timestamp: new Date().toISOString(),
        error: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        isFatal,
        platform: require('react-native').Platform.OS,
        version: '1.0.0'
      };
      
      // Guardar en AsyncStorage para análisis posterior
      const existingCrashes = await AsyncStorage.getItem('@app_crashes');
      let crashes = [];
      try {
        crashes = existingCrashes ? JSON.parse(existingCrashes) : [];
        if (!Array.isArray(crashes)) crashes = [];
      } catch (_) {
        crashes = [];
      }
      crashes.push(crashLog);
      
      // Mantener solo los últimos 10 crashes
      if (crashes.length > 10) {
        crashes.splice(0, crashes.length - 10);
      }
      
      await AsyncStorage.setItem('@app_crashes', JSON.stringify(crashes));
    } catch (logError) {
      console.error('Failed to log crash:', logError);
    }
  }
  
  /**
   * Obtiene el historial de crashes
   */
  static async getCrashHistory() {
    try {
      const crashes = await AsyncStorage.getItem('@app_crashes');
      return crashes ? JSON.parse(crashes) : [];
    } catch (error) {
      console.error('Failed to get crash history:', error);
      return [];
    }
  }
  
  /**
   * Limpia el historial de crashes
   */
  static async clearCrashHistory() {
    try {
      await AsyncStorage.removeItem('@app_crashes');
    } catch (error) {
      console.error('Failed to clear crash history:', error);
    }
  }
  
  /**
   * Verifica si hay crashes recientes y muestra advertencia
   */
  static async checkRecentCrashes() {
    try {
      const crashes = await this.getCrashHistory();
      const recentCrashes = crashes.filter(crash => {
        const crashTime = new Date(crash.timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return crashTime > oneHourAgo;
      });
      
      if (recentCrashes.length >= 3) {
        Alert.alert(
          'Advertencia de Estabilidad',
          'Se han detectado múltiples errores recientes. Se recomienda reiniciar la aplicación.',
          [
            { text: 'Continuar', style: 'cancel' },
            { text: 'Reiniciar', onPress: () => {
              // Aquí podrías implementar un reinicio de la app
              console.log('App restart requested');
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Failed to check recent crashes:', error);
    }
  }
}

export default CrashHandler;
