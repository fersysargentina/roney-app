import React from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';

export default function OperacionItem({ item, onPress, onBorrar, onMuestras }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.title}>{item.roney_op} - {item.cultivo}</Text>
      <View style={styles.itemButtons}>
        <Button
          title="Borrar"
          color="#d9534f"
          onPress={onBorrar}
        />
        <Button
          title="Muestras"
          onPress={onMuestras}
        />
      </View>
    </TouchableOpacity>
  );
}

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
