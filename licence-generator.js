// Uso: node license-generator.js <device-id>

const crypto = require('crypto');

const SECRET_KEY = 'Roney2025-APP-83693!!!dj$-qmcywalcye';


function generateLicenseKey(deviceId) {
  // Validar que se proporcionó un Device ID
  if (!deviceId || deviceId.trim() === '') {
    console.error('❌ Error: Debes proporcionar un Device ID');
    console.log('Uso: node license-generator.js <device-id>');
    process.exit(1);
  }

  const data = `${deviceId}:${SECRET_KEY}`;
  
  const hash = crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
  
  const key = hash.substring(0, 20).toUpperCase();
  
  const formattedKey = `${key.slice(0,5)}-${key.slice(5,10)}-${key.slice(10,15)}-${key.slice(15,20)}`;
  
  return formattedKey;
}


function generateBulkLicenses(deviceIds) {
  console.log('\n📋 GENERACIÓN DE LICENCIAS EN LOTE\n');
  console.log('═'.repeat(60));
  
  deviceIds.forEach((deviceId, index) => {
    const key = generateLicenseKey(deviceId);
    console.log(`\n${index + 1}. Device ID: ${deviceId}`);
    console.log(`   Clave: ${key}`);
  });
  
  console.log('\n' + '═'.repeat(60) + '\n');
}

//Fucnion principal

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('\n❌ Error: No se proporcionó ningún Device ID\n');
  console.log('USO:');
  console.log('  node license-generator.js <device-id>');
  console.log('  node license-generator.js <device-id-1> <device-id-2> ...\n');
  console.log('EJEMPLO:');
  console.log('  node license-generator.js abc123def456\n');
  process.exit(1);
}

if (args.length === 1) {
  // Un solo Device ID
  const deviceId = args[0];
  const licenseKey = generateLicenseKey(deviceId);
  
  console.log('\n' + '═'.repeat(60));
  console.log('🔑 CLAVE DE LICENCIA GENERADA');
  console.log('═'.repeat(60));
  console.log(`\nDevice ID:  ${deviceId}`);
  console.log(`Clave:      ${licenseKey}`);
  console.log('\n' + '═'.repeat(60));
  console.log('\n✓ Comparte esta clave con el usuario\n');
} else {
  // Múltiples Device IDs
  generateBulkLicenses(args);
}
