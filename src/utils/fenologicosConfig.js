// utils/fenologicosConfig.js

export const ESTADOS_FENOLOGICOS = {
    soja: [
      { label: "V1-V5", value: "1" },
      { label: "V6-V8", value: "2" },
      { label: "V9-VN", value: "3" },
      { label: "R1-R2", value: "4" },
      { label: "R2,5", value: "5" },
      { label: "R3", value: "6" },
      { label: "R3,5", value: "7" },
      { label: "R4", value: "8" },
      { label: "R4,5", value: "9" },
      { label: "R5-R5,5", value: "10" },
      { label: "R6", value: "11" },
      { label: "R6,5", value: "12" },
      { label: "R8", value: "13" }
    ],
    
    maiz: [
      { label: "V1-V4", value: "1" },
      { label: "V5", value: "2" },
      { label: "V6", value: "3" },
      { label: "V7", value: "4" },
      { label: "V8", value: "5" },//veerv9-r6 va de v4 a r6 y tiene muchas opciones
      { label: "V13-VT", value: "6" },
      { label: "R1", value: "7" },
      { label: "R2", value: "8" },
      { label: "R3", value: "9" },
      { label: "R4", value: "10" },
      { label: "R5", value: "11" },
      { label: "R6", value: "12" }
    ],
    
    trigo: [
      { label: "Espigamiento (Z.50/59)", value: "1" },
      { label: "Floración (Z.60/69)", value: "2" },
      { label: "Lechoso (Z.70/79)", value: "3" },
      { label: "Pastoso blando (Z.80/84)", value: "4" },
      { label: "Pastoso duro (Z.85/89)", value: "5" },
      { label: "Próx. a mudurez (Z.90/99)", value: "6" },
    ],
    
    girasol: [
      { label: "V1-V11", value: "1" },
      { label: "V12-Vn", value: "2" },
      { label: "R1 (estrella)", value: "3" },
      { label: "R2 (botón a 0,5 - 2 cm)", value: "4" },
      { label: "R3 (botón a + de 2 cm)", value: "5" },
      { label: "R4 (apertura inflorescencia)", value: "6" },
      { label: "R5 (inicio floración)", value: "7" },
      { label: "R6 (fin floración)", value: "8" },
      { label: "R7 (envés capítulo inicio amarilleo)", value: "9" },
      { label: "R8 (envés capítulo amarillo)", value: "10" },
      { label: "R9 (brácteas amarillo/marrón)", value: "11" },
    ]
  };
  
/**
 * Obtiene los estados fenológicos según el tipo de cultivo
 * @param {string} cultivo - Tipo de cultivo (soja, maiz, trigo, girasol)
 * @returns {Array} Array de objetos con label y value
 */
export const obtenerEstadosFenologicos = (cultivo) => {
    const cultivoNormalizado = cultivo?.toLowerCase().trim();
    return ESTADOS_FENOLOGICOS[cultivoNormalizado] || ESTADOS_FENOLOGICOS.soja;
  };
  
  /**
   * Valida si un estado fenológico es válido para un cultivo
   * @param {string} cultivo - Tipo de cultivo
   * @param {string} estadoValue - Valor del estado fenológico
   * @returns {boolean}
   */
  export const esEstadoValido = (cultivo, estadoValue) => {
    const estados = obtenerEstadosFenologicos(cultivo);
    return estados.some(estado => estado.value === estadoValue);
  };
  
  /**
   * Mapeo de estados fenológicos a tipos de modal por cultivo
   * Cada rango de valores se mapea a un tipo de modal ('1', '2', '3', '4', etc.)
   */
  export const MAPEO_TIPO_MODAL = {
    soja: [
      { min: 1, max: 3, tipo: '1' },   // V1-V5, V6-V8, V9-VN
      { min: 4, max: 7, tipo: '2' },   // R1-R2, R2,5, R3, R3,5
      { min: 8, max: 12, tipo: '3' },  // R4, R4,5, R5-R5,5, R6, R6,5
      { min: 13, max: 99, tipo: '4' }  // R8 en adelante
    ],
    
    maiz: [
      { min: 1, max: 3, tipo: '1' },   // VE, V1-V3, V4-V6
      { min: 4, max: 6, tipo: '2' },   // V7-V9, V10-V12, V13-VT
      { min: 7, max: 9, tipo: '3' },   // R1, R2, R3
      { min: 10, max: 99, tipo: '4' }  // R4, R5, R6
    ],
    
    trigo: [
      { min: 1, max: 99, tipo: 'trigo' }
    ],
    
    girasol: [
      { min: 1, max: 11, tipo: '1' },   // V1-V11, 
      // { min: 2, max: 2, tipo: '2' },   // V12-VN, 
      // { min: 3, max: 3, tipo: '3' },   // R1 (estrella), 
      // { min: 4, max: 4, tipo: '4' },   // R2 (botón a 0,5 - 2 cm), 
      // { min: 5, max: 5, tipo: '5' },   // R3 (botón a + de 2 cm), 
      // { min: 6, max: 6, tipo: '6' },   // R4 (apertura inflorescencia), 
      // { min: 7, max: 7, tipo: '7' },   // R5 (inicio floración), 
      // { min: 8, max: 8, tipo: '8' },   // R6 (fin floración), 
      // { min: 9, max: 9, tipo: '9' },   // R7 (envés capítulo inicio amarilleo), 
      // { min: 10, max: 10, tipo: '10' },   // R8 (envés capítulo amarillo), 
      // { min: 11, max: 11, tipo: '11' },   // R9 (brácteas amarillo/marrón), 
    ]
  };
  
  /**
   * Mapea un valor de estado fenológico al tipo de modal correspondiente
   * @param {string} cultivo - Tipo de cultivo
   * @param {string} valorSeleccion - Valor del estado fenológico seleccionado
   * @returns {string} Tipo de modal ('1', '2', '3', '4', etc.)
   */
  export const mapearEstadoATipoModal = (cultivo, valorSeleccion) => {
    const cultivoNormalizado = cultivo?.toLowerCase().trim();
    const mapeo = MAPEO_TIPO_MODAL[cultivoNormalizado] || MAPEO_TIPO_MODAL.soja;
    
    const valor = parseInt(valorSeleccion, 10);
    
    // Buscar en qué rango cae el valor
    for (const rango of mapeo) {
      if (valor >= rango.min && valor <= rango.max) {
        return rango.tipo;
      }
    }
    
    // Por defecto retornar tipo '4' si no encuentra
    return '4';
  };