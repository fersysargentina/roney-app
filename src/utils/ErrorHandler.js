import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useMemo } from 'react';

/**
 * Maneja errores de forma global y consistente
 */
export class ErrorHandler {
  static isHandling = false;
  
  /**
   * Maneja errores de AsyncStorage de forma robusta
   */
  static async safeAsyncStorageOperation(operation, fallback = null) {
    try {
      console.log('📄 ErrorHandler: Ejecutando operación AsyncStorage...');
      const result = await operation();
      console.log('✅ ErrorHandler: Operación AsyncStorage exitosa');
      return result;
    } catch (error) {
      console.error('❌ ErrorHandler: AsyncStorage operation failed:', error);
      console.log('📄 ErrorHandler: Usando fallback:', fallback);
      return fallback;
    }
  }

  /**
   * Obtiene datos de AsyncStorage de forma segura
   */
  static async getStorageData(key, defaultValue = null) {
    return this.safeAsyncStorageOperation(
      () => AsyncStorage.getItem(key),
      defaultValue
    );
  }

  /**
   * Guarda datos en AsyncStorage de forma segura
   */
  static async setStorageData(key, value) {
    return this.safeAsyncStorageOperation(
      () => AsyncStorage.setItem(key, JSON.stringify(value)),
      false
    );
  }

  /**
   * Parsea JSON de forma segura
   */
  static safeJsonParse(jsonString, defaultValue = null) {
    try {
      console.log('📄 ErrorHandler: Parseando JSON...', jsonString ? 'con datos' : 'sin datos');
      if (!jsonString) {
        console.log('📄 ErrorHandler: JSON vacío, usando defaultValue');
        return defaultValue;
      }
      const parsed = JSON.parse(jsonString);
      const result = parsed !== null && parsed !== undefined ? parsed : defaultValue;
      console.log('✅ ErrorHandler: JSON parseado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ ErrorHandler: JSON parse failed:', error);
      console.log('📄 ErrorHandler: Usando defaultValue:', defaultValue);
      return defaultValue;
    }
  }

  /**
   * Maneja errores de la aplicación de forma consistente
   */
  static handleError(error, title = 'Error', customMessage = null, showAlert = true) {
    // Evitar múltiples alertas simultáneas
    if (this.isHandling) {
      console.log('📄 ErrorHandler: Ya manejando un error, ignorando...');
      return;
    }
    
    console.error('❌ ErrorHandler: Error handled:', error);
    console.log('📋 ErrorHandler: Detalles del error:', {
      title,
      customMessage,
      showAlert,
      errorMessage: error?.message,
      errorStack: error?.stack
    });
    
    if (showAlert) {
      this.isHandling = true;
      
      const message = customMessage || this.getErrorMessage(error);
      console.log('📱 ErrorHandler: Mostrando alerta al usuario:', { title, message });
      
      Alert.alert(
        title,
        message,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('✅ ErrorHandler: Usuario cerró alerta');
              this.isHandling = false;
            }
          }
        ]
      );
    }
  }

  /**
   * Obtiene un mensaje de error amigable para el usuario
   */
  static getErrorMessage(error) {
    if (!error) return 'Ha ocurrido un error desconocido';
    
    // Errores específicos de la aplicación
    if (error.message) {
      if (error.message.includes('AsyncStorage')) {
        return 'Error al guardar/cargar datos. Verifica el espacio de almacenamiento.';
      }
      if (error.message.includes('JSON')) {
        return 'Error al procesar los datos guardados.';
      }
      if (error.message.includes('Navigation')) {
        return 'Error de navegación en la aplicación.';
      }
    }
    
    // Mensaje genérico
    return 'Ha ocurrido un error inesperado. Intenta nuevamente.';
  }

  /**
   * Ejecuta una función de forma segura con manejo de errores
   */
  static async safeExecute(func, errorTitle = 'Error', customErrorMessage = null) {
    try {
      return await func();
    } catch (error) {
      this.handleError(error, errorTitle, customErrorMessage);
      return null;
    }
  }

  /**
   * Valida que un array sea válido y no esté corrupto
   */
  static validateArray(arr, itemValidator = null) {
    if (!Array.isArray(arr)) return [];
    
    if (!itemValidator) return arr;
    
    return arr.filter(item => {
      try {
        return itemValidator(item);
      } catch {
        return false;
      }
    });
  }

  /**
   * Valida una muestra individual
   */
  static validateMuestra(muestra) {
    return (
      muestra &&
      typeof muestra === 'object' &&
      muestra.id &&
      muestra.tipo &&
      muestra.datos &&
      typeof muestra.datos === 'object'
    );
  }

  /**
   * Valida un lote individual
   */
  static validateLote(lote) {
    return (
      lote &&
      typeof lote === 'object' &&
      lote.id &&
      lote.nombreLote &&
      typeof lote.hectareas === 'number' &&
      Array.isArray(lote.muestrasIds)
    );
  }

  /**
   * Limpia y valida datos antes de guardarlos
   */
  static sanitizeData(data, type = 'generic') {
    if (!data) return null;
    
    try {
      switch (type) {
        case 'muestras':
          return this.validateArray(data, this.validateMuestra);
        
        case 'lotes':
          return this.validateArray(data, this.validateLote);
        
        case 'subFenologicos':
          if (typeof data !== 'object' || data === null) return {};
          return data;
        
        default:
          return data;
      }
    } catch (error) {
      console.warn('Error sanitizing data:', error);
      return type === 'muestras' || type === 'lotes' ? [] : {};
    }
  }

  /**
   * Debounce para evitar llamadas excesivas
   */
  static debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }
}

