import { 
  danPorReduccion, 
  danPorNudos, 
  danPorDesfo, 
  danPorNudosR1, 
  danPorDesfoR1, 
  danPorDesfoR4, 
  trigo,
  girasolReduccion,
  girasolDesfo
  // maizReduccion, // Descomentar cuando estén disponibles
  // maizDesfo
} from './tablas';

/**
 * Calcula el porcentaje de daño basado en los parámetros de entrada
 * @param {Object} datos - Datos del modal
 * @param {string} fenologico - Valor del Picker ('1'-'13')
 * @param {string} cultivo - Tipo de cultivo ('soja', 'maiz', 'trigo', 'girasol')
 * @returns {number} Porcentaje de daño (0-100)
 */
export function calculoDeDaño(datos, fenologico, cultivo) {
  try {
    const fenologicoNum = parseInt(fenologico, 10);
    const cultivoNormalizado = cultivo?.toLowerCase().trim() || 'soja';

    console.log('🔍 Calculando daño para:', {
      cultivo: cultivoNormalizado,
      fenologico,
      fenologicoNum
    });

    // Routing por tipo de cultivo
    switch (cultivoNormalizado) {
      case 'trigo':
        return calcularDañoTrigo(datos, fenologico);
      
      case 'girasol':
        return calcularDañoGirasol(datos, fenologico);
      
      case 'maiz':
        return calcularDañoMaiz(datos, fenologico);
      
      case 'soja':
      default:
        return calcularDañoSoja(datos, fenologico);
    }

  } catch (error) {
    console.warn('Error en calculoDeDaño:', error);
    return 0;
  }
}

/**
 * ============================================================================
 * CÁLCULO DE DAÑO PARA SOJA
 * ============================================================================
 */
function calcularDañoSoja(datos, fenologico) {
  const fenologicoNum = parseInt(fenologico, 10);
  
  // Mapeo del valor del Picker a etiqueta de tabla
  let fenologicoLabel = 'v9-vn';
  if (!isNaN(fenologicoNum)) {
    if (fenologicoNum === 1) {
      fenologicoLabel = 'v1-v5';
    } else if (fenologicoNum === 2) {
      fenologicoLabel = 'v6-v8';
    } else if (fenologicoNum === 3) {
      fenologicoLabel = 'v9-vn';
    } else if (fenologicoNum === 4) {
      fenologicoLabel = 'r1-r2';
    } else if (fenologicoNum === 5) {
      fenologicoLabel = 'r2.5';
    } else if (fenologicoNum === 6) {
      fenologicoLabel = 'r3';
    } else if (fenologicoNum === 7) {
      fenologicoLabel = 'r3.5';
    } else if (fenologicoNum === 8) {
      fenologicoLabel = 'r4';
    } else if (fenologicoNum === 9) {
      fenologicoLabel = 'r4.5';
    } else if (fenologicoNum === 10) {
      fenologicoLabel = 'r5';
    } else if (fenologicoNum === 11) {
      fenologicoLabel = 'r6';
    } else if (fenologicoNum === 12) {
      fenologicoLabel = 'r6.5';
    } else if (fenologicoNum === 13) {
      fenologicoLabel = 'r8';
    }
  }

  console.log('🌱 Calculando daño SOJA para:', fenologicoLabel);

  // Determinar categoría del estado fenológico
  const esVegetativo = ['v1-v5', 'v6-v8', 'v9-vn'].includes(fenologicoLabel);
  const esReproductivo = ['r1-r2', 'r2.5', 'r3', 'r3.5'].includes(fenologicoLabel);
  const esReproductivo47 = ['r4', 'r4.5', 'r5', 'r6', 'r6.5'].includes(fenologicoLabel);

  if (esVegetativo) {
    return calcularDañoVegetativo(datos, fenologicoLabel);
  } else if (esReproductivo) {
    return calcularDañoReproductivo(datos, fenologicoLabel);
  } else if (esReproductivo47) {
    return calcularReproductivo47(datos, fenologicoLabel);
  } else {
    return calcularDañoAvanzado(datos, fenologicoLabel);
  }
}

