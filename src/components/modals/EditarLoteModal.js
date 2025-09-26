import React, { useState, useEffect } from 'react';
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

export default function EditarLoteModal({ 
  visible, 
  lote, 
  operacionId,
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

  useEffect(() => {
    if (visible && lote) {
      setNombreLote(lote.nombreLote);
      setHectareas(lote.hectareas.toString());
      setDañoPactado(lote.dañoPactado ? lote.dañoPactado.toString() : '');
      cargarMuestrasDelLote();
    }
  }, [visible, lote]);

  const cargarMuestrasDelLote = async () => {
    if (!lote || !operacionId) return;
    
    setLoading(true);
    try {
      const data = await AsyncStorage.getItem(`muestras_${operacionId}`);
      if (data) {
        const todasLasMuestras = JSON.parse(data);
        const muestrasDelLote = todasLasMuestras.filter(m => 
          lote.muestrasIds.includes(m.id)
        );
        setMuestras(muestrasDelLote);
      }
    } catch (e) {
      console.warn('Error cargando muestras:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleActualizar = () => {
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
  };

  const handleLiberarMuestra = (muestraId) => {
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
            if (success) {
              // Actualizar la lista local de muestras
              const nuevasMuestras = muestras.filter(m => m.id !== muestraId);
              setMuestras(nuevasMuestras);
              
              // Si no quedan muestras, cerrar el modal
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
  };

  const handleEliminarLote = () => {
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
  };

  const handleClose = () => {
    setNombreLote('');
    setHectareas('');
    setDañoPactado('');
    setMuestras([]);
    onClose();
  };

  const renderMuestra = ({ item }) => (
    <View style={styles.muestraItem}>
      <View style={styles.muestraInfo}>
        <Text style={styles.muestraNombre}>{item.nombre}</Text>
        <Text style={styles.muestraDetalles}>
          Tipo {item.tipo} • {item.fecha}
        </Text>
        <Text style={styles.muestraDaño}>
          Daño: {item.datos.porcentajeDaño || 0}%
        </Text>
      </View>
      <TouchableOpacity
        style={styles.liberarButton}
        onPress={() => handleLiberarMuestra(item.id)}
      >
        <Text style={styles.liberarButtonText}>↩️</Text>
      </TouchableOpacity>
    </View>
  );

  const totalHectareasMuestras = muestras.length; // Por ahora, cada muestra = 1 "unidad"

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Editar Lote</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {/* Información del lote */}
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
                  <Text style={styles.label}>Daño Real (Calculado)</Text>
                  <View style={styles.calculatedContainer}>
                    <Text style={styles.calculatedValue}>
                      {lote.dañoReal}%
                    </Text>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Daño Pactado</Text>
                  <TextInput
                    style={styles.input}
                    value={dañoPactado}
                    onChangeText={setDañoPactado}
                    keyboardType="numeric"
                    placeholder="Opcional"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Lista de muestras */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📊 Muestras Asociadas ({muestras.length})
                </Text>
                
                {loading ? (
                  <Text style={styles.loadingText}>Cargando muestras...</Text>
                ) : (
                  <FlatList
                    data={muestras}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMuestra}
                    scrollEnabled={false}
                    ListEmptyComponent={
                      <Text style={styles.emptyMuestrasText}>
                        No hay muestras asociadas
                      </Text>
                    }
                  />
                )}
              </View>
            </View>

            {/* Botones de acción */}
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

            {/* Footer con información */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                📏 Total de muestras: {totalHectareasMuestras}
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  },
  muestraInfo: {
    flex: 1,
  },
  muestraNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  muestraDetalles: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  muestraDaño: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '600',
  },
  liberarButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff3cd',
  },
  liberarButtonText: {
    fontSize: 16,
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
  footer: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});