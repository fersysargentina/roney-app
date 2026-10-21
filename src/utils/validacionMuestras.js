function esVacio(valor) {
  if (valor === null || valor === undefined) return true;
  return String(valor).trim() === '';
}

function etiqueta(spec, clave) {
  return (spec.labels && spec.labels[clave]) || clave;
}

function mapaLabels(arrayLabels) {
  return arrayLabels.reduce((acc, label, i) => {
    acc[`dato_${i + 1}`] = label;
    return acc;
  }, {});
}

function mensajeReduccion(spec, grupo) {
  const etiquetas = grupo.map(clave => etiqueta(spec, clave));
  let lista;
  if (etiquetas.length === 2) {
    lista = `${etiquetas[0]} y ${etiquetas[1]}`;
  } else {
    lista = `${etiquetas.slice(0, -1).join(', ')} y ${etiquetas[etiquetas.length - 1]}`;
  }
  return `Para reducción de población completá todos los campos: ${lista}`;
}

const PAREJAS_TIPO3 = [
  ['dato_2', 'dato_3'],
  ['dato_4', 'dato_5'],
  ['dato_6', 'dato_7'],
  ['dato_8', 'dato_9'],
  ['dato_10', 'dato_11'],
];

const LABELS_TIPO4 = (() => {
  const labels = ['Vainas en el suelo'];
  for (let i = 1; i <= 10; i++) {
    labels.push(`Vainas Abiertas ${i}`);
    labels.push(`Vainas Sanas ${i}`);
  }
  return labels;
})();

const PAREJAS_TIPO4 = (() => {
  const parejas = [];
  for (let i = 1; i <= 10; i++) {
    parejas.push([`dato_${i * 2}`, `dato_${i * 2 + 1}`]);
  }
  return parejas;
})();

const LABELS_TRIGO = [
  'Plantas/Espigas Nacidas en D',
  'Plantas/Espigas Colgadas en D',
  'Plantas/Espigas restantes en pie en D',
  'Espiga 1 - Granos Perdidos',
  'Espiga 1 - Granos Totales',
  'Espiga 2 - Granos Perdidos',
  'Espiga 2 - Granos Totales',
  'Espiga 3 - Granos Perdidos',
  'Espiga 3 - Granos Totales',
  'Espiga 4 - Granos Perdidos',
  'Espiga 4 - Granos Totales',
  'Espiga 5 - Granos Perdidos',
  'Espiga 5 - Granos Totales',
  'Espiga 6 - Granos Perdidos',
  'Espiga 6 - Granos Totales',
  'Espiga 7 - Granos Perdidos',
  'Espiga 7 - Granos Totales',
  'Espiga 8 - Granos Perdidos',
  'Espiga 8 - Granos Totales',
  'Espiga 9 - Granos Perdidos',
  'Espiga 9 - Granos Totales',
  'Espiga 10 - Granos Perdidos',
  'Espiga 10 - Granos Totales',
];

const PAREJAS_TRIGO = [
  ['dato_4', 'dato_5'],
  ['dato_6', 'dato_7'],
  ['dato_8', 'dato_9'],
  ['dato_10', 'dato_11'],
  ['dato_12', 'dato_13'],
  ['dato_14', 'dato_15'],
  ['dato_16', 'dato_17'],
  ['dato_18', 'dato_19'],
  ['dato_20', 'dato_21'],
  ['dato_22', 'dato_23'],
];

const SPECS = {
  tipo1: {
    gruposReduccion: [['dato_1', 'dato_2']],
    parejas: [],
    labels: {
      dato_1: 'Plantas Nacidas en D',
      dato_2: 'Plantas restantes en pie en D',
      dato_3: '% nudos perdidos',
      dato_4: '% defoliación',
    },
  },
  tipo2: {
    gruposReduccion: [['dato_1', 'dato_2']],
    parejas: [],
    campoExigeAlguno: [
      {
        campo: 'dato_3',
        claves: ['dato_4', 'dato_5', 'dato_6', 'dato_7', 'dato_8'],
        mensaje: 'Si completás "Nudos originales por Planta", completá al menos un nudo remanente',
      },
    ],
    labels: {
      dato_1: 'Plantas Nacidas en D',
      dato_2: 'Plantas restantes en pie en D',
      dato_3: 'Nudos originales por Planta',
      dato_4: 'Nudos remanentes 1',
      dato_5: 'Nudos remanentes 2',
      dato_6: 'Nudos remanentes 3',
      dato_7: 'Nudos remanentes 4',
      dato_8: 'Nudos remanentes 5',
      dato_9: '% Defoliación',
    },
  },
  tipo3: {
    gruposReduccion: [],
    requiereAlgo: true,
    parejas: PAREJAS_TIPO3,
    sueloExigePareja: { campo: 'dato_1', parejas: PAREJAS_TIPO3 },
    labels: {
      dato_1: 'Vainas en el suelo',
      dato_2: 'Vainas Abiertas (Nudo 1)',
      dato_3: 'Vainas Sanas (Nudo 1)',
      dato_4: 'Vainas Abiertas (Nudo 2)',
      dato_5: 'Vainas Sanas (Nudo 2)',
      dato_6: 'Vainas Abiertas (Nudo 3)',
      dato_7: 'Vainas Sanas (Nudo 3)',
      dato_8: 'Vainas Abiertas (Nudo 4)',
      dato_9: 'Vainas Sanas (Nudo 4)',
      dato_10: 'Vainas Abiertas (Nudo 5)',
      dato_11: 'Vainas Sanas (Nudo 5)',
      dato_12: '% Defoliación',
    },
  },
  tipo4: {
    gruposReduccion: [],
    requiereAlgo: true,
    parejas: PAREJAS_TIPO4,
    sueloExigePareja: { campo: 'dato_1', parejas: PAREJAS_TIPO4 },
    labels: mapaLabels(LABELS_TIPO4),
  },
  maiz: {
    gruposReduccion: [['dato_1', 'dato_2']],
    parejas: [],
    labels: {
      dato_1: 'Plantas Nacidas en D',
      dato_2: 'Plantas restantes en pie en D',
      dato_3: '% defoliacion',
    },
  },
  maizTardio: {
    gruposReduccion: [['dato_1', 'dato_2']],
    parejas: [],
    labels: {
      dato_1: 'Plantas Nacidas en D',
      dato_2: 'Plantas restantes en pie en D',
      dato_3: 'Nº de hileras por Espiga Promedio',
      dato_4: 'Nº de granos por hilera Promedio',
      dato_5: 'Nº de granos Perdidos Totales',
      dato_6: '% defoliacion',
    },
  },
  girasol: {
    gruposReduccion: [['dato_1', 'dato_2', 'dato_3']],
    parejas: [],
    labels: {
      dato_1: 'Plantas Nacidas en D',
      dato_2: 'Plantas Improduct en D',
      dato_3: 'Plantas restantes en pie en D',
      dato_4: '% promedio daño capít.',
      dato_5: '% defoliacion',
    },
  },
  trigo: {
    gruposReduccion: [['dato_1', 'dato_2', 'dato_3']],
    parejas: PAREJAS_TRIGO,
    labels: mapaLabels(LABELS_TRIGO),
  },
};

