import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default React.memo(function MuestraItem({ 
  item, 
  isSelected, 
  onOpenModal, 
  onToggleSelect, 
  onDelete, 
  isInLote = false 
}) {
  
  // ✅ Porcentaje de daño memoizado
  const porcentajeDaño = useMemo(() => {
    return `${item.datos?.porcentajeDaño}%`;
  }, [item.datos?.porcentajeDaño]);

  // ✅ Cantidad de fotos tomadas
  const cantidadFotos = useMemo(() => {
    if (Array.isArray(item.datos?.fotos) && item.datos.fotos.length > 0) {
      return item.datos.fotos.length;
    }
    if (Array.isArray(item.fotos) && item.fotos.length > 0) {
      return item.fotos.length;
    }
    if (item.datos?.fotoUri || item.fotoUri) {
      return 1;
    }
    return 0;
  }, [item.datos?.fotos, item.datos?.fotoUri, item.fotos, item.fotoUri]);

  // ✅ Estilo del contenedor memoizado
  const containerStyle = useMemo(() => {
    if (isInLote) {
      return [styles.container, styles.containerInLote];
    }
    if (isSelected) {
      return [styles.container, styles.containerSelected];
    }
    return styles.container;
  }, [isInLote, isSelected]);

  // ✅ Estilo del botón delete memoizado
  const deleteButtonStyle = useMemo(() => [
    styles.deleteButton,
    isInLote && styles.deleteButtonDisabled
  ], [isInLote]);

  // ✅ Texto del botón select memoizado
  const selectButtonText = useMemo(() => {
    return isSelected ? 'Quitar' : 'Seleccionar';
  }, [isSelected]);

  // ✅ Icono del botón delete memoizado
  const deleteIcon = useMemo(() => {
    return isInLote ? '🔒' : '🗑️';
  }, [isInLote]);

  // ✅ Eliminar memoizado
  const handleDelete = useCallback(() => {
    if (isInLote) {
      Alert.alert(
        'Muestra en Lote',
        'Esta muestra está asignada a un lote. Debe liberarla desde la pantalla de lotes para poder eliminarla.',
        [{ text: 'OK' }]
      );
      return;
    }
    onDelete();
  }, [isInLote, onDelete]);

  // ✅ Press memoizado
  const handlePress = useCallback(() => {
    if (isInLote) {
      Alert.alert(
        'Muestra en Lote',
        'Esta muestra ya está asignada a un lote',
        [{ text: 'OK' }]
      );
      return;
    }
    onOpenModal(item);
  }, [isInLote, item, onOpenModal]);

  // ✅ Toggle select memoizado
  const handleToggleSelect = useCallback(() => {
    if (!isInLote) {
      onToggleSelect(item.id);
    }
  }, [isInLote, item.id, onToggleSelect]);

  return (
    <TouchableOpacity
      style={containerStyle}
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
          <View style={styles.headerLeft} />
    
          {!isInLote && (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleToggleSelect}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.selectButtonText}>
                {selectButtonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.dañoContainer}>
          <View style={styles.headerLeft}>
            <View style={styles.nombreRow}>
              <Text style={[styles.nombre, isInLote && styles.nombreInLote]}>{item.nombre}</Text>
              <View style={[styles.fotosBadge, cantidadFotos > 0 ? styles.fotosBadgeConFotos : styles.fotosBadgeSinFotos]}>
                <Ionicons 
                  name="camera" 
                  size={13} 
                  color={cantidadFotos > 0 ? '#198754' : '#6c757d'} 
                />
                <Text style={[styles.fotosBadgeText, cantidadFotos > 0 ? styles.fotosTextConFotos : styles.fotosTextSinFotos]}>
                  {cantidadFotos} {cantidadFotos === 1 ? 'foto' : 'fotos'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={deleteButtonStyle}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteButtonText}>
              {deleteIcon}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.dañoValue, isInLote && styles.dañoValueInLote]}>
            {porcentajeDaño}
          </Text>
        </View>
      </View>

      {isSelected && !isInLote && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionText}>✓ SELECCIONADA</Text>
        </View>
      )}

      {isInLote && (
        <View style={styles.loteMessage}>
          <Text style={styles.loteMessageText}>
            📦 Esta muestra está asignada a un lote
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

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
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    opacity: 0.65,
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
  },
  nombreInLote: {
    color: '#777',
  },
  nombreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  fotosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  fotosBadgeConFotos: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  fotosBadgeSinFotos: {
    backgroundColor: '#f1f3f5',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  fotosBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  fotosTextConFotos: {
    color: '#198754',
  },
  fotosTextSinFotos: {
    color: '#6c757d',
  },
  loteIndicator: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  loteText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
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
  dañoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dañoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  dañoValueInLote: {
    color: '#888',
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
    padding: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  loteMessageText: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});