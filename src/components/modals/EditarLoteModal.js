import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandler } from '../../utils/ErrorHandler';
import VerMuestraModal from './VerMuestraModal';

export default function EditarLoteModal({ 
  visible, 
  lote, 
  operacionId,
  cultivo = 'soja', 
  onClose, 
  onActualizar,
  onLiberarMuestra,
  onEliminarLote
}) {
  const [nombreLote, setNombreLote] = useState('');
  const [hectareas, setHectareas] = useState('');
  const [dañoPactado, setDañoPactado] = useState('');
  const [muestras, setMuestras] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [verMuestraModalVisible, setVerMuestraModalVisible] = useState(false);
  const [muestraSeleccionada, setMuestraSeleccionada] = useState(null);

  // ✅ Ref para verificar si está montado
  const isMountedRef = useRef(true);

  // ✅ Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (visible && lote) {
      setNombreLote(lote.nombreLote);
      setHectareas(lote.hectareas.toString());
      setDañoPactado(lote.dañoPactado ? lote.dañoPactado.toString() : '');
      cargarMuestrasDelLote();
    }
  }, [visible, lote]);

  // ✅ Cargar muestras con verificación de montaje
  const cargarMuestrasDelLote = useCallback(async () => {
    if (!lote || !operacionId) return;
    
    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      const data = await AsyncStorage.getItem(`muestras_${operacionId}`);
      if (data) {
        const todasLasMuestras = ErrorHandler.safeJsonParse(data, []);
        const muestrasDelLote = Array.isArray(todasLasMuestras) ? todasLasMuestras.filter(m => 
          m && m.id && lote?.muestrasIds?.includes(m.id)
        ) : [];
        
        if (isMountedRef.current) {
          setMuestras(muestrasDelLote);
        }
      }
    } catch (e) {
      console.warn('Error cargando muestras:', e);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [lote, operacionId]);

  // ✅ Actualizar con validación de montaje
  const handleActualizar = useCallback(() => {
    if (!nombreLote.trim()) {
      Alert.alert('Error', 'El nombre del lote es obligatorio');
      return;
    }

    const hectareasNumero = parseFloat(hectareas);
    if (isNaN(hectareasNumero) || hectareasNumero <= 0) {
      Alert.alert('Error', 'Las hectáreas deben ser un número mayor a 0');
      return;
    }

    const loteActualizado = {
      ...lote,
      nombreLote: nombreLote.trim(),
      hectareas: hectareasNumero,
      dañoPactado: dañoPactado.trim() ? parseFloat(dañoPactado) : null,
    };

    onActualizar(loteActualizado);
  }, [nombreLote, hectareas, dañoPactado, lote, onActualizar]);

  // ✅ Liberar muestra memoizada
  const handleLiberarMuestra = useCallback((muestraId) => {
    const muestra = muestras.find(m => m.id === muestraId);
    
    Alert.alert(
      'Liberar Muestra',
      `¿Seguro que deseas liberar la muestra "${muestra?.nombre}"?\n\nEsta volverá a estar disponible en la pantalla de muestras.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Liberar',
          onPress: async () => {
            const success = await onLiberarMuestra(lote.id, muestraId);
            if (success && isMountedRef.current) {
              const nuevasMuestras = muestras.filter(m => m.id !== muestraId);
              setMuestras(nuevasMuestras);
              
              if (nuevasMuestras.length === 0) {
                Alert.alert(
                  'Lote Vacío',
                  'El lote se ha eliminado porque no tiene muestras.',
                  [{ text: 'OK', onPress: onClose }]
                );
              }
            }
          }
        }
      ]
    );
  }, [muestras, lote, onLiberarMuestra, onClose]);

  // ✅ Eliminar lote memoizado
  const handleEliminarLote = useCallback(() => {
    Alert.alert(
      'Eliminar Lote Completo',
      `¿Estás seguro que deseas eliminar todo el lote "${lote?.nombreLote}"?\n\nTodas las ${muestras.length} muestras volverán a estar disponibles.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: () => {
            onEliminarLote(lote.id);
            onClose();
          }
        }
      ]
    );
  }, [lote, muestras.length, onEliminarLote, onClose]);

  // ✅ Ver muestra memoizado
  const handleVerMuestra = useCallback((muestra) => {
    setMuestraSeleccionada(muestra);
    setVerMuestraModalVisible(true);
  }, []);

  const handleCerrarVerMuestra = useCallback(() => {
    setVerMuestraModalVisible(false);
    setMuestraSeleccionada(null);
  }, []);

  const handleClose = useCallback(() => {
    setNombreLote('');
    setHectareas('');
    setDañoPactado('');
    setMuestras([]);
    onClose();
  }, [onClose]);

  // ✅ Memoizar fenológico display
  const fenologicoDisplay = useMemo(() => {
    return lote?.tipoFenologicoLabel || lote?.tipoFenologico || '-';
  }, [lote]);

  // ✅ Render item memoizado
  const renderMuestra = useCallback(({ item }) => (
    <View style={styles.muestraItem}>
      <TouchableOpacity 
        style={styles.muestraInfo}
        onPress={() => handleVerMuestra(item)}
        activeOpacity={0.7}
      >
        <View style={styles.muestraHeader}>
          <Text style={styles.muestraNombre}>{item.nombre}</Text>
          <Text style={styles.verDetalleText}>👁️ Ver</Text>
        </View>
        <Text style={styles.muestraDaño}>
          Daño: {item.datos.porcentajeDaño || 0}%
        </Text>
      </TouchableOpacity>
    </View>
  ), [handleVerMuestra]);

  // ✅ keyExtractor memoizado
  const keyExtractor = useCallback((item) => item.id, []);

  // ✅ EmptyComponent memoizado
  const EmptyComponent = useMemo(() => (
    <Text style={styles.emptyMuestrasText}>
      No hay muestras asociadas
    </Text>
  ), []);

  if (!lote) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.select({ ios: 'padding', android: 'padding' })}
        keyboardVerticalOffset={Platform.OS === 'android' ? -50 : 0}
      >
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
            <View style={styles.header}>
              <Text style={styles.title}>Editar Lote</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Información del Lote</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nombre del Lote</Text>
                  <TextInput
                    style={styles.input}
                    value={nombreLote}
                    onChangeText={setNombreLote}
                    maxLength={50}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Hectáreas</Text>
                  <TextInput
                    style={styles.input}
                    value={hectareas}
                    onChangeText={setHectareas}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Estado fenológico</Text>
                  <View style={[styles.input, styles.readOnlyInput]}>
                    <Text style={styles.readOnlyText}>
                      {fenologicoDisplay}
                    </Text>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Daño Calculado</Text>
                  <View style={styles.calculatedContainer}>
                    <Text style={styles.calculatedValue}>
                      {lote.dañoReal}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📊 Muestras Asociadas ({muestras.length})
                </Text>
                <Text style={styles.helpText}>
                  💡 Toca una muestra para ver sus detalles
                </Text>
                
                {loading ? (
                  <Text style={styles.loadingText}>Cargando muestras...</Text>
                ) : (
                  <FlatList
                    data={muestras}
                    keyExtractor={keyExtractor}
                    renderItem={renderMuestra}
                    scrollEnabled={false}
                    ListEmptyComponent={EmptyComponent}
                  />
                )}
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.deleteAllButton} 
                onPress={handleEliminarLote}
              >
                <Text style={styles.deleteAllButtonText}>
                  🗑️ Eliminar Lote
                </Text>
              </TouchableOpacity>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleActualizar}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <VerMuestraModal
        visible={verMuestraModalVisible}
        onClose={handleCerrarVerMuestra}
        muestra={muestraSeleccionada}
        cultivo={cultivo}
        tipoFenologico={lote?.tipoFenologico}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
  },
  helpText: {
    fontSize: 12,
    color: '#007bff',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  calculatedContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculatedValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  muestraItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  muestraInfo: {
    flex: 1,
  },
  muestraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  muestraNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  verDetalleText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
  },
  muestraDaño: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  emptyMuestrasText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 0,
  },
  deleteAllButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteAllButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});