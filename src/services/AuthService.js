import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const API_URL = 'https://fersystest.com/roney/buscar-app.php';
const USER_SESSION_KEY = '@user_session';

/**
 * Obtiene la información del dispositivo actual (iddispositivo y sistema)
 */
export const getDeviceInfo = async () => {
  let iddispositivo = '';
  try {
    if (Platform.OS === 'android') {
      iddispositivo = await Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      iddispositivo = await Application.getIosIdForVendorAsync();
    }
  } catch (e) {
    console.error('Error obteniendo ID de dispositivo:', e);
  }
  return {
    iddispositivo: iddispositivo || 'unknown-device',
    sistema: Platform.OS
  };
};

/**
 * Helper para parsear respuestas JSON del servidor de manera segura
 */
const safeJsonParse = (text) => {
  try {
    // Si viene texto con BOM o espacios antes del JSON
    const cleanText = text.trim();
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(cleanText.substring(jsonStart, jsonEnd + 1));
    }
    return JSON.parse(cleanText);
  } catch (e) {
    console.error('Respuesta no JSON del servidor:', text);
    return null;
  }
};

/**
 * Inicia sesión contra el backend
 */
export const loginUser = async (email, clave) => {
  try {
    const { iddispositivo, sistema } = await getDeviceInfo();

    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('email', email);
    formData.append('clave', clave);
    formData.append('iddispositivo', iddispositivo);
    formData.append('sistema', sistema);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const responseText = await response.text();
    const data = safeJsonParse(responseText);

    if (data && data.success) {
      const sessionData = {
        email: data.user?.email || email,
        nombre: data.user?.nombre || email,
        iddispositivo,
        sistema,
        loginAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
      return { success: true, session: sessionData };
    } else if (data && data.message) {
      return { success: false, message: data.message };
    } else {
      return { success: false, message: 'Respuesta inválida del servidor' };
    }
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, message: 'Error de conexión con el servidor' };
  }
};

/**
 * Registra un nuevo usuario en el backend
 */
export const registerUser = async (email, clave, nombre) => {
  try {
    const { iddispositivo, sistema } = await getDeviceInfo();

    const formData = new FormData();
    formData.append('action', 'createUsuario');
    formData.append('email', email);
    formData.append('usuario', email);
    formData.append('clave', clave);
    formData.append('nombre', nombre);
    formData.append('iddispositivo', iddispositivo);
    formData.append('sistema', sistema);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const responseText = await response.text();
    const data = safeJsonParse(responseText);

    if (data && data.success) {
      return { success: true, message: data.message || 'Usuario creado exitosamente' };
    } else if (data && data.message) {
      return { success: false, message: data.message };
    } else {
      return { success: false, message: 'No se pudo registrar el usuario' };
    }
  } catch (error) {
    console.error('Error en registro:', error);
    return { success: false, message: 'Error de conexión con el servidor' };
  }
};

/**
 * Cierra la sesión activa
 */
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    return true;
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    return false;
  }
};

/**
 * Elimina la cuenta (desactiva en backend y borra TODO el almacenamiento local)
 */
export const deleteUserAccount = async (email) => {
  try {
    const formData = new FormData();
    formData.append('action', 'deleteUsuario');
    formData.append('email', email);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const responseText = await response.text();
    const data = safeJsonParse(responseText);

    // Borrar todo el AsyncStorage local
    await AsyncStorage.clear();

    if (data && data.success) {
      return { success: true, message: 'Cuenta eliminada exitosamente' };
    } else {
      return { success: true, message: 'Cuenta desactivada localmente' };
    }
  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    await AsyncStorage.clear();
    return { success: true, message: 'Datos locales borrados' };
  }
};

/**
 * Obtiene la sesión actual guardada
 */
export const getUserSession = async () => {
  try {
    const data = await AsyncStorage.getItem(USER_SESSION_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (e) {
    console.error('Error obteniendo sesión:', e);
    return null;
  }
};
