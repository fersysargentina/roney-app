// utils/fenologicosConfig.js

export const ESTADOS_FENOLOGICOS = {
  soja: [
    { label: "Vc", value: "22" },
    { label: "V1", value: "1" },
    { label: "V2", value: "2" },
    { label: "V3", value: "3" },
    { label: "V4", value: "4" },
    { label: "V5", value: "5" },
    { label: "V6", value: "6" },
    { label: "V7", value: "7" },
    { label: "V8", value: "8" },
    { label: "V9-Vn", value: "9" },
    { label: "R1", value: "10" },
    { label: "R2", value: "11" },
    { label: "R2,5", value: "12" },
    { label: "R3", value: "13" },
    { label: "R3,5", value: "14" },
    { label: "R4", value: "15" },
    { label: "R4,5", value: "16" },
    { label: "R5", value: "17" },
    { label: "R5,5", value: "18" },
    { label: "R6", value: "19" },
    { label: "R6,5", value: "20" },
    { label: "R8", value: "21" }
  ],

  maiz: [
    { label: "V1", value: "1" },
    { label: "V2", value: "2" },
    { label: "V3", value: "3" },
    { label: "V4", value: "4" },
    { label: "V5", value: "5" },
    { label: "V6", value: "6" },
    { label: "V7", value: "7" },
    { label: "V8", value: "8" },
    { label: "V9", value: "9" },
    { label: "V10", value: "10" },
    { label: "V11", value: "11" },
    { label: "V12", value: "12" },
    { label: "V13", value: "13" },
    { label: "V14", value: "14" },
    { label: "V15", value: "15" },
    { label: "Inicio Florac.Fem (R1-)", value: "17" },
    { label: "Flor Fem.Plena Barba Blanca (R1)", value: "18" },
    { label: "Fin Flor Fem. Barba Marrón (R1+)", value: "19" },
    { label: "Ampolla (R2)", value: "20" },
    { label: "Lechoso Temprano (R3)", value: "21" },
    { label: "Lechoso Tardío (R3+)", value: "22" },
    { label: "Pastoso Temprano (R4)", value: "23" },
    { label: "Pastoso Tardío (R4+)", value: "24" },
    { label: "Identación/ Líneas Leche (R5)", value: "25" },
    { label: "Madurez Fisiológica (R6)", value: "26" },
    { label: "Madurez Comercial (R6+)", value: "27" },
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
    { label: "V1", value: "1" },
    { label: "V2", value: "2" },
    { label: "V3", value: "3" },
    { label: "V4", value: "4" },
    { label: "V5", value: "5" },
    { label: "V6", value: "6" },
    { label: "V7", value: "7" },
    { label: "V8", value: "8" },
    { label: "V9", value: "9" },
    { label: "V10", value: "10" },
    { label: "V11", value: "11" },
    { label: "V12", value: "12" },
    { label: "Vn", value: "13" },
    { label: "R1 (estrella)", value: "14" },
    { label: "R2 (botón a 0,5 - 2 cm)", value: "15" },
    { label: "R3 (botón a + de 2 cm)", value: "16" },
    { label: "R4 (apertura inflorescencia)", value: "17" },
    { label: "R5 (inicio floración)", value: "18" },
    { label: "R6 (fin floración)", value: "19" },
    { label: "R7 (envés capítulo inicio amarilleo)", value: "20" },
    { label: "R8 (envés capítulo amarillo)", value: "21" },
    { label: "R9 (brácteas amarillo/marrón)", value: "22" },
  ]
};

/**
 * Normaliza el nombre del cultivo a las claves base del sistema: 'soja', 'maiz', 'trigo', 'girasol'
 */
export const normalizarCultivo = (cultivo) => {
  const c = cultivo?.toLowerCase().trim() || '';
  if (c.includes('soja') || c.includes('sija')) return 'soja';
  if (c.includes('maiz') || c.includes('maíz')) return 'maiz';
  if (c.includes('trigo') || c.includes('cebada') || c.includes('avena') || c.includes('centeno')) return 'trigo';
  if (c.includes('girasol')) return 'girasol';
  return 'soja';
};

/**
 * Obtiene los estados fenológicos según el tipo de cultivo
 * @param {string} cultivo - Tipo de cultivo (soja, maiz, trigo, girasol, etc.)
 * @returns {Array} Array de objetos con label y value
 */
export const obtenerEstadosFenologicos = (cultivo) => {
  const cultivoNormalizado = normalizarCultivo(cultivo);
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
    { min: 1, max: 9, tipo: '1' },    // V1, Vc, V2, V3, V4, V5, V6, V7, V8, V9-Vn
    { min: 22, max: 22, tipo: '1' },  // Vc (equivale a V1)
    { min: 10, max: 14, tipo: '2' },  // R1, R2, R2,5, R3, R3,5
    { min: 15, max: 20, tipo: '3' },  // R4, R4,5, R5, R5,5, R6, R6,5
    { min: 21, max: 99, tipo: '4' }   // R8 en adelante
  ],

  maiz: [
    { min: 1, max: 8, tipo: '1' },   // V1-V8 (3 campos: Nacidas, Remanentes, % defoliacion)
    { min: 9, max: 15, tipo: '2' },  // V9-V15 (6 campos)
    { min: 17, max: 27, tipo: '2' }, // R1- a R6+ (mismo modal y cálculo que V9-V15)
  ],

  trigo: [
    { min: 1, max: 99, tipo: 'trigo' }
  ],

  girasol: [
    { min: 1, max: 13, tipo: '1' },    // V1-V12, Vn (todos vegetativos)
    { min: 14, max: 22, tipo: '2' },   // R1-R9 (reproductivos)
  ]
};

/**
 * Mapea un valor de estado fenológico al tipo de modal correspondiente
 * @param {string} cultivo - Tipo de cultivo
 * @param {string} valorSeleccion - Valor del estado fenológico seleccionado
 * @returns {string} Tipo de modal ('1', '2', '3', '4', etc.)
 */
export const mapearEstadoATipoModal = (cultivo, valorSeleccion) => {
  const cultivoNormalizado = normalizarCultivo(cultivo);
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