/**
 * Cálculo para estados vegetativos V1-VN de SOJA
 * Usa: dato_1 (pérdida en D), dato_2 (restante en D), dato_3 (nudos perdidos), dato_4 (defoliación)
 */
function calcularDañoVegetativo(datos, fenologicoLabel) {
  const d1 = parseFloat(datos?.dato_1) || 0;
  const d2 = parseFloat(datos?.dato_2) || 0;
  const d3 = parseFloat(datos?.dato_3) || 0; // nudos perdidos
  const d4 = parseFloat(datos?.dato_4) || 0; // defoliación

  const totalD = d1 + d2;
  const porcePlantasPerdidas = totalD > 0 ? (d1 / totalD) * 100 : 0;

  // Coeficientes de tablas
  let coefi, coefi2, coefi3;
  
  if (fenologicoLabel === 'v1-v5') {
    coefi = danPorReduccion['v1-v5'].dan;
    coefi2 = danPorNudos['v1-v5'].dan;
    coefi3 = danPorDesfo['v1-v5'].dan;
  } else if (fenologicoLabel === 'v6-v8') {
    coefi = danPorReduccion['v6-v8'].dan;
    coefi2 = danPorNudos['v6-v8'].dan;
    coefi3 = danPorDesfo['v6-v8'].dan;
  } else {
    coefi = danPorReduccion['v9-vn'].dan;
    coefi2 = danPorNudos['v9-vn'].dan;
    coefi3 = danPorDesfo['v9-vn'].dan;
  }

  // Cálculo por reducción de plantas
  const indiceA = Math.floor(porcePlantasPerdidas);
  const porcentajeA = parseFloat(coefi?.[indiceA] ?? 0) || 0;
  const cpr = 100 - porcentajeA;

  // Cálculo por nudos perdidos
  const indiceC = Math.floor(d3);
  const porcentajeC = parseFloat(coefi2?.[indiceC] ?? 0) || 0;
  const porcentajeE = parseFloat(((porcentajeC * cpr) / 100));

  // Cálculo por defoliación
  const cprf = 100 - porcentajeA - porcentajeE;
  const indiceD = Math.floor(d4);
  const porcentajeD = parseFloat(coefi3?.[indiceD] ?? 0) || 0;
  const porcentajeG = parseFloat(((porcentajeD * cprf) / 100));

  const porcentaje = porcentajeG + porcentajeE + porcentajeA;
  
  console.log('📊 Cálculo V (SOJA):', {
    porcePlantasPerdidas: porcentajeA,
    porNudos: porcentajeE,
    porDefoliacion: porcentajeG,
    total: porcentaje
  });

  return porcentaje.toFixed(1);
}

/**
 * Cálculo para estados reproductivos R1-R3.5 de SOJA
 */
function calcularDañoReproductivo(datos, fenologicoLabel) {
  const d1 = parseFloat(datos?.dato_1) || 0;
  const d2 = parseFloat(datos?.dato_2) || 0;
  const d3 = parseFloat(datos?.dato_3) || 0;
  const d4 = parseFloat(datos?.dato_4) || 0;
  const d5 = parseFloat(datos?.dato_5) || 0;
  const d6 = parseFloat(datos?.dato_6) || 0;
  const d7 = parseFloat(datos?.dato_7) || 0;
  const d8 = parseFloat(datos?.dato_8) || 0;
  const d9 = parseFloat(datos?.dato_9) || 0;

  const totalD = d1 + d2;
  const danA = totalD > 0 ? (d1 / totalD) * 100 : 0;
  const cpr = 100 - danA;

  const nudosRemanentes = [d4, d5, d6, d7, d8].filter(n => n > 0);
  const promedioNudosRemanentes = nudosRemanentes.length > 0 
      ? nudosRemanentes.reduce((a, b) => a + b, 0) / nudosRemanentes.length 
      : 0;

  const porcentajeNudosPerdidos = d3 > 0 ? (100 - ((promedioNudosRemanentes / d3) * 100)) : 0;
  const indiceNudos = Math.round(porcentajeNudosPerdidos);

  let coefi4 = {};
  let coefi5 = {};

  if (['r1-r2', 'r2.5', 'r3', 'r3.5'].includes(fenologicoLabel)) {
      coefi4 = danPorNudosR1?.[fenologicoLabel]?.dan || {};
      coefi5 = danPorDesfoR1?.[fenologicoLabel]?.dan || {};
  }

  const danC = parseFloat(coefi4?.[indiceNudos] ?? 0) || 0;
  const danNetoE = (danC * cpr) / 100;
  
  const cprF = 100 - danA - danNetoE;
  const indiceDefoliacion = Math.round(d9);
  const danG = parseFloat(coefi5?.[indiceDefoliacion] ?? 0) || 0;
  const danH = (cprF * danG) / 100;

  const porcentaje = danA + danNetoE + danH;

  console.log('📊 Cálculo R (SOJA):', {
      porcePlantasPerdidas: danA,
      danC,
      danNetoE,
      danG,
      danH,
      total: porcentaje
  });

  return porcentaje.toFixed(1);
}

