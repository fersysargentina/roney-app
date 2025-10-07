import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

export default function MuestraItem({ item, isSelected, onOpenModal, onToggleSelect, onDelete, isInLote = false }) {
  const formatPorcentaje = (n) => {
    const num = Number(n) || 0;
    const trunc = Math.trunc(num * 10) / 10; // sin redondeo, truncado a 1 decimal
    return trunc.toFixed(1).replace('.', ',');
  };
  
  const handleDelete = () => {
    if (isInLote) {
      Alert.alert(
        'Muestra en Lote',
        'Esta muestra está asignada a un lote. Debe liberarla desde la pantalla de lotes para poder eliminarla.',
        [{ text: 'OK' }]
      );
      return;
    }
    onDelete();
  };

  const handlePress = () => {
    if (isInLote) {
      Alert.alert(
        'Muestra en Lote',
        'Esta muestra ya está asignada a un lote',
        [{ text: 'OK' }]
      );
      return;
    }
    onOpenModal(item);
  };

  const getContainerStyle = () => {
    if (isInLote) {
      return [styles.container, styles.containerInLote];
    }
    if (isSelected) {
      return [styles.container, styles.containerSelected];
    }
    return styles.container;
  };

  const formatearDatos = () => {
    const { datos } = item;
    if (!datos) return 'Sin datos';
    
    const valores = Object.entries(datos)
      .filter(([key, value]) => key !== 'porcentajeDaño' && value !== '' && value !== null)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return valores || 'Sin datos específicos';
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={handlePress}
      activeOpacity={isInLote ? 1 : 0.7}
      disabled={isInLote}
    >
      <View style={styles.header}>
        <View style={styles.headerRight}>
          {isInLote && (
            <View style={styles.loteIndicator}>
              <Text style={styles.loteText}>EN LOTE</Text>
            </View>
          )}
          <View style={styles.headerLeft}>
          </View>
    
          <TouchableOpacity
            style={[styles.selectButton, isInLote && styles.deleteButtonDisabled]}
            onPress={() => !isInLote && onToggleSelect(item.id)}
            disabled={isInLote}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.selectButtonText}>
              {isSelected ? 'Quitar' : 'Seleccionar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Mostrar porcentaje de daño */}
        <View style={styles.dañoContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.nombre}>{item.nombre}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              isInLote && styles.deleteButtonDisabled
            ]}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
          <Text style={styles.deleteButtonText}>
              {isInLote ? '🔒' : '🗑️'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dañoValue}>
            {item.datos?.porcentajeDaño}%
          </Text>
          
        </View>
      </View>

      {/* Indicador de selección */}
      {isSelected && !isInLote && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionText}>✓ SELECCIONADA</Text>
        </View>
      )}

      {/* Mensaje para muestras en lote */}
      {isInLote && (
        <View style={styles.loteMessage}>
          <Text style={styles.loteMessageText}>
            📦 Esta muestra está asignada a un lote
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  containerSelected: {
    borderColor: '#007bff',
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  containerInLote: {
    borderColor: '#ffc107',
    backgroundColor: '#fffbf0',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  fecha: {
    fontSize: 12,
    color: '#666',
  },
  loteIndicator: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  loteText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
    marginRight: 20,
  },
  selectButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#007bff',
    marginLeft: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  tipo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 8,
  },
  dañoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dañoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  dañoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  datos: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  loteMessage: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  loteMessageText: {
    fontSize: 11,
    color: '#856404',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});