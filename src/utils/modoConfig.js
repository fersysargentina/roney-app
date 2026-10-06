// ✅ MODO TEST — variable única para toda la app
//
//   true  = TESTING: todo libre (reenviar lotes, editar, crear, borrar)
//   false = PRODUCCIÓN: un solo envío por operación (los lotes enviados
//           bloquean modificar/agregar/crear lotes y muestras)
//
// La usan: LotesScreen.js (reenvío de lotes) y OperacionItem.js (badge + bloqueo)
export const MODO_TEST_ENVIO = true;