/**
 * Cálculo para estados R4-R6.5 de SOJA
 */
function calcularReproductivo47(datos, fenologicoLabel) {
  const d1 = parseFloat(datos?.dato_1) || 0;
  const d2 = parseFloat(datos?.dato_2) || 0;
  const d3 = parseFloat(datos?.dato_3) || 0;
  const d4 = parseFloat(datos?.dato_4) || 0;
  const d5 = parseFloat(datos?.dato_5) || 0;
  const d6 = parseFloat(datos?.dato_6) || 0;
  const d7 = parseFloat(datos?.dato_7) || 0;
  const d8 = parseFloat(datos?.dato_8) || 0;
  const d9 = parseFloat(datos?.dato_9) || 0;
  const d10 = parseFloat(datos?.dato_10) || 0;
  const d11 = parseFloat(datos?.dato_11) || 0;
  const d12 = parseFloat(datos?.dato_12) || 0;

  const vainasTotales = d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8 + d9 + d10 + d11;
  const vainasDañadas = d1 + d2 + d4 + d6 + d8 + d10;
  const danA = vainasTotales > 0 ? (vainasDañadas / vainasTotales) * 100 : 0;
  const cprb = 100 - danA;

  const indiceDefoliacion = String(Math.round(d12));

  let coefiDefoliacion = {};
  const fenologicosR4 = ['r4', 'r4.5', 'r5', 'r6', 'r6.5'];
  
  if (fenologicosR4.includes(fenologicoLabel)) {
      coefiDefoliacion = danPorDesfoR4?.[fenologicoLabel]?.dan || {};
  }

  const danG = indiceDefoliacion !== '0' 
      ? parseFloat(coefiDefoliacion?.[indiceDefoliacion] ?? 0) 
      : 0;

  const danNetoD = (cprb * danG) / 100;
  const porcentaje = danNetoD + danA;

  console.log('📊 Cálculo R4-R7 (SOJA):', {
      dañoVainasAbiertas: danA.toFixed(1),
      cprRemanente: cprb.toFixed(1),
      indiceDefoliacion,
      danG_Tabla: danG.toFixed(1),
      danNetoH: danNetoD.toFixed(1),
      total: porcentaje.toFixed(1)
  });

  return porcentaje.toFixed(1);
}

/**
 * Cálculo para estados avanzados R8 de SOJA
 */
