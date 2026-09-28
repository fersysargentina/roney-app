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
 * @param {string} fenologico - Valor del Picker (soja: '1'-'21', otros: según su config)
 * @param {string} cultivo - Tipo de cultivo ('soja', 'maiz', 'trigo', 'girasol')
 * @returns {number} Porcentaje de daño (0-100)
 */
export function calculoDeDaño(datos, fenologico, cultivo) {
  try {
    const fenologicoNum = parseInt(fenologico, 10);
    const rawCultivo = cultivo?.toLowerCase().trim() || '';
    let cultivoNormalizado = 'soja';
    if (rawCultivo.includes('soja') || rawCultivo.includes('sija')) cultivoNormalizado = 'soja';
    else if (rawCultivo.includes('maiz') || rawCultivo.includes('maíz')) cultivoNormalizado = 'maiz';
    else if (rawCultivo.includes('trigo') || rawCultivo.includes('cebada') || rawCultivo.includes('avena') || rawCultivo.includes('centeno')) cultivoNormalizado = 'trigo';
    else if (rawCultivo.includes('girasol')) cultivoNormalizado = 'girasol';

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

  // Mapeo del valor del Picker (1-21) a etiqueta de tabla de cálculo
  // Agrupaciones:
  // Tipo 1 (Modal 1): 1-9  → V1, V2, V3, V4, V5, V6, V7, V8, V9-Vn
  //   Cálculo: v1-v5 (1-5), v6-v8 (6-8), v9-vn (9)
  // Tipo 2 (Modal 2): 10-14 → R1, R2, R2,5, R3, R3,5
  //   Cálculo: r1-r2 (10-11), r2.5 (12), r3 (13), r3.5 (14)
  // Tipo 3 (Modal 3): 15-20 → R4, R4,5, R5, R5,5, R6, R6,5
  //   Cálculo: r4 (15), r4.5 (16), r5 (17-18), r6 (19), r6.5 (20)
  // Tipo 4 (Modal 4): 21 → R8
  //   Cálculo: r8 (21)
  let fenologicoLabel = 'v9-vn';
  if (!isNaN(fenologicoNum)) {
    if (fenologicoNum >= 1 && fenologicoNum <= 5) {
      fenologicoLabel = 'v1-v5';           // V1, V2, V3, V4, V5
    } else if (fenologicoNum >= 6 && fenologicoNum <= 8) {
      fenologicoLabel = 'v6-v8';           // V6, V7, V8
    } else if (fenologicoNum === 9) {
      fenologicoLabel = 'v9-vn';           // V9-Vn
    } else if (fenologicoNum >= 10 && fenologicoNum <= 11) {
      fenologicoLabel = 'r1-r2';           // R1, R2
    } else if (fenologicoNum === 12) {
      fenologicoLabel = 'r2.5';            // R2,5
    } else if (fenologicoNum === 13) {
      fenologicoLabel = 'r3';              // R3
    } else if (fenologicoNum === 14) {
      fenologicoLabel = 'r3.5';            // R3,5
    } else if (fenologicoNum === 15) {
      fenologicoLabel = 'r4';              // R4
    } else if (fenologicoNum === 16) {
      fenologicoLabel = 'r4.5';            // R4,5
    } else if (fenologicoNum >= 17 && fenologicoNum <= 18) {
      fenologicoLabel = 'r5';              // R5, R5,5
    } else if (fenologicoNum === 19) {
      fenologicoLabel = 'r6';              // R6
    } else if (fenologicoNum === 20) {
      fenologicoLabel = 'r6.5';            // R6,5
    } else if (fenologicoNum === 21) {
      fenologicoLabel = 'r8';              // R8
    } else if (fenologicoNum === 22) {
      fenologicoLabel = 'v1-v5';           // Vc (equivale a V1)
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
 * Tabla nueva:
 * Nacidas en D, Remanentes en D, Perdidas = Nacidas - Remanentes
 * A = % DAÑO por tabla danPorReduccion basado en % perdidas
 * B = C.P.R. = 100 - A
 * C = % DAÑO por tabla danPorNudos (nudos perdidos)
 * E = % DAÑO NETO nudos = (C * B) / 100
 * F = C.P.R. = 100 - A - E
 * G = % DAÑO por tabla danPorDesfo (defoliación)
 * H = % DAÑO NETO defoliación = (G * F) / 100
 * TOTAL = A + E + H
 */
function calcularDañoVegetativo(datos, fenologicoLabel) {
  const nacidas = parseInputNumber(datos?.dato_1);      // Nacidas en D
  const remanentes = parseInputNumber(datos?.dato_2);   // Remanentes en D
  const d3 = parseInputNumber(datos?.dato_3);           // nudos perdidos
  const d4 = parseInputNumber(datos?.dato_4);           // defoliación

  const perdidas = nacidas - remanentes;
  const porcePlantasPerdidas = nacidas > 0 ? (perdidas / nacidas) * 100 : 0;

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

  // A: % DAÑO por reducción de población (TABLA danPorReduccion)
  // % pérdidas = (nacidas - remanentes) / nacidas * 100
  // Buscar en tabla según % pérdidas
  const indiceA = Math.max(0, Math.min(100, Math.floor(porcePlantasPerdidas)));
  const A = parseInputNumber(coefi?.[indiceA] ?? 0);

  // B: C.P.R. = 100 - A
  const B = Math.max(0, 100 - A);

  // C: % DAÑO por nudos perdidos (tabla danPorNudos)
  const indiceC = Math.max(0, Math.min(100, Math.floor(d3)));
  const C = parseInputNumber(coefi2?.[indiceC] ?? 0);

  // E: % DAÑO NETO nudos = (C * B) / 100
  const E = (C * B) / 100;

  // F: C.P.R. después de nudos = 100 - A - E
  const F = Math.max(0, 100 - A - E);

  // G: % DAÑO por defoliación (tabla danPorDesfo)
  const indiceD = Math.max(0, Math.min(100, Math.floor(d4)));
  const G = parseInputNumber(coefi3?.[indiceD] ?? 0);

  // H: % DAÑO NETO defoliación = (G * F) / 100
  const H = (G * F) / 100;

  // TOTAL = A + E + H
  const porcentaje = A + E + H;

  console.log('📊 Cálculo V (SOJA) - Fórmula Excel:', {
    nacidas, remanentes, perdidas, porcePlantasPerdidas,
    A, B, C, E, F, G, H, total: porcentaje
  });

  return parseFloat(porcentaje.toFixed(1));
}

/**
 * Cálculo para estados reproductivos R1-R3.5 de SOJA
 * Tabla (similar a vegetativa pero con tablas R1):
 * Nacidas en D, Remanentes en D, Perdidas = Nacidas - Remanentes
 * A = % DAÑO = % pérdidas directamente (perdidas/nacidas * 100)
 * B = C.P.R. = 100 - A
 * Nudos originales (d3), Nudos remanentes 1-5 (d4-d8) → promedio → % nudos perdidos
 * C = % DAÑO por tabla danPorNudosR1 (% nudos perdidos)
 * E = % DAÑO NETO nudos = (C * B) / 100
 * F = C.P.R. = 100 - A - E
 * Defoliación (d9)
 * G = % DAÑO por tabla danPorDesfoR1 (defoliación)
 * H = % DAÑO NETO defoliación = (G * F) / 100
 * TOTAL = A + E + H
 * 
 * Mapeo estados (soja): R1=10, R2=11, R2,5=12, R3=13, R3,5=14 → Tipo '2'
 */
function calcularDañoReproductivo(datos, fenologicoLabel) {
  const nacidas = parseInputNumber(datos?.dato_1);      // Nacidas en D
  const remanentes = parseInputNumber(datos?.dato_2);   // Remanentes en D
  const d3 = parseInputNumber(datos?.dato_3);           // Nudos originales por planta
  const d4 = parseInputNumber(datos?.dato_4);           // Nudos remanentes 1
  const d5 = parseInputNumber(datos?.dato_5);           // Nudos remanentes 2
  const d6 = parseInputNumber(datos?.dato_6);           // Nudos remanentes 3
  const d7 = parseInputNumber(datos?.dato_7);           // Nudos remanentes 4
  const d8 = parseInputNumber(datos?.dato_8);           // Nudos remanentes 5
  const d9 = parseInputNumber(datos?.dato_9);           // Defoliación

  const perdidas = nacidas - remanentes;
  const porcePlantasPerdidas = nacidas > 0 ? (perdidas / nacidas) * 100 : 0;

  // A: % DAÑO = % de pérdidas directamente (perdidas/nacidas * 100)
  // En Excel: A = 87.2 = 34/39 * 100
  const A = porcePlantasPerdidas;

  // B: C.P.R. = 100 - A
  const B = Math.max(0, 100 - A);

  // Nudos: calcular % nudos perdidos
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

  // C: % DAÑO por nudos perdidos (tabla danPorNudosR1)
  const C = parseInputNumber(coefi4?.[indiceNudos] ?? 0);

  // E: % DAÑO NETO nudos = (C * B) / 100
  const E = (C * B) / 100;

  // F: C.P.R. = 100 - A - E
  const F = Math.max(0, 100 - A - E);

  // G: % DAÑO por defoliación (tabla danPorDesfoR1)
  const indiceDefoliacion = Math.max(0, Math.min(100, Math.round(d9)));
  const G = parseInputNumber(coefi5?.[indiceDefoliacion] ?? 0);

  // H: % DAÑO NETO defoliación = (G * F) / 100
  const H = (G * F) / 100;

  // TOTAL = A + E + H
  const porcentaje = A + E + H;

  console.log('📊 Cálculo R (SOJA) - Fórmula Excel:', {
    nacidas, remanentes, perdidas, porcePlantasPerdidas,
    A, B, C, E, F, G, H, total: porcentaje
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
 * CÁLCULO DE DAÑO PARA TRIGO (incluye Cebada, Avena, Centeno)
 * ============================================================================
 * Nueva fórmula:
 * d1 = Nacidas en D, d2 = Colgadas en D, d3 = Restantes en D
 * Perdidas en D = max(0, d1 - d2 - d3)
 * danA = tabla[perdidasEnD] (daño por espigas perdidas)
 * danB = tabla[colgadasEnD] (daño por espigas colgadas)
 * danC = danA + danB
 * danE = (numerador/denominador) * 100 (daño por granos)
 * danF = danE * (100 - danC) / 100 (daño neto granos)
 * danTot = danC + danF
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

  // d1 = Nacidas en D, d2 = Colgadas en D, d3 = Restantes en D
  const nacidas = data.d1;
  const colgadas = data.d2;
  const restantes = data.d3;

  // Perdidas en D = Nacidas - Colgadas - Restantes (no negativo)
  const perdidasEnD = Math.max(0, nacidas - colgadas - restantes);

  // Tabla de coeficientes para el estado fenológico
  const coefiTrigo = trigo?.[fenologicoLabel]?.dan || {};

  // danA: % espigas perdidas = (perdidasEnD / nacidas) * 100
  // En el ejemplo: 20/80 * 100 = 25%
  const danA = nacidas > 0 ? (perdidasEnD / nacidas) * 100 : 0;

  // danB: % daño por espigas colgadas (usa % espigas colgadas como índice en tabla)
  // % espigas colgadas = (colgadas / nacidas) * 100 = 20/80 * 100 = 25%
  const porcentEspigasColgadas = nacidas > 0 ? (colgadas / nacidas) * 100 : 0;
  const idxB = Math.max(0, Math.min(100, Math.floor(porcentEspigasColgadas)));
  const danB = parseInputNumber(coefiTrigo?.[String(idxB)] ?? 0);

  // danC = danA + danB
  const danC = danA + danB;

  // Cálculo de granos (espigas)
  const numerador = data.d4 + data.d6 + data.d8 + data.d10 + data.d12 + data.d14 + data.d16 + data.d18 + data.d20 + data.d22;
  const denominador = data.d5 + data.d7 + data.d9 + data.d11 + data.d13 + data.d15 + data.d17 + data.d19 + data.d21 + data.d23;

  let danE = 0;
  if (denominador > 0) {
    danE = (numerador / denominador) * 100;
  }

  // danF = danE * (100 - danC) / 100
  const danF = (danE * Math.max(0, 100 - danC)) / 100;

  // Total
  const danTot = danC + danF;

  console.log('📊 Cálculo TRIGO:', {
    estadoFenologico: fenologicoLabel,
    // Inputs
    nacidasEnD: nacidas,
    colgadasEnD: colgadas,
    restantesEnD: restantes,
    // Cálculos intermedios
    perdidasEnD,
    // A: % espigas perdidas = perdidasEnD / nacidas * 100
    porcentEspigasPerdidasA: danA.toFixed(2),
    // B: % espigas colgadas = colgadas / nacidas * 100
    porcentEspigasColgadas: porcentEspigasColgadas.toFixed(2),
    // Tabla lookup para B (índice = colgadas)
    idxB,
    tablaIdxB: coefiTrigo?.[String(idxB)],
    // % daño por espigas colgadas (valor de tabla para Espigamiento en idxB=20 -> 20)
    porcentDanColgadasB: coefiTrigo?.[String(idxB)] ?? 0,
    // Resultados A y B
    danA: danA.toFixed(2),
    danB: danB.toFixed(2),
    // C = A + B
    danC: danC.toFixed(2),
    // Granos
    numerador,
    denominador,
    danE: danE.toFixed(2),
    // F = danE * (100 - danC) / 100
    danF: danF.toFixed(2),
    // Total
    total: danTot.toFixed(2)
  });

  return parseFloat(danTot.toFixed(1));
}

/**
 * ============================================================================
 * CÁLCULO DE DAÑO PARA GIRASOL (mismo patrón que Trigo)
 * ============================================================================
 * d1 = Nacidas en D, d2 = Improduct en D, d3 = Restante en D
 * d4 = % promedio daño capít., d5 = % defoliacion
 * 
 * Perdidas en D = max(0, Nacidas - Improduct - Restante)
 * % pérdidas = (Perdidas / Nacidas) * 100
 * danA = tabla[% pérdidas] + % improduct
 * danE = (% daño capít.) * (100 - danA) / 100
 * danF = (100 - danA - danE)
 * danG = tabla_defoliacion[% defoliacion]
 * danH = danG * danF / 100
 * Total = danA + danE + danH
 * 
 * Tablas por estado fenológico:
 * - Vegetativos (V1-V12, Vn): usan tabla "V1-V11"
 * - Reproductivos (R1-R9): usan sus tablas respectivas
 */
function calcularDañoGirasol(datos, fenologico) {
  const fenologicoNum = parseInt(fenologico, 10);

  console.log('🌻 Calculando daño GIRASOL para estado:', fenologicoNum);

  let fenologicoLabel = "V1-V11";

  if (!isNaN(fenologicoNum)) {
    if (fenologicoNum >= 1 && fenologicoNum <= 12) {
      // Vegetativos: V1(1) a V11(10), V12(11), Vn(12)
      if (fenologicoNum === 12) {
        fenologicoLabel = 'Vn';
      } else if (fenologicoNum === 11) {
        fenologicoLabel = 'V12';
      } else {
        fenologicoLabel = `V${fenologicoNum}`;
      }
      // Para lookup en tabla, todos los vegetativos usan "V1-V11"
      fenologicoLabel = 'V1-V11';
    } else if (fenologicoNum >= 14 && fenologicoNum <= 22) {
      // Reproductivos: R1(14) a R9(22)
      switch (fenologicoNum) {
        case 14: fenologicoLabel = 'R1 (estrella)'; break;
        case 15: fenologicoLabel = 'R2 (botón a 0,5 - 2 cm)'; break;
        case 16: fenologicoLabel = 'R3 (botón a + de 2 cm)'; break;
        case 17: fenologicoLabel = 'R4 (apertura inflorescencia)'; break;
        case 18: fenologicoLabel = 'R5 (inicio floración)'; break;
        case 19: fenologicoLabel = 'R6 (fin floración)'; break;
        case 20: fenologicoLabel = 'R7 (envés capítulo inicio amarilleo)'; break;
        case 21: fenologicoLabel = 'R8 (envés capítulo amarillo)'; break;
        case 22: fenologicoLabel = 'R9 (brácteas amarillo/marrón)'; break;
        default: fenologicoLabel = 'V1-V11';
      }
    } else {
      fenologicoLabel = 'V1-V11';
    }
  }

console.log('🌻 Calculando daño GIRASOL para estado:', fenologicoLabel);

  const data = {};
  for (let i = 1; i <= 5; i++) {
    data[`d${i}`] = parseInputNumber(datos[`dato_${i}`]);
  }

  // d1 = Nacidas en D, d2 = Improduct en D, d3 = Restante en D
  const nacidas = data.d1;
  const improduct = data.d2;
  const restante = data.d3;

  // Perdidas en D = Nacidas - Improduct - Restante (no negativo)
  const perdidasEnD = Math.max(0, nacidas - improduct - restante);

  // % pérdidas = (Perdidas / Nacidas) * 100
  const porcentPerdidas = nacidas > 0 ? (perdidasEnD / nacidas) * 100 : 0;

  // Determinar qué tabla de reducción usar según el grupo fenológico
  // V1-V11 (1-11) -> tabla "V1-V11"
  // V12 (12), Vn (13) -> tabla "V12-Vn"
  // Reproductivos usan su tabla propia (ya está en fenologicoLabel)
  let tablaReduccionKey;
  if (fenologicoNum === 12 || fenologicoNum === 13) {
    // V12 (12) y Vn (13) usan tabla "V12-Vn"
    tablaReduccionKey = 'V12-Vn';
  } else if (fenologicoNum >= 1 && fenologicoNum <= 11) {
    // V1 (1) a V11 (11) usan tabla "V1-V11"
    tablaReduccionKey = 'V1-V11';
  } else {
    // Reproductivos usan su tabla propia (ya está en fenologicoLabel)
    tablaReduccionKey = fenologicoLabel;
  }

  const coefiGirasol = girasolReduccion?.[tablaReduccionKey]?.dan || {};

  // danA = tabla[% pérdidas] + % improduct
  // % pérdidas se usa como índice en la tabla de reducción
  const idxA = Math.max(0, Math.min(100, Math.floor(porcentPerdidas)));
  const danA_Tabla = parseInputNumber(coefiGirasol?.[String(idxA)] ?? 0);

  // % improduct = (improduct / nacidas) * 100
  const porcentImproduct = nacidas > 0 ? (improduct / nacidas) * 100 : 0;

  // danA = valor_tabla + % improduct (como en Excel +I10)
  const danA = danA_Tabla + porcentImproduct;

  // danE = % daño capít. * (100 - danA) / 100
  const cprB = Math.max(0, 100 - danA);
  const danE = (data.d4 * cprB) / 100;

  // danF = 100 - danA - danE
  const danF = Math.max(0, 100 - danA - danE);

  // danG = tabla_defoliacion[% defoliacion]
  const idxDesfo = Math.max(0, Math.min(100, Math.floor(data.d5)));
  // Usar la misma lógica de tabla para defoliación
  const coefiDesfoGirasol = girasolDesfo?.[tablaReduccionKey]?.dan || {};

  let danG = idxDesfo !== 0
    ? parseInputNumber(coefiDesfoGirasol?.[String(idxDesfo)] ?? 0)
    : 0;

  // danH = danG * danF / 100
  const danH = (danG * danF) / 100;

  // Total = danA + danE + danH
  const danTot = danA + danE + danH;

  console.log('📊 Cálculo GIRASOL:', {
    estadoFenologico: fenologicoLabel,
    nacidas,
    improduct,
    restante,
    perdidasEnD,
    porcentPerdidas: porcentPerdidas.toFixed(2),
    danA_Tabla: danA_Tabla.toFixed(2),
    porcentImproduct: porcentImproduct.toFixed(2),
    danA: danA.toFixed(2),
    danE: danE.toFixed(2),
    danF: danF.toFixed(2),
    idxDesfo: Math.max(0, Math.min(100, Math.floor(data.d5))),
    danG: danG.toFixed(2),
    danH: danH.toFixed(2),
    total: danTot.toFixed(2)
  });

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