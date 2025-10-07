// Configuración de subFenológicos por tipo fenológico
export const SUBFENOLOGICOS_POR_TIPO = {
    '1': [
      { label: 'Emergencia', value: 'sub1' },
      { label: 'Desarrollo vegetativo', value: 'sub2' },
      { label: 'Floración', value: 'sub3' },
      { label: 'Llenado de grano', value: 'sub4' }
    ],
    '2': [
      { label: 'Germinación', value: 'sub1' },
      { label: 'Crecimiento inicial', value: 'sub5' },
      { label: 'Desarrollo foliar', value: 'sub7' },
      { label: 'Maduración', value: 'sub8' }
    ],
    '3': [
      { label: 'Siembra', value: 'sub1' },
      { label: 'Establecimiento', value: 'sub3' },
      { label: 'Crecimiento activo', value: 'sub6' },
      { label: 'Pre-cosecha', value: 'sub9' }
    ],
    '4': [
      { label: 'Plantación', value: 'sub2' },
      { label: 'Desarrollo radicular', value: 'sub4' },
      { label: 'Crecimiento vegetativo', value: 'sub6' },
      { label: 'Fructificación', value: 'sub10' },
      { label: 'Cosecha', value: 'sub11' }
    ]
  };
  
  import { danPorReduccion, danPorNudos, danPorDesfo } from './tablas';
  
  /**
   * Calcula el porcentaje de daño basado en los parámetros de entrada
   * @param {Object} datos - Datos del modal (dato_1, dato_2, dato_3, dato_4)
   * @param {string} fenologico - Valor del Picker ('1','2','3','4','5','6')
   * @param {string|null} subFenologico - No usado actualmente
   * @returns {number} Porcentaje de daño (0-100)
   */
  export function calculoDeDaño(datos, fenologico, subFenologico) {
    try {
      // Cálculos base solicitados
      const d1 = parseFloat(datos?.dato_1) || 0;
      const d2 = parseFloat(datos?.dato_2) || 0;
      const d3 = parseFloat(datos?.dato_3) || 0; // nudos perdidos
      const d4 = parseFloat(datos?.dato_4) || 0; // defoliación
  
      const totalD = d1 + d2;
      const porcePlantasPerdidas = totalD > 0 ? (d1 / totalD) * 100 : 0;
  
      // Mapeo del valor del Picker a etiqueta de tabla
      const fenologicoNum = parseInt(fenologico, 10);
      let fenologicoLabel = 'v9-vn';
      if (!isNaN(fenologicoNum)) {
        if (fenologicoNum === 1) {
          fenologicoLabel = 'v1-v5';
        } else if (fenologicoNum === 2) {
          fenologicoLabel = 'v6-v8';
        } else if (fenologicoNum === 3) {
          fenologicoLabel = 'v9-vn';
        } else {
          // Por ahora, los valores 4,5,6 (R1-R8) usan v9-vn
          fenologicoLabel = 'v9-vn';
        }
        console.log(fenologicoLabel);
      }
  
      // Selección de coeficientes según fenológico
      let coefi;
      if (fenologicoLabel === 'v1-v5') {
        coefi = danPorReduccion['v1-v5'].dan;
      } else if (fenologicoLabel === 'v6-v8') {
        coefi = danPorReduccion['v6-v8'].dan;
      } else {
        coefi = danPorReduccion['v9-vn'].dan;
      }
  
      let coefi2;
      if (fenologicoLabel === 'v1-v5') {
        coefi2 = danPorNudos['v1-v5'].dan;
      } else if (fenologicoLabel === 'v6-v8') {
        coefi2 = danPorNudos['v6-v8'].dan;
      } else {
        coefi2 = danPorNudos['v9-vn'].dan;
      }
  
      let coefi3;
      if (fenologicoLabel === 'v1-v5') {
        coefi3 = danPorDesfo['v1-v5'].dan;
      } else if (fenologicoLabel === 'v6-v8') {
        coefi3 = danPorDesfo['v6-v8'].dan;
      } else {
        coefi3 = danPorDesfo['v9-vn'].dan;
      }
  
      // Índices de tablas
      const indiceA = Math.floor(porcePlantasPerdidas);
      const porcentajeA = parseFloat(coefi?.[indiceA] ?? 0) || 0;
      const cpr = 100 - porcentajeA;
  
      const indiceC = Math.floor(d3);
      const porcentajeC = parseFloat(coefi2?.[indiceC] ?? 0) || 0;
      const porcentajeE = parseFloat(((porcentajeC * cpr) / 100));
  
      const cprf = 100 - porcentajeA - porcentajeE;
      const indiceD = Math.floor(d4);
      const porcentajeD = parseFloat(coefi3?.[indiceD] ?? 0) || 0;
      const porcentajeG = parseFloat(((porcentajeD * cprf) / 100));
  
      const porcentaje = porcentajeG + porcentajeE + porcentajeA;
      return porcentaje.toFixed(1);
  
    } catch (error) {
      console.warn('Error en calculoDeDaño:', error);
      return 0;
    }
  }
  
  /**
   * Obtiene los subFenológicos disponibles para un tipo fenológico
   * @param {string} fenologico - Tipo fenológico ('1', '2', '3', '4')
   * @returns {Array} Array de objetos {label, value}
   */
  export function getSubFenologicosPorTipo(fenologico) {
    return SUBFENOLOGICOS_POR_TIPO[fenologico] || [];
  }
  
  /**
   * Verifica si un subFenológico existe para un tipo fenológico dado
   * @param {string} fenologico - Tipo fenológico
   * @param {string} subFenologico - Subtipo a verificar
   * @returns {boolean} True si existe
   */
  export function existeSubFenologico(fenologico, subFenologico) {
    const subs = getSubFenologicosPorTipo(fenologico);
    return subs.some(sub => sub.value === subFenologico);
  }
  
  /**
   * Obtiene el primer subFenológico disponible para un tipo fenológico
   * @param {string} fenologico - Tipo fenológico
   * @returns {string} Primer subFenológico disponible
   */
  export function getPrimerSubFenologico(fenologico) {
    const subs = getSubFenologicosPorTipo(fenologico);
    return subs.length > 0 ? subs[0].value : 'sub1';
  }