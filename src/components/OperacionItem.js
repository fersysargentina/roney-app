import React, { useCallback, useMemo } from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';

export default React.memo(function OperacionItem({ item, onPress, onBorrar, onMuestras }) {
  
  // ✅ Título memoizado
  const titulo = useMemo(() => {
    return `${item.roney_op} - ${item.cultivo}`;
  }, [item.roney_op, item.cultivo]);

  // ✅ Handlers memoizados
  const handleBorrar = useCallback(() => {
    onBorrar();
  }, [onBorrar]);

  const handleMuestras = useCallback(() => {
    onMuestras();
  }, [onMuestras]);

  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.title}>{titulo}</Text>
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
    marginBottom: 8,
  },
  itemButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
});