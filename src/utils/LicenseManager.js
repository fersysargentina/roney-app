import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LicenseManager {
 
  static SECRET_KEY = 'Roney2025-APP-83693!!!dj$-qmcywalcye';
  
  static LICENSE_STORAGE_KEY = '@app_license_validated';

  /**
   * Obtiene el Device ID único del dispositivo
   */
  static async getDeviceId() {
    try {
      // Intentar IDs nativos
      let deviceId = null;
      if (Platform.OS === 'android') {
        deviceId = await Application.getAndroidId();
      } else if (Platform.OS === 'ios') {
        deviceId = await Application.getIosIdForVendorAsync();
      }

      // Fallback: Si no toma el id del dispositivo genera uno aleatorio
      if (!deviceId) {
        const FALLBACK_KEY = '@fallback_device_id';
        const saved = await AsyncStorage.getItem(FALLBACK_KEY);
        if (saved) return saved;

        const randomBytes = await Crypto.getRandomBytesAsync(16);
        const hex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
        const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hex);
        const fallbackId = hash.substring(0, 32);
        await AsyncStorage.setItem(FALLBACK_KEY, fallbackId);
        return fallbackId;
      }

      return deviceId;
    } catch (error) {
      console.error('Error obteniendo Device ID:', error);
      // Último recurso: un ID fijo efímero en memoria (no persistente)
      return 'expo-go-fallback-id';
    }
  }

  /**
   * Genera la clave de licencia válida para un Device ID
   * Mismo algoritmo que en licence-generator.js
   */
  static async generateLicenseKey(deviceId) {
    const data = `${deviceId}:${this.SECRET_KEY}`;
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    
    const key = hash.substring(0, 20).toUpperCase();
    return `${key.slice(0,5)}-${key.slice(5,10)}-${key.slice(10,15)}-${key.slice(15,20)}`;
  }

  /**
   * Valida que la clave ingresada sea correcta para este dispositivo
   */
  static async validateLicenseKey(inputKey) {
    try {
      const deviceId = await this.getDeviceId();
      if (!deviceId) return false;

      // Generar la clave correcta para este dispositivo
      const correctKey = await this.generateLicenseKey(deviceId);
      
      const cleanInput = inputKey.replace(/[-\s]/g, '').toUpperCase();
      const cleanCorrect = correctKey.replace(/[-\s]/g, '').toUpperCase();
      
      return cleanInput === cleanCorrect;
    } catch (error) {
      console.error('Error validando licencia:', error);
      return false;
    }
  }

  /**
   * Guarda que la licencia fue validada exitosamente
   */
  static async saveLicenseValidation() {
    try {
      const deviceId = await this.getDeviceId();
      await AsyncStorage.setItem(this.LICENSE_STORAGE_KEY, deviceId);
      return true;
    } catch (error) {
      console.error('Error guardando validación:', error);
      return false;
    }
  }

  /**
   * Verifica si el dispositivo ya fue activado previamente
   */
  static async isLicenseActivated() {
    try {
      const deviceId = await this.getDeviceId();
      const savedDeviceId = await AsyncStorage.getItem(this.LICENSE_STORAGE_KEY);
      
      return savedDeviceId === deviceId;
    } catch (error) {
      console.error('Error verificando activación:', error);
      return false;
    }
  }

  /**
   * Información del dispositivo para mostrar al usuario
   */
  static async getDeviceInfo() {
    const deviceId = await this.getDeviceId();
    let deviceName = null;
    try {
      deviceName = await Application.getDeviceNameAsync();
    } catch (_) {
      deviceName = 'Unknown Device';
    }
    return {
      deviceId,
      platform: Platform.OS,
      model: deviceName,
    };
  }

  /**
   * Resetear licencia (solo para desarrollo/testing)
   */
  static async resetLicense() {
    try {
      await AsyncStorage.removeItem(this.LICENSE_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error reseteando licencia:', error);
      return false;
    }
  }
}

export default LicenseManager;
