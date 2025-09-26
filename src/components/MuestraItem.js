import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function MuestraItem({ item, isSelected = false, onPress, onDelete }) {
  return (
    <TouchableOpacity 
      style={[styles.container, isSelected && styles.selectedContainer]} 
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <View style={styles.rightSection}>
            {isSelected && <Text style={styles.selectedText}>✓</Text>}
          </View>
        </View>
        
        {/* Mostrar un número aleatorio y un % */}
        <Text>{`${Math.floor(Math.random() * 100)}%`}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={(e) => {
          e.stopPropagation(); // Evita que se active onPress del contenedor
          onDelete();
        }}
      >
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingRight: 40,
  },
  selectedContainer: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  tipo: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    fontSize: 18,
    color: '#2196f3',
    fontWeight: 'bold',
  },
  fecha: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  datosContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  datosTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  datosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dato: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  deleteText: {
    fontSize: 16,
  },
});