function calcularDañoAvanzado(datos, fenologicoLabel) {
  const d1 = parseFloat(datos?.dato_1) || 0;
  const d2 = parseFloat(datos?.dato_2) || 0;
  const d3 = parseFloat(datos?.dato_3) || 0;
  const d4 = parseFloat(datos?.dato_4) || 0;
  const d5 = parseFloat(datos?.dato_5) || 0;
  const d6 = parseFloat(datos?.dato_6) || 0;
  const d7 = parseFloat(datos?.dato_7) || 0;
  const d8 = parseFloat(datos?.dato_8) || 0;
  const d9 = parseFloat(datos?.dato_9) || 0;
  const d10 = parseFloat(datos?.dato_10) || 0;
  const d11 = parseFloat(datos?.dato_11) || 0;
  const d12 = parseFloat(datos?.dato_12) || 0;
  const d13 = parseFloat(datos?.dato_13) || 0;
  const d14 = parseFloat(datos?.dato_14) || 0;
  const d15 = parseFloat(datos?.dato_15) || 0;
  const d16 = parseFloat(datos?.dato_16) || 0;
  const d17 = parseFloat(datos?.dato_17) || 0;
  const d18 = parseFloat(datos?.dato_18) || 0;
  const d19 = parseFloat(datos?.dato_19) || 0;
  const d20 = parseFloat(datos?.dato_20) || 0;
  const d21 = parseFloat(datos?.dato_21) || 0;

  const condicionSuma = d1 + d2 + d3;
  if (condicionSuma <= 0) {
      return "";
  }

  const numerador = d1 + d2 + d4 + d6 + d8 + d10 + d12 + d14 + d16 + d18 + d20;
  const denominador = numerador + d3 + d5 + d7 + d9 + d11 + d13 + d15 + d17 + d19 + d21;
  
  if (denominador === 0) {
      return 0;
  }

  const resultado = (numerador / denominador) * 100;
  return parseFloat(resultado.toFixed(1));
}

/**
 * ============================================================================
 * CÁLCULO DE DAÑO PARA TRIGO
 * ============================================================================
 */
function calcularDañoTrigo(datos, estadoFenologico) {
  const fenologicoNum = parseInt(estadoFenologico, 10);
  
  // Mapeo de estados fenológicos de trigo
  let fenologicoLabel = 'Espigamiento (Z.50/59)'; // Default
  
  if (!isNaN(fenologicoNum)) {
    switch (fenologicoNum) {
      case 1:
        fenologicoLabel = 'Espigamiento (Z.50/59)'; // Espigamiento
        break;
      case 2:
        fenologicoLabel = 'Floración (Z.60/69)'; // Floración
        break;
      case 3:
        fenologicoLabel = 'Lechoso (Z.70/79)'; // Lechoso
        break;
      case 4:
        fenologicoLabel = 'Pastoso blando (Z.80/84)'; // Pastoso blando
        break;
      case 5:
        fenologicoLabel = 'Pastoso duro (Z.85/89)'; // Pastoso duro
        break;
      case 6:
        fenologicoLabel = 'Próx. a mudurez (Z.90/99)'; // Próx. a madurez
        break;
      default:
        fenologicoLabel = 'Espigamiento (Z.50/59)';
    }
  }

  console.log('🌾 Calculando daño TRIGO para:', fenologicoLabel);

// Extraer todos los datos (dato_1 a dato_23)
const data = {};
for (let i = 1; i <= 23; i++) {
    data[`d${i}`] = parseFloat(datos[`dato_${i}`]) || 0;
}

// Cálculo de espigas perdidas
const totenD = data.d1 + data.d2 + data.d3;

let espigasPerdidasA = 0;
if (totenD !== 0) {
  espigasPerdidasA = (data.d1 / totenD) * 100;
}

// Convertir a índice para buscar en la tabla
const indiceDeTrigo = String(Math.floor(espigasPerdidasA));

// Obtener coeficientes de la tabla de trigo (similar a danPorDesfoR4)
// Asumiendo que tienes una tabla 'trigo' importada que tiene esta estructura:
// trigo = { 'z50-z59': { dan: { '0': 0, '1': 0.5, '2': 1.0, ... } }, ... }
let coefiTrigo = {};

// Lista de todos los estados fenológicos de trigo
const fenologicosTrigo = ['Espigamiento (Z.50/59)', 'Floración (Z.60/69)', 'Lechoso (Z.70/79)', 'Pastoso blando (Z.80/84)', 'Pastoso duro (Z.85/89)', 'Próx. a mudurez (Z.90/99)'];

if (fenologicosTrigo.includes(fenologicoLabel)) {
    coefiTrigo = trigo?.[fenologicoLabel]?.dan || {};
}

// Obtener el daño de la tabla usando el índice
const danB = indiceDeTrigo !== '0' 
    ? parseFloat(coefiTrigo?.[indiceDeTrigo] ?? 0) 
    : 0;

const danC = espigasPerdidasA + danB;
// El resultado es el daño obtenido de la tabla
const resultado = danB;

const numerador = data.d4 + data.d6 + data.d8 + data.d10 + data.d12 + data.d14 + data.d16 + data.d18 + data.d20 + data.d22;
const denominador = data.d5 + data.d7 + data.d9 + data.d11 + data.d13 + data.d15 + data.d17 + data.d19 + data.d21 + data.d23;

let danE;
if (denominador!= 0){
  danE = (numerador/denominador)*100;
}

const danF = danE*(100-danC)/100
const danTot = danC + danF;

console.log('📊 Cálculo TRIGO:', {
    estadoFenologico: fenologicoLabel,
    totenD: totenD.toFixed(2),
    espigasPerdidasPorcentaje: espigasPerdidasA.toFixed(2),
    indiceTabla: indiceDeTrigo,
    danTabla: danB.toFixed(2),
    resultado: resultado
});

return parseFloat(danTot.toFixed(1));
}


