import React, { useCallback, useMemo } from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';

export default React.memo(function OperacionItem({ item, onPress, onBorrar, onMuestras }) {
  
  // Título en una sola línea: Nombre de la operación - nombre del campo - cultivo
  const titulo = useMemo(() => {
    const partes = [item.roney_op, item.campo, item.cultivo].filter(
      p => p && String(p).trim().length > 0
    );
    return partes.join(' - ');
  }, [item.roney_op, item.campo, item.cultivo]);

  // Handlers memoizados
  const handleBorrar = useCallback(() => {
    onBorrar();
  }, [onBorrar]);

  const handleMuestras = useCallback(() => {
    onMuestras();
  }, [onMuestras]);

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
    gap: 10,
  },
});