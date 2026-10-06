import React, { useCallback, useMemo } from 'react';
import { View, Text, Button, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MODO_TEST_ENVIO } from '../utils/modoConfig';

export default React.memo(function OperacionItem({ item, onPress, onBorrar, onMuestras, enviado }) {

  // ✅ true si la operación tiene al menos un lote enviado (lo calcula OperacionesScreen)
  const tieneLotesEnviados = Boolean(enviado);

  // ✅ Producción (MODO_TEST_ENVIO=false) + lotes enviados = MODO CONSULTA:
  //    se puede entrar y ver todo, pero no modificar ni eliminar.
  const modoConsulta = tieneLotesEnviados && !MODO_TEST_ENVIO;

  const alertaConsulta = useCallback(() => {
    Alert.alert(
      'Modo consulta',
      'Esta operación ya fue enviada. Solo podés ver los datos: no se pueden modificar, agregar ni eliminar.'
    );
  }, []);

  // Título en una sola línea: Nombre de la operación - nombre de asegurado - cultivo
  const titulo = useMemo(() => {
    const partes = [item.roney_op, item.campo, item.cultivo].filter(
      p => p && String(p).trim().length > 0
    );
    return partes.join(' - ');
  }, [item.roney_op, item.campo, item.cultivo]);

  // ✅ Borrar queda bloqueado en modo consulta (borrar destruye los lotes enviados)
  const handleBorrar = useCallback(() => {
    if (modoConsulta) {
      alertaConsulta();
      return;
    }
    onBorrar();
  }, [modoConsulta, alertaConsulta, onBorrar]);

  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {titulo}
      </Text>
      <View style={styles.itemButtons}>
        <Button
          title="Borrar"
          color="#d9534f"
          onPress={handleBorrar}
        />
        {/* ✅ Cartel de estado entre los botones */}
        {tieneLotesEnviados && (
          <View style={styles.enviadoBadge}>
            <Text style={styles.enviadoBadgeText}>ENVIADO</Text>
          </View>
        )}
        {/* ✅ En modo consulta se puede entrar a ver muestras/lotes */}
        <Button
          title="Muestras"
          onPress={onMuestras}
        />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  item: {
    padding: 16,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },
  itemButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  enviadoBadge: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  enviadoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
