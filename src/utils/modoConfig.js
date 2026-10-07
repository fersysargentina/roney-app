// ✅ MODO TEST — variable única para toda la app
//
//   true  = TESTING: todo libre (reenviar lotes, editar, crear, borrar)
//   false = PRODUCCIÓN: un solo envío por operación (los lotes enviados
//           bloquean modificar/agregar/crear lotes y muestras)
//
// La usan: LotesScreen.js (reenvío de lotes) y OperacionItem.js (badge + bloqueo)
export const MODO_TEST_ENVIO = true;

// ✅ DEV — flag de desarrollo
//
//   true  = DEV: NO se borran los datos del dispositivo cuando la operación
//           queda enviada (útil para probar/reenviar)
//   false = PRODUCCIÓN: al quedar la operación COMPLETAMENTE enviada se
//           borran automáticamente sus datos del dispositivo (lotes,
//           muestras y fotos): la información ya está cargada en la web
export const DEV = false;