/**
 * ✅ Hook personalizado OPTIMIZADO para operaciones seguras de AsyncStorage
 */
export const useAsyncStorage = () => {
  // ✅ Memoizar todas las funciones con useCallback
  const getMuestras = useCallback(async (operacionId) => {
    const data = await ErrorHandler.getStorageData(`muestras_${operacionId}`);
    const parsed = ErrorHandler.safeJsonParse(data, []);
    return ErrorHandler.sanitizeData(parsed, 'muestras');
  }, []);

  const setMuestras = useCallback(async (operacionId, muestras) => {
    const sanitized = ErrorHandler.sanitizeData(muestras, 'muestras');
    return await ErrorHandler.setStorageData(`muestras_${operacionId}`, sanitized);
  }, []);

  const getLotes = useCallback(async (operacionId) => {
    const data = await ErrorHandler.getStorageData(`lotes_${operacionId}`);
    const parsed = ErrorHandler.safeJsonParse(data, []);
    return ErrorHandler.sanitizeData(parsed, 'lotes');
  }, []);

  const setLotes = useCallback(async (operacionId, lotes) => {
    const sanitized = ErrorHandler.sanitizeData(lotes, 'lotes');
    return await ErrorHandler.setStorageData(`lotes_${operacionId}`, sanitized);
  }, []);

  const getSubFenologicos = useCallback(async (operacionId) => {
    const data = await ErrorHandler.getStorageData(`subFenologicos_${operacionId}`);
    const parsed = ErrorHandler.safeJsonParse(data, {});
    return ErrorHandler.sanitizeData(parsed, 'subFenologicos');
  }, []);

  const setSubFenologicos = useCallback(async (operacionId, subFenologicos) => {
    const sanitized = ErrorHandler.sanitizeData(subFenologicos, 'subFenologicos');
    return await ErrorHandler.setStorageData(`subFenologicos_${operacionId}`, sanitized);
  }, []);

  // ✅ Memoizar el objeto de retorno para evitar recreaciones
  return useMemo(() => ({
    getMuestras,
    setMuestras,
    getLotes,
    setLotes,
    getSubFenologicos,
    setSubFenologicos
  }), [getMuestras, setMuestras, getLotes, setLotes, getSubFenologicos, setSubFenologicos]);
};

export default ErrorHandler;