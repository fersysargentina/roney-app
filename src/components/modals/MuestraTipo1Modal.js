import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { DraftService } from '../../services/DraftService';

const DRAFT_KEY = 'muestra_tipo1_draft';

export default function MuestraTipo1Modal({
  visible,
  onClose,
  onGuardar,
  valoresIniciales = { dato_1: '', dato_2: '', dato_3: '', dato_4: '', coordenada: '' },
  esEdicion = false,
}) {
  const [dato_1, setDato_1] = useState(valoresIniciales.dato_1 || '');
  const [dato_2, setDato_2] = useState(valoresIniciales.dato_2 || '');
  const [dato_3, setDato_3] = useState(valoresIniciales.dato_3 || '');
  const [dato_4, setDato_4] = useState(valoresIniciales.dato_4 || '');
  const [coordenada, setCoordenada] = useState(valoresIniciales.coordenada || '');
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Ref para verificar si está montado
  const isMountedRef = useRef(true);

  // ✅ Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Actualizar valores iniciales con verificación de montaje y borrador
  useEffect(() => {
    if (visible) {
      if (!esEdicion) {
        DraftService.getDraft(DRAFT_KEY).then(draft => {
          if (draft && isMountedRef.current) {
            setDato_1(draft.dato_1 || valoresIniciales.dato_1 || '');
            setDato_2(draft.dato_2 || valoresIniciales.dato_2 || '');
            setDato_3(draft.dato_3 || valoresIniciales.dato_3 || '');
            setDato_4(draft.dato_4 || valoresIniciales.dato_4 || '');
            setCoordenada(draft.coordenada || valoresIniciales.coordenada || '');
            return;
          }
          if (isMountedRef.current) {
            setDato_1(valoresIniciales.dato_1 || '');
            setDato_2(valoresIniciales.dato_2 || '');
            setDato_3(valoresIniciales.dato_3 || '');
            setDato_4(valoresIniciales.dato_4 || '');
            setCoordenada(valoresIniciales.coordenada || '');
          }
        });
      } else {
        setDato_1(valoresIniciales.dato_1 || '');
        setDato_2(valoresIniciales.dato_2 || '');
        setDato_3(valoresIniciales.dato_3 || '');
        setDato_4(valoresIniciales.dato_4 || '');
        setCoordenada(valoresIniciales.coordenada || '');
      }
    }
  }, [visible, valoresIniciales, esEdicion]);

  // Guardar borrador al cambiar los campos
  useEffect(() => {
    if (visible && !esEdicion) {
      DraftService.saveDraft(DRAFT_KEY, { dato_1, dato_2, dato_3, dato_4, coordenada });
    }
  }, [visible, esEdicion, dato_1, dato_2, dato_3, dato_4, coordenada]);

  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  // ✅ Auto-obtener coordenadas en modo creación
  useEffect(() => {
    if (!esEdicion && visible && !valoresIniciales.coordenada) {
      actualizarCoordenada();
    }
  }, [visible, esEdicion, valoresIniciales.coordenada]);

  // ✅ Actualizar coordenada memoizada
  const actualizarCoordenada = useCallback(async () => {
    if (esEdicion || !visibleRef.current) return;
    
    if (isMountedRef.current && visibleRef.current) {
      setLoadingGPS(true);
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (!isMountedRef.current || !visibleRef.current) return;

      if (status !== 'granted') {
        if (isMountedRef.current && visibleRef.current) {
          Alert.alert('Error', 'Se necesita permiso de ubicación para obtener las coordenadas GPS');
          setCoordenada('Error: Sin permisos de ubicación');
        }
        return;
      }

      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('GPS timeout')), 8000)
        )
      ]);

      if (!isMountedRef.current || !visibleRef.current) return;

      const coords = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
      
      if (isMountedRef.current && visibleRef.current) {
        setCoordenada(coords);
        Alert.alert('Éxito', 'Coordenadas GPS actualizadas');
      }
    } catch (error) {
      if (!isMountedRef.current || !visibleRef.current) return;
      console.error('Error obteniendo coordenadas:', error);
      Alert.alert('Error', 'No se pudieron obtener las coordenadas GPS');
      setCoordenada('Error obteniendo coordenadas');
    } finally {
      if (isMountedRef.current && visibleRef.current) {
        setLoadingGPS(false);
      }
    }
  }, [esEdicion]);

  // ✅ Validación de campos memoizada
  const camposValidos = useMemo(() => {
    return dato_1.trim() && dato_2.trim() && dato_3.trim() && dato_4.trim();
  }, [dato_1, dato_2, dato_3, dato_4]);

  // ✅ Guardar memoizado
  const handleGuardar = useCallback(() => {
    if (!camposValidos) {
      Alert.alert('Error', 'Todos los campos de datos son obligatorios');
      return;
    }
    
    const datosMuestra = {
      dato_1: dato_1,
      dato_2: dato_2,
      dato_3: dato_3,
      dato_4: dato_4,
      coordenada: coordenada
    };
    
    DraftService.clearDraft(DRAFT_KEY);
    onGuardar(datosMuestra); 
    onClose();
  }, [camposValidos, dato_1, dato_2, dato_3, dato_4, coordenada, onGuardar, onClose]);

  // ✅ Cerrar memoizado con reset de valores
  const handleCerrar = useCallback(() => {
    DraftService.clearDraft(DRAFT_KEY);
    setDato_1(valoresIniciales.dato_1 || '');
    setDato_2(valoresIniciales.dato_2 || '');
    setDato_3(valoresIniciales.dato_3 || '');
    setDato_4(valoresIniciales.dato_4 || '');
    setCoordenada(valoresIniciales.coordenada || '');
    onClose();
  }, [valoresIniciales, onClose]);

  // ✅ Título memoizado
  const titulo = useMemo(() => {
    return esEdicion ? 'Editar Muestra V1-Vn' : 'Nueva Muestra V1-Vn';
  }, [esEdicion]);

  // ✅ Estilos dinámicos memoizados
  const coordsInputStyle = useMemo(() => [
    styles.input, 
    styles.coordsInput,
    esEdicion && styles.coordsInputDisabled
  ], [esEdicion]);

  const saveButtonStyle = useMemo(() => [
    styles.button, 
    styles.saveButton,
    !camposValidos && styles.saveButtonDisabled
  ], [camposValidos]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={handleCerrar}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.avoider}
        >
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.titulo}>{titulo}</Text>
              <TouchableOpacity 
                onPress={handleCerrar} 
                accessibilityRole="button" 
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Coordenadas GPS:</Text>
              <View style={styles.gpsContainer}>
                {loading ? (
                  <ActivityIndicator style={styles.loadingCoords} />
                ) : (
                  <>
                    <TextInput
                      style={coordsInputStyle}
                      placeholder="Coordenadas GPS (lat, long)"
                      placeholderTextColor="#444444"
                      value={coordenada}
                      onChangeText={setCoordenada}
                      editable={!esEdicion}
                    />
                    
                    {!esEdicion && (
                      <TouchableOpacity
                        style={styles.gpsButton}
                        onPress={actualizarCoordenada}
                        disabled={loadingGPS}
                      >
                        {loadingGPS ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Ionicons name="location" size={20} color="white" />
                        )}
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>

              <Text style={styles.label}>Pérdida en D:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingrese dato 1"
                placeholderTextColor="#444444"
                value={dato_1}
                onChangeText={setDato_1}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={styles.label}>Restante en D:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingrese dato 2"
                placeholderTextColor="#444444"
                value={dato_2}
                onChangeText={setDato_2}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={styles.label}>% nudos perdidos:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingrese dato 3"
                placeholderTextColor="#444444"
                value={dato_3}
                onChangeText={setDato_3}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={styles.label}>% defoliación:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingrese dato 4"
                placeholderTextColor="#444444"
                value={dato_4}
                onChangeText={setDato_4}
                keyboardType="numeric"
                returnKeyType="done"
              />
              
              <View style={styles.botones}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCerrar}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={saveButtonStyle}
                  onPress={handleGuardar}
                  disabled={!camposValidos}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avoider: {
    width: '100%',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
    color: '#000000',
  },
  coordsInput: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  coordsInputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  gpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  gpsButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    minWidth: 50,
  },
  loadingCoords: {
    padding: 20,
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});