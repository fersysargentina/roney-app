import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper SHA-256 en JS puro para no requerir la librería externa expo-crypto
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = 'length';
  var i, j;
  var result = '';
  var words = [];
  var asciiBitLength = ascii[lengthProperty] * 8;
  var k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  var hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength);
  for (j = 0; j < words[lengthProperty];) {
    var w = words.slice(j, j += 16);
    var oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      var w15 = w[i - 15], w2 = w[i - 2];
      var a = hash[0], e = hash[4];
      var temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      var b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

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

        const randomStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const fallbackId = sha256(randomStr).substring(0, 32);
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

    const hash = sha256(data);

    const key = hash.substring(0, 20).toUpperCase();
    return `${key.slice(0, 5)}-${key.slice(5, 10)}-${key.slice(10, 15)}-${key.slice(15, 20)}`;
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
