/**
 * Utilidades para formateo y conversión de coordenadas a Grados, Minutos y Segundos (DMS).
 */

/**
 * Convierte un valor decimal de latitud o longitud a formato DMS.
 * @param {number|string} val - Coordenada decimal
 * @param {boolean} isLat - true para Latitud (N/S), false para Longitud (E/O)
 * @returns {string} Ejemplo: 34° 36' 13.4" S
 */
export function toDMS(val, isLat) {
  if (val === null || val === undefined || isNaN(val)) return '';
  const num = Number(val);
  const abs = Math.abs(num);
  let deg = Math.floor(abs);
  let minFloat = (abs - deg) * 60;
  let min = Math.floor(minFloat);
  let sec = Number(((minFloat - min) * 60).toFixed(1));

  if (sec >= 60) {
    sec = 0;
    min += 1;
    if (min >= 60) {
      min = 0;
      deg += 1;
    }
  }

  const dir = isLat ? (num >= 0 ? 'N' : 'S') : (num >= 0 ? 'E' : 'O');
  const secStr = Number.isInteger(sec) ? sec.toString() : sec.toFixed(1);
  return `${deg}° ${min}' ${secStr}" ${dir}`;
}

/**
 * Formatea coordenadas al formato Grados, Minutos y Segundos (DMS).
 * Admite:
 * 1. Dos argumentos numéricos: formatearCoordenadasDMS(lat, lon)
 * 2. Un string decimal: formatearCoordenadasDMS("-34.603722, -58.381592")
 * 3. Un string ya en DMS: lo retorna sin modificar.
 *
 * @param {number|string} input - Latitud numérica o string de coordenadas
 * @param {number} [lon] - Longitud numérica (opcional si input es string)
 * @returns {string} Ejemplo: "34° 36' 13.4" S, 58° 22' 53.7" O"
 */
export function formatearCoordenadasDMS(input, lon) {
  if (input === null || input === undefined || input === '') return '';

  if (typeof input === 'number' && typeof lon === 'number') {
    return `${toDMS(input, true)}, ${toDMS(lon, false)}`;
  }

  const str = String(input).trim();
  if (!str) return '';
  if (str.includes('°')) return str; // Ya está en formato DMS

  const cleaned = str.replace(/[()[\]]/g, '').trim();
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)[,\s/]+(-?\d+(?:\.\d+)?)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return `${toDMS(lat, true)}, ${toDMS(lng, false)}`;
    }
  }

  return str;
}