export function validarDatosMuestra(claveModal, datos = {}) {
  const spec = SPECS[claveModal];
  if (!spec) return { ok: true };

  // 0) Al menos un campo cargado (solo specs con requiereAlgo)
  if (spec.requiereAlgo) {
    const claves = Object.keys(spec.labels || {});
    const alguno = claves.some(clave => !esVacio(datos[clave]));
    if (!alguno) {
      return { ok: false, mensaje: 'Completá al menos un campo antes de guardar la muestra' };
    }
  }

  // 1) Grupos de plantas (reducción de población): OBLIGATORIOS siempre — todos con valor
  const grupos = spec.gruposReduccion || [];
  for (let i = 0; i < grupos.length; i++) {
    const grupo = grupos[i];
    const faltantes = grupo.filter(clave => esVacio(datos[clave]));
    if (faltantes.length > 0) {
      return { ok: false, mensaje: mensajeReduccion(spec, grupo) };
    }
  }

  // 2) "Vainas en el suelo" exige al menos una pareja completa
  const suelo = spec.sueloExigePareja;
  if (suelo && !esVacio(datos[suelo.campo])) {
    let hayParejaCompleta = false;
    const parejasSuelo = suelo.parejas || [];
    for (let i = 0; i < parejasSuelo.length; i++) {
      const par = parejasSuelo[i];
      if (!esVacio(datos[par[0]]) && !esVacio(datos[par[1]])) {
        hayParejaCompleta = true;
        break;
      }
    }
    if (!hayParejaCompleta) {
      return {
        ok: false,
        mensaje: `Si completás "${etiqueta(spec, suelo.campo)}", completá al menos una pareja de vainas abiertas y sanas`,
      };
    }
  }

  // 2b) Campo exige al menos uno de una lista de campos
  const exigencias = spec.campoExigeAlguno || [];
  for (let i = 0; i < exigencias.length; i++) {
    const ex = exigencias[i];
    if (!esVacio(datos[ex.campo])) {
      const hayAlguno = (ex.claves || []).some(c => !esVacio(datos[c]));
      if (!hayAlguno) {
        return { ok: false, mensaje: ex.mensaje || `Si completás "${etiqueta(spec, ex.campo)}", completá al menos un campo relacionado` };
      }
    }
  }

  // 3) Parejas: si uno de los dos está completo, el otro también
  const parejas = spec.parejas || [];
  for (let i = 0; i < parejas.length; i++) {
    const claveA = parejas[i][0];
    const claveB = parejas[i][1];
    const vacioA = esVacio(datos[claveA]);
    const vacioB = esVacio(datos[claveB]);
    if (!vacioA && vacioB) {
      return { ok: false, mensaje: `Si completás "${etiqueta(spec, claveA)}" completá también "${etiqueta(spec, claveB)}"` };
    }
    if (vacioA && !vacioB) {
      return { ok: false, mensaje: `Si completás "${etiqueta(spec, claveB)}" completá también "${etiqueta(spec, claveA)}"` };
    }
  }

  return { ok: true };
}

export function normalizarConteos(claveModal, datos = {}) {
  const spec = SPECS[claveModal];
  if (!spec) return datos;
  const salida = { ...datos };
  const claves = Object.keys(spec.labels || {});
  for (let i = 0; i < claves.length; i++) {
    const clave = claves[i];
    if (Object.prototype.hasOwnProperty.call(salida, clave) && esVacio(salida[clave])) {
      salida[clave] = '0';
    }
  }
  return salida;
}
