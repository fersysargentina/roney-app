import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

export default function LoteItem({ lote, onPress, onDelete }) {
  
  const handleDelete = () => {
    Alert.alert(
      'Eliminar Lote',
      `¿Estás seguro que deseas eliminar el lote "${lote.nombreLote}"?\n\nEsto liberará ${lote.muestrasIds.length} muestras y volverán a estar disponibles.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete(lote.id)
        }
      ]
    );
  };

  const formatearFecha = (fechaString) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fechaString;
    }
  };

  const getDañoPactadoDisplay = () => {
    if (lote.dañoPactado === null || lote.dañoPactado === undefined) {
      return 'Sin completar';
    }
    return `${lote.dañoPactado}%`;
  };

  const getDañoPactadoStyle = () => {
    if (lote.dañoPactado === null || lote.dañoPactado === undefined) {
      return styles.dañoIncompleto;
    }
    return styles.dañoCompleto;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.nombreLote}>{lote.nombreLote}</Text>
          <Text style={styles.fecha}>{formatearFecha(lote.fecha)}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Hectáreas</Text>
          <Text style={styles.statValue}>{lote.hectareas} ha</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Muestras</Text>
          <Text style={styles.statValue}>{lote.muestrasIds.length}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Daño Real</Text>
          <Text style={[styles.statValue, styles.dañoReal]}>
            {lote.dañoReal}%
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Daño Pactado</Text>
          <Text style={[styles.statValue, getDañoPactadoStyle()]}>
            {getDañoPactadoDisplay()}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          👆 Toca para editar o ver detalles
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  nombreLote: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  fecha: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dañoReal: {
    color: '#dc3545', // Rojo para daño real
  },
  dañoCompleto: {
    color: '#28a745', // Verde para daño pactado completado
  },
  dañoIncompleto: {
    color: '#ffc107', // Amarillo para daño pactado sin completar
    fontStyle: 'italic',
    fontSize: 12,
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});