/**
 * ============================================================================
 * CÁLCULO DE DAÑO PARA GIRASOL
 * ============================================================================
 */
function calcularDañoGirasol(datos, fenologico) {
  const fenologicoNum = parseInt(fenologico, 10);
  
  console.log('🌻 Calculando daño GIRASOL para estado:', fenologicoNum);

  // Mapeo de estados fenológicos de girasol
  // 1: V1-V11, 2: V12-Vn, 3: R1, 4: R2, 5: R3, 6: R4, 7: R5, 8: R6, 9: R7, 10: R8, 11: R9
  
  let fenologicoLabel = '';
  
  if (fenologicoNum >= 1 && fenologicoNum <= 2) {
    // Estados vegetativos V1-Vn
    fenologicoLabel = fenologicoNum === 1 ? 'v1-v11' : 'v12-vn';
    return calcularDañoGirasolVegetativo(datos, fenologicoLabel);
  } else if (fenologicoNum >= 3 && fenologicoNum <= 11) {
    // Estados reproductivos R1-R9
    const estadosR = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9'];
    fenologicoLabel = estadosR[fenologicoNum - 3];
    return calcularDañoGirasolReproductivo(datos, fenologicoLabel);
  }
  
  return 0;
}

/**
 * Cálculo para estados vegetativos de GIRASOL (V1-Vn)
 */
function calcularDañoGirasolVegetativo(datos, fenologicoLabel) {
  const d1 = parseFloat(datos?.dato_1) || 0; // Pérdida en D
  const d2 = parseFloat(datos?.dato_2) || 0; // Restante en D
  const d3 = parseFloat(datos?.dato_3) || 0; // Defoliación %

  const totalD = d1 + d2;
  const porcePlantasPerdidas = totalD > 0 ? (d1 / totalD) * 100 : 0;

  // Coeficientes de tablas de girasol
  const coefiReduccion = girasolReduccion?.[fenologicoLabel]?.dan || {};
  const coefiDesfo = girasolDesfo?.[fenologicoLabel]?.dan || {};

  // Cálculo por reducción de plantas
  const indiceReduccion = Math.floor(porcePlantasPerdidas);
  const danReduccion = parseFloat(coefiReduccion?.[indiceReduccion] ?? 0) || 0;
  const cpr = 100 - danReduccion;

  // Cálculo por defoliación
  const indiceDefoliacion = Math.floor(d3);
  const danDesfo = parseFloat(coefiDesfo?.[indiceDefoliacion] ?? 0) || 0;
  const danNetoDesfo = (danDesfo * cpr) / 100;

  const porcentaje = danReduccion + danNetoDesfo;

  console.log('📊 Cálculo V (GIRASOL):', {
    fenologico: fenologicoLabel,
    porcePlantasPerdidas: danReduccion,
    porDefoliacion: danNetoDesfo,
    total: porcentaje
  });

  return porcentaje.toFixed(1);
}

