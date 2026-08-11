import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Servicio de auto-guardado y recuperación de borradores para modales
 * Incluye debouncing para evitar sobrecarga de escritura en almacenamiento.
 */
export class DraftService {
  static DRAFT_PREFIX = '@modal_draft_';
  static debounceTimers = {};

  /**
   * Guardar borrador de modal en AsyncStorage con Debounce (600ms)
   * @param {string} modalKey - Identificador del modal/operación
   * @param {Object} data - Objeto con los datos ingresados
   * @param {number} delay - Retardo en ms antes de escribir en almacenamiento
   */
  static saveDraft(modalKey, data, delay = 600) {
    if (!modalKey) return;
    
    // Cancelar timer pendiente para este modalKey
    if (this.debounceTimers[modalKey]) {
      clearTimeout(this.debounceTimers[modalKey]);
    }

    // Programar la escritura diferida
    this.debounceTimers[modalKey] = setTimeout(async () => {
      try {
        const key = `${this.DRAFT_PREFIX}${modalKey}`;
        await AsyncStorage.setItem(key, JSON.stringify({
          timestamp: new Date().toISOString(),
          data
        }));
      } catch (e) {
        console.warn('DraftService: Error guardando borrador:', e);
      } finally {
        delete this.debounceTimers[modalKey];
      }
    }, delay);
  }

  /**
   * Obtener borrador guardado de un modal
   * @param {string} modalKey - Identificador del modal
   * @returns {Promise<Object|null>} Datos del borrador o null
   */
  static async getDraft(modalKey) {
    try {
      if (!modalKey) return null;
      const key = `${this.DRAFT_PREFIX}${modalKey}`;
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.data || null;
    } catch (e) {
      console.warn('DraftService: Error leyendo borrador:', e);
      return null;
    }
  }

  /**
   * Limpiar borrador de modal al guardar la muestra exitosamente
   * @param {string} modalKey - Identificador del modal
   */
  static async clearDraft(modalKey) {
    if (!modalKey) return;

    // Cancelar cualquier guardado diferido pendiente
    if (this.debounceTimers[modalKey]) {
      clearTimeout(this.debounceTimers[modalKey]);
      delete this.debounceTimers[modalKey];
    }

    try {
      const key = `${this.DRAFT_PREFIX}${modalKey}`;
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('DraftService: Error eliminando borrador:', e);
    }
  }
}

export default DraftService;
