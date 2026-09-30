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

export default React.memo(function LoteItem({ lote, onPress, onDelete, isSelected, onToggleSelect, enviado }) {

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

  // ✅ Has. Sembradas/Aseg. con fallback a campo antiguo
  const hasSembradas = useMemo(() => {
    const val = lote.hasSembradas ?? lote.hectareas;
    return val != null ? `${val} ha` : '-';
  }, [lote.hasSembradas, lote.hectareas]);

  // ✅ Has. Dañadas
  const hasDañadas = useMemo(() => {
    return lote.hasDañadas != null ? `${lote.hasDañadas} ha` : '-';
  }, [lote.hasDañadas]);

  // ✅ Texto de daño memoizado (final editado si existe, si no el calculado)
  const dañoRealText = useMemo(() => {
    const valor = lote.dañoFinal ?? lote.dañoReal;
    return `${valor}%`;
  }, [lote.dañoFinal, lote.dañoReal]);

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

  // ✅ Toggle selección (los lotes enviados no se pueden seleccionar)
  const handleToggleSelect = useCallback(() => {
    if (enviado) return;
    onToggleSelect(lote.id);
  }, [enviado, onToggleSelect, lote.id]);

  const containerStyle = [
    styles.container,
    isSelected && styles.containerSelected,
    enviado && styles.containerEnviado,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.nombreLote, enviado && styles.textoEnviado]}>{lote.nombreLote}</Text>
          <Text style={styles.fecha}>{fechaFormateada}</Text>
        </View>

        <View style={styles.headerActions}>
          {enviado ? (
            <View style={styles.enviadoBadge}>
              <Text style={styles.enviadoBadgeText}>✓ ENVIADO</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.selectButton, isSelected && styles.selectButtonSelected]}
              onPress={handleToggleSelect}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextSelected]}>
                {isSelected ? '✓ Quitar' : 'Seleccionar'}
              </Text>
            </TouchableOpacity>
          )}

          {!enviado && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Has. Sem/Aseg.</Text>
            <Text style={styles.statValue}>{hasSembradas}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Has. Dañadas</Text>
            <Text style={styles.statValue}>{hasDañadas}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Fenológico</Text>
            <Text style={styles.statValueSmall} numberOfLines={1} ellipsizeMode="tail">
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
      </View>

      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionText}>✓ SELECCIONADO</Text>
        </View>
      )}
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
  containerSelected: {
    borderWidth: 2,
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
  },
  containerEnviado: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  textoEnviado: {
    color: '#888',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#007bff',
    backgroundColor: '#fff',
  },
  selectButtonSelected: {
    backgroundColor: '#007bff',
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007bff',
  },
  selectButtonTextSelected: {
    color: '#fff',
  },
  enviadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#28a745',
  },
  enviadoBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectionIndicator: {
    marginTop: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#007bff',
    alignItems: 'center',
  },
  selectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
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