/**
 * Cálculo para estados reproductivos de GIRASOL (R1-R9)
 */
function calcularDañoGirasolReproductivo(datos, fenologicoLabel) {
  // TODO: Implementar lógica específica para estados reproductivos de girasol
  // Similar a soja pero con las tablas y lógica específicas de girasol
  
  const d1 = parseFloat(datos?.dato_1) || 0;
  const d2 = parseFloat(datos?.dato_2) || 0;
  const d3 = parseFloat(datos?.dato_3) || 0;

  console.log('📊 Cálculo R (GIRASOL):', {
    fenologico: fenologicoLabel,
    mensaje: 'Implementación pendiente según tablas específicas'
  });

  // Implementación temporal - ajustar según tus tablas reales
  return 0;
}

/**
 * ============================================================================
 * CÁLCULO DE DAÑO PARA MAÍZ
 * ============================================================================
 */
function calcularDañoMaiz(datos, fenologico) {
  const fenologicoNum = parseInt(fenologico, 10);
  
  console.log('🌽 Calculando daño MAÍZ para estado:', fenologicoNum);

  // Mapeo de estados fenológicos de maíz
  // 1: V1-V4, 2: V5, 3: V6, 4: V7, 5: V8, 6: V13-VT, 7: R1, 8: R2, 9: R3, 10: R4, 11: R5, 12: R6
  
  if (fenologicoNum >= 1 && fenologicoNum <= 6) {
    // Estados vegetativos
    return calcularDañoMaizVegetativo(datos, fenologicoNum);
  } else if (fenologicoNum >= 7 && fenologicoNum <= 12) {
    // Estados reproductivos
    return calcularDañoMaizReproductivo(datos, fenologicoNum);
  }
  
  return 0;
}

/**
 * Cálculo para estados vegetativos de MAÍZ
 */
function calcularDañoMaizVegetativo(datos, fenologicoNum) {
  // TODO: Implementar cuando tengas las tablas maizReduccion y maizDesfo
  
  const d1 = parseFloat(datos?.dato_1) || 0;
  const d2 = parseFloat(datos?.dato_2) || 0;
  const d3 = parseFloat(datos?.dato_3) || 0;

  console.log('📊 Cálculo V (MAÍZ):', {
    fenologico: fenologicoNum,
    mensaje: 'Pendiente: tablas maizReduccion y maizDesfo'
  });

  // Implementación temporal
  return 0;
}

/**
 * Cálculo para estados reproductivos de MAÍZ
 */
function calcularDañoMaizReproductivo(datos, fenologicoNum) {
  // TODO: Implementar cuando tengas las tablas específicas de maíz
  
  const d1 = parseFloat(datos?.dato_1) || 0;
  const d2 = parseFloat(datos?.dato_2) || 0;

  console.log('📊 Cálculo R (MAÍZ):', {
    fenologico: fenologicoNum,
    mensaje: 'Pendiente: tablas específicas de maíz reproductivo'
  });

  // Implementación temporal
  return 0;
}

/**
 * ============================================================================
 * FUNCIONES AUXILIARES (mantener compatibilidad)
 * ============================================================================
 */

/**
 * Obtiene los subFenológicos disponibles para un tipo fenológico
 * @deprecated Esta función puede no ser necesaria con el nuevo sistema
 */
export function getSubFenologicosPorTipo(fenologico) {
  return [];
}

/**
 * Verifica si un subFenológico existe para un tipo fenológico dado
 * @deprecated Esta función puede no ser necesaria con el nuevo sistema
 */
export function existeSubFenologico(fenologico, subFenologico) {
  return false;
}

/**
 * Obtiene el primer subFenológico disponible para un tipo fenológico
 * @deprecated Esta función puede no ser necesaria con el nuevo sistema
 */
export function getPrimerSubFenologico(fenologico) {
  return 'sub1';
}