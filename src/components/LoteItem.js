// ============================================
// LoteItem.js - OPTIMIZADO
// ============================================
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

export default React.memo(function LoteItem({ lote, onPress, onDelete }) {
  
  // ✅ Formatear fecha memoizado
  const fechaFormateada = useMemo(() => {
    try {
      const fecha = new Date(lote.fecha);
      return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return lote.fecha;
    }
  }, [lote.fecha]);

  // ✅ Display fenológico memoizado
  const fenologicoDisplay = useMemo(() => {
    return lote.tipoFenologicoLabel || lote.tipoFenologico || '-';
  }, [lote.tipoFenologicoLabel, lote.tipoFenologico]);

  // ✅ Cantidad de muestras memoizada
  const cantidadMuestras = useMemo(() => {
    return lote.muestrasIds.length;
  }, [lote.muestrasIds.length]);

  // ✅ Texto de hectáreas memoizado
  const hectareasText = useMemo(() => {
    return `${lote.hectareas} ha`;
  }, [lote.hectareas]);

  // ✅ Texto de daño real memoizado
  const dañoRealText = useMemo(() => {
    return `${lote.dañoReal}%`;
  }, [lote.dañoReal]);

  // ✅ Eliminar memoizado
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Eliminar Lote',
      `¿Estás seguro que deseas eliminar el lote "${lote.nombreLote}"?\n\nEsto liberará ${cantidadMuestras} muestras y volverán a estar disponibles.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete(lote.id)
        }
      ]
    );
  }, [lote.nombreLote, lote.id, cantidadMuestras, onDelete]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.nombreLote}>{lote.nombreLote}</Text>
          <Text style={styles.fecha}>{fechaFormateada}</Text>
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
          <Text style={styles.statValue}>{hectareasText}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Muestras</Text>
          <Text style={styles.statValue}>{cantidadMuestras}</Text>
        </View>

        <View style={styles.statItemWide}>
          <Text style={styles.statLabel}>Fenológico</Text>
          <Text style={styles.statValueSmall} numberOfLines={2} ellipsizeMode="tail">
            {fenologicoDisplay}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Daño</Text>
          <Text style={[styles.statValue, styles.dañoReal]}>
            {dañoRealText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

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
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 60,
  },
  statItemWide: {
    flex: 1.5,
    alignItems: 'center',
    minWidth: 80,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  statValueSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  dañoReal: {
    color: '#dc3545',
  },
});