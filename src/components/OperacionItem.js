import React, { useCallback, useMemo } from 'react';
import { View, Text, Button, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MODO_TEST_ENVIO } from '../utils/modoConfig';

export default React.memo(function OperacionItem({ item, onPress, onBorrar, onMuestras, enviado }) {

  // ✅ true si la operación tiene al menos un lote enviado (lo calcula OperacionesScreen)
  const tieneLotesEnviados = Boolean(enviado);

  // ✅ En producción, con lotes enviados se bloquea todo (un solo envío por operación)
  const bloqueado = tieneLotesEnviados && !MODO_TEST_ENVIO;

  const bloquearAccion = useCallback(() => {
    Alert.alert(
      'Operación enviada',
      'Esta operación ya tiene lotes enviados. Solo se permite un envío por operación: no se pueden modificar, agregar ni crear datos.'
    );
  }, []);

  // Título en una sola línea: Nombre de la operación - nombre del campo - cultivo
  const titulo = useMemo(() => {
    const partes = [item.roney_op, item.campo, item.cultivo].filter(
      p => p && String(p).trim().length > 0
    );
    return partes.join(' - ');
  }, [item.roney_op, item.campo, item.cultivo]);

  // Handlers memoizados (bloqueados en producción si hay lotes enviados)
  const handleEditar = useCallback(() => {
    if (bloqueado) {
      bloquearAccion();
      return;
    }
    onPress();
  }, [bloqueado, bloquearAccion, onPress]);

  const handleBorrar = useCallback(() => {
    if (bloqueado) {
      bloquearAccion();
      return;
    }
    onBorrar();
  }, [bloqueado, bloquearAccion, onBorrar]);

  const handleMuestras = useCallback(() => {
    if (bloqueado) {
      bloquearAccion();
      return;
    }
    onMuestras();
  }, [bloqueado, bloquearAccion, onMuestras]);

  return (
    <TouchableOpacity style={styles.item} onPress={handleEditar}>
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
        <Button
          title="Muestras"
          onPress={handleMuestras}
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
