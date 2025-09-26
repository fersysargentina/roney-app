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
  
  /**
   * Calcula el porcentaje de daño basado en los parámetros de entrada
   * @param {Object} datos - Datos del modal (dato_1, dato_2, dato_3, dato_4)
   * @param {string} fenologico - Tipo fenológico ('1', '2', '3', '4')
   * @param {string} subFenologico - Subtipo fenológico ('sub1', 'sub2', etc.)
   * @returns {number} Porcentaje de daño (0-100)
   */
  export function calculoDeDaño(datos, fenologico, subFenologico) {
    try {
      // Por ahora, generar un número aleatorio basado en los parámetros
      // Esta función se puede modificar en el futuro con la lógica real
      
      // Usar los parámetros como semilla para generar un número "determinista"
      const semilla = generarSemilla(datos, fenologico, subFenologico);
      
      // Generar un porcentaje entre 5% y 35% basado en la semilla
      const porcentaje = 5 + (semilla % 31); // 31 para tener rango de 0-30, + 5 = 5-35
      
      // Redondear a 1 decimal
      return Math.round(porcentaje * 10) / 10;
      
    } catch (error) {
      console.warn('Error en calculoDeDaño:', error);
      // Valor por defecto en caso de error
      return Math.round((Math.random() * 30 + 5) * 10) / 10;
    }
  }
  
  /**
   * Genera una semilla numérica basada en los parámetros de entrada
   * para hacer que el cálculo sea "determinista" con los mismos datos
   * @param {Object} datos - Datos del modal
   * @param {string} fenologico - Tipo fenológico
   * @param {string} subFenologico - Subtipo fenológico
   * @returns {number} Semilla numérica
   */
  function generarSemilla(datos, fenologico, subFenologico) {
    // Convertir todos los valores a string y concatenar
    const datosString = Object.values(datos || {}).join('');
    const parametrosString = `${fenologico}_${subFenologico}_${datosString}`;
    
    // Generar hash simple de la string
    let hash = 0;
    for (let i = 0; i < parametrosString.length; i++) {
      const char = parametrosString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a entero de 32 bits
    }
    
    // Asegurar que sea positivo
    return Math.abs(hash);
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