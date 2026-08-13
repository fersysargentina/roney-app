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
} from './tablas';

/**
 * Parsea y sanitiza valores numéricos ingresados por el usuario.
 * Maneja comas decimales (ej. "2,5" -> 2.5), cadenas vacías y NaN.
 * @param {any} val - Valor a parsear
 * @returns {number} Número válido o 0
 */
export function parseInputNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(',', '.').trim();
  if (!str) return 0;
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

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

    let resultado = 0;

    // Routing por tipo de cultivo
    switch (cultivoNormalizado) {
      case 'trigo':
        resultado = calcularDañoTrigo(datos, fenologico);
        break;
      
      case 'girasol':
        resultado = calcularDañoGirasol(datos, fenologico);
        break;
      
      case 'maiz':
        resultado = calcularDañoMaiz(datos, fenologico);
        break;
      
      case 'soja':
      default:
        resultado = calcularDañoSoja(datos, fenologico);
        break;
    }

    const numResultado = parseInputNumber(resultado);
    return Math.min(100, Math.max(0, numResultado));

  } catch (error) {
    console.error('❌ Error en calculoDeDaño:', error);
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
 */
function calcularDañoVegetativo(datos, fenologicoLabel) {
  const d1 = parseInputNumber(datos?.dato_1);
  const d2 = parseInputNumber(datos?.dato_2);
  const d3 = parseInputNumber(datos?.dato_3); // nudos perdidos
  const d4 = parseInputNumber(datos?.dato_4); // defoliación

  const totalD = d1 + d2;
  const porcePlantasPerdidas = totalD > 0 ? (d1 / totalD) * 100 : 0;

  // Coeficientes de tablas
  let coefi, coefi2, coefi3;
  
  if (fenologicoLabel === 'v1-v5') {
    coefi = danPorReduccion?.['v1-v5']?.dan || {};
    coefi2 = danPorNudos?.['v1-v5']?.dan || {};
    coefi3 = danPorDesfo?.['v1-v5']?.dan || {};
  } else if (fenologicoLabel === 'v6-v8') {
    coefi = danPorReduccion?.['v6-v8']?.dan || {};
    coefi2 = danPorNudos?.['v6-v8']?.dan || {};
    coefi3 = danPorDesfo?.['v6-v8']?.dan || {};
  } else {
    coefi = danPorReduccion?.['v9-vn']?.dan || {};
    coefi2 = danPorNudos?.['v9-vn']?.dan || {};
    coefi3 = danPorDesfo?.['v9-vn']?.dan || {};
  }

  // Cálculo por reducción de plantas
  const indiceA = Math.max(0, Math.min(100, Math.floor(porcePlantasPerdidas)));
  const porcentajeA = parseInputNumber(coefi?.[indiceA] ?? 0);
  const cpr = Math.max(0, 100 - porcentajeA);

  // Cálculo por nudos perdidos
  const indiceC = Math.max(0, Math.min(100, Math.floor(d3)));
  const porcentajeC = parseInputNumber(coefi2?.[indiceC] ?? 0);
  const porcentajeE = (porcentajeC * cpr) / 100;

  // Cálculo por defoliación
  const cprf = Math.max(0, 100 - porcentajeA - porcentajeE);
  const indiceD = Math.max(0, Math.min(100, Math.floor(d4)));
  const porcentajeD = parseInputNumber(coefi3?.[indiceD] ?? 0);
  const porcentajeG = (porcentajeD * cprf) / 100;

  const porcentaje = porcentajeG + porcentajeE + porcentajeA;
  
  console.log('📊 Cálculo V (SOJA):', {
    porcePlantasPerdidas: porcentajeA,
    porNudos: porcentajeE,
    porDefoliacion: porcentajeG,
    total: porcentaje
  });

  return parseFloat(porcentaje.toFixed(1));
}

/**
 * Cálculo para estados reproductivos R1-R3.5 de SOJA
 */
function calcularDañoReproductivo(datos, fenologicoLabel) {
  const d1 = parseInputNumber(datos?.dato_1);
  const d2 = parseInputNumber(datos?.dato_2);
  const d3 = parseInputNumber(datos?.dato_3);
  const d4 = parseInputNumber(datos?.dato_4);
  const d5 = parseInputNumber(datos?.dato_5);
  const d6 = parseInputNumber(datos?.dato_6);
  const d7 = parseInputNumber(datos?.dato_7);
  const d8 = parseInputNumber(datos?.dato_8);
  const d9 = parseInputNumber(datos?.dato_9);

  const totalD = d1 + d2;
  const danA = totalD > 0 ? (d1 / totalD) * 100 : 0;
  const cpr = Math.max(0, 100 - danA);

  const nudosRemanentes = [d4, d5, d6, d7, d8].filter(n => n > 0);
  const promedioNudosRemanentes = nudosRemanentes.length > 0 
      ? nudosRemanentes.reduce((a, b) => a + b, 0) / nudosRemanentes.length 
      : 0;

  const porcentajeNudosPerdidos = d3 > 0 ? Math.max(0, (100 - ((promedioNudosRemanentes / d3) * 100))) : 0;
  const indiceNudos = Math.max(0, Math.min(100, Math.round(porcentajeNudosPerdidos)));

  let coefi4 = {};
  let coefi5 = {};

  if (['r1-r2', 'r2.5', 'r3', 'r3.5'].includes(fenologicoLabel)) {
      coefi4 = danPorNudosR1?.[fenologicoLabel]?.dan || {};
      coefi5 = danPorDesfoR1?.[fenologicoLabel]?.dan || {};
  }

  const danC = parseInputNumber(coefi4?.[indiceNudos] ?? 0);
  const danNetoE = (danC * cpr) / 100;
  
  const cprF = Math.max(0, 100 - danA - danNetoE);
  const indiceDefoliacion = Math.max(0, Math.min(100, Math.round(d9)));
  const danG = parseInputNumber(coefi5?.[indiceDefoliacion] ?? 0);
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

  return parseFloat(porcentaje.toFixed(1));
}

/**
 * Cálculo para estados R4-R6.5 de SOJA
 */
function calcularReproductivo47(datos, fenologicoLabel) {
  const d1 = parseInputNumber(datos?.dato_1);
  const d2 = parseInputNumber(datos?.dato_2);
  const d3 = parseInputNumber(datos?.dato_3);
  const d4 = parseInputNumber(datos?.dato_4);
  const d5 = parseInputNumber(datos?.dato_5);
  const d6 = parseInputNumber(datos?.dato_6);
  const d7 = parseInputNumber(datos?.dato_7);
  const d8 = parseInputNumber(datos?.dato_8);
  const d9 = parseInputNumber(datos?.dato_9);
  const d10 = parseInputNumber(datos?.dato_10);
  const d11 = parseInputNumber(datos?.dato_11);
  const d12 = parseInputNumber(datos?.dato_12);

  const vainasTotales = d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8 + d9 + d10 + d11;
  const vainasDañadas = d1 + d2 + d4 + d6 + d8 + d10;
  const danA = vainasTotales > 0 ? (vainasDañadas / vainasTotales) * 100 : 0;
  const cprb = Math.max(0, 100 - danA);

  const idxDef = Math.max(0, Math.min(100, Math.round(d12)));
  const indiceDefoliacion = String(idxDef);

  let coefiDefoliacion = {};
  const fenologicosR4 = ['r4', 'r4.5', 'r5', 'r6', 'r6.5'];
  
  if (fenologicosR4.includes(fenologicoLabel)) {
      coefiDefoliacion = danPorDesfoR4?.[fenologicoLabel]?.dan || {};
  }

  const danG = idxDef !== 0 
      ? parseInputNumber(coefiDefoliacion?.[indiceDefoliacion] ?? 0) 
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

  return parseFloat(porcentaje.toFixed(1));
}

/**
 * Cálculo para estados avanzados R8 de SOJA
 */
function calcularDañoAvanzado(datos, fenologicoLabel) {
  const d1 = parseInputNumber(datos?.dato_1);
  const d2 = parseInputNumber(datos?.dato_2);
  const d3 = parseInputNumber(datos?.dato_3);
  const d4 = parseInputNumber(datos?.dato_4);
  const d5 = parseInputNumber(datos?.dato_5);
  const d6 = parseInputNumber(datos?.dato_6);
  const d7 = parseInputNumber(datos?.dato_7);
  const d8 = parseInputNumber(datos?.dato_8);
  const d9 = parseInputNumber(datos?.dato_9);
  const d10 = parseInputNumber(datos?.dato_10);
  const d11 = parseInputNumber(datos?.dato_11);
  const d12 = parseInputNumber(datos?.dato_12);
  const d13 = parseInputNumber(datos?.dato_13);
  const d14 = parseInputNumber(datos?.dato_14);
  const d15 = parseInputNumber(datos?.dato_15);
  const d16 = parseInputNumber(datos?.dato_16);
  const d17 = parseInputNumber(datos?.dato_17);
  const d18 = parseInputNumber(datos?.dato_18);
  const d19 = parseInputNumber(datos?.dato_19);
  const d20 = parseInputNumber(datos?.dato_20);
  const d21 = parseInputNumber(datos?.dato_21);

  const condicionSuma = d1 + d2 + d3;
  if (condicionSuma <= 0) {
      return 0; // ✅ Corregido de "" a 0
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
  
  let fenologicoLabel = 'Espigamiento (Z.50/59)';
  
  if (!isNaN(fenologicoNum)) {
    switch (fenologicoNum) {
      case 1: fenologicoLabel = 'Espigamiento (Z.50/59)'; break;
      case 2: fenologicoLabel = 'Floración (Z.60/69)'; break;
      case 3: fenologicoLabel = 'Lechoso (Z.70/79)'; break;
      case 4: fenologicoLabel = 'Pastoso blando (Z.80/84)'; break;
      case 5: fenologicoLabel = 'Pastoso duro (Z.85/89)'; break;
      case 6: fenologicoLabel = 'Próx. a mudurez (Z.90/99)'; break;
      default: fenologicoLabel = 'Espigamiento (Z.50/59)';
    }
  }

  console.log('🌾 Calculando daño TRIGO para:', fenologicoLabel);

  const data = {};
  for (let i = 1; i <= 23; i++) {
      data[`d${i}`] = parseInputNumber(datos[`dato_${i}`]);
  }

  const totenD = data.d1 + data.d2 + data.d3;

  let espigasPerdidasA = 0;
  if (totenD > 0) {
    espigasPerdidasA = (data.d1 / totenD) * 100;
  }

  const idxTrigo = Math.max(0, Math.min(100, Math.floor(espigasPerdidasA)));
  const indiceDeTrigo = String(idxTrigo);

  let coefiTrigo = {};
  const fenologicosTrigo = ['Espigamiento (Z.50/59)', 'Floración (Z.60/69)', 'Lechoso (Z.70/79)', 'Pastoso blando (Z.80/84)', 'Pastoso duro (Z.85/89)', 'Próx. a mudurez (Z.90/99)'];

  if (fenologicosTrigo.includes(fenologicoLabel)) {
      coefiTrigo = trigo?.[fenologicoLabel]?.dan || {};
  }

  const danB = idxTrigo !== 0 
      ? parseInputNumber(coefiTrigo?.[indiceDeTrigo] ?? 0) 
      : 0;

  const danC = espigasPerdidasA + danB;

  const numerador = data.d4 + data.d6 + data.d8 + data.d10 + data.d12 + data.d14 + data.d16 + data.d18 + data.d20 + data.d22;
  const denominador = data.d5 + data.d7 + data.d9 + data.d11 + data.d13 + data.d15 + data.d17 + data.d19 + data.d21 + data.d23;

  let danE = 0; // ✅ Inicializado a 0 en lugar de undefined
  if (denominador > 0) {
    danE = (numerador / denominador) * 100;
  }

  const danF = (danE * Math.max(0, 100 - danC)) / 100;
  const danTot = danC + danF;

  console.log('📊 Cálculo TRIGO:', {
      estadoFenologico: fenologicoLabel,
      totenD: totenD.toFixed(2),
      espigasPerdidasPorcentaje: espigasPerdidasA.toFixed(2),
      indiceTabla: indiceDeTrigo,
      danTabla: danB.toFixed(2),
      danE: danE.toFixed(2),
      total: danTot.toFixed(2)
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

  let fenologicoLabel = "V1-V11";

  if (!isNaN(fenologicoNum)) {
    switch (fenologicoNum) {
      case 1: fenologicoLabel = 'V1-V11'; break;
      case 2: fenologicoLabel = 'V12-Vn'; break;
      case 3: fenologicoLabel = 'R1 (estrella)'; break;
      case 4: fenologicoLabel = 'R2 (botón a 0,5 - 2 cm)'; break;
      case 5: fenologicoLabel = 'R3 (botón a + de 2 cm)'; break;
      case 6: fenologicoLabel = 'R4 (apertura inflorescencia)'; break;
      case 7: fenologicoLabel = 'R5 (inicio floración)'; break;
      case 8: fenologicoLabel = 'R6 (fin floración)'; break;
      case 9: fenologicoLabel = 'R7 (envés capítulo inicio amarilleo)'; break;
      case 10: fenologicoLabel = 'R8 (envés capítulo amarillo)'; break;
      case 11: fenologicoLabel = 'R9 (brácteas amarillo/marrón)'; break;
      default: fenologicoLabel = 'V1-V11';
    }
  }

  const data = {};
  for (let i = 1; i <= 5; i++) {
      data[`d${i}`] = parseInputNumber(datos[`dato_${i}`]);
  }

  const totenD = data.d1 + data.d2 + data.d3;

  let plantasPerdidas = totenD > 0 ? (data.d1 / totenD) * 100 : 0;
  let plantasImproduct = totenD > 0 ? (data.d2 / totenD) * 100 : 0;

  const idxGir = Math.max(0, Math.min(100, Math.floor(plantasPerdidas)));
  const indiceGirasol = String(idxGir);

  let coefiGirasol = {};
  const fenologicosGirasol = ['V1-V11', 'V12-Vn', 'R1 (estrella)', 'R2 (botón a 0,5 - 2 cm)', 'R3 (botón a + de 2 cm)', 'R4 (apertura inflorescencia)', 'R5 (inicio floración)', 'R6 (fin floración)','R7 (envés capítulo inicio amarilleo)', 'R8 (envés capítulo amarillo)', 'R9 (brácteas amarillo/marrón)'];

  if (fenologicosGirasol.includes(fenologicoLabel)) {
      coefiGirasol = girasolReduccion?.[fenologicoLabel]?.dan || {};
  }

  let danA = (idxGir !== 0 ? parseInputNumber(coefiGirasol?.[indiceGirasol] ?? 0) : 0) + plantasImproduct;

  const cprB = Math.max(0, 100 - danA);
  const danE = (data.d4 * cprB) / 100;
  const cprF = Math.max(0, 100 - danA - danE);

  const idxDesfo = Math.max(0, Math.min(100, Math.floor(data.d5)));
  const indiceGirasolDesfo = String(idxDesfo);
  let coefiDesfoGirasol = {};
  
  if (fenologicosGirasol.includes(fenologicoLabel)) {
    coefiDesfoGirasol = girasolDesfo?.[fenologicoLabel]?.dan || {};
  }

  let danG = idxDesfo !== 0 
      ? parseInputNumber(coefiDesfoGirasol?.[indiceGirasolDesfo] ?? 0) 
      : 0;

  const danH = (danG * cprF) / 100;
  const danTot = danA + danE + danH;

  return parseFloat(danTot.toFixed(1));
}

/**
 * ============================================================================
 * CÁLCULO DE DAÑO PARA MAÍZ
 * ============================================================================
 */
function calcularDañoMaiz(datos, fenologico) {
  const fenologicoNum = parseInt(fenologico, 10);
  
  console.log('🌽 Calculando daño MAÍZ para estado:', fenologicoNum);

  if (fenologicoNum >= 1 && fenologicoNum <= 6) {
    return calcularDañoMaizVegetativo(datos, fenologicoNum);
  } else if (fenologicoNum >= 7 && fenologicoNum <= 12) {
    return calcularDañoMaizReproductivo(datos, fenologicoNum);
  }
  
  return 0;
}

function calcularDañoMaizVegetativo(datos, fenologicoNum) {
  return 0;
}

function calcularDañoMaizReproductivo(datos, fenologicoNum) {
  return 0;
}

export function getSubFenologicosPorTipo(fenologico) {
  return [];
}

export function existeSubFenologico(fenologico, subFenologico) {
  return false;
}

export function getPrimerSubFenologico(fenologico) {
  return 'sub1';
}