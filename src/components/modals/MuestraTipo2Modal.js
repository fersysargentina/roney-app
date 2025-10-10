import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  Platform, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function MuestraTipo2Modal({ 
  visible, 
  onClose, 
  onGuardar, 
  valoresIniciales = { 
    dato_1: '', 
    dato_2: '', 
    dato_3: '', 
    dato_4: '', 
    dato_5: '', 
    dato_6: '', 
    dato_7: '', 
    dato_8: '', 
    dato_9: '', 
    coordenada: '' 
  }, 
  esEdicion = false 
}) {
  const [dato_1, setDato_1] = useState(valoresIniciales.dato_1 || ''); // PERDIDA EN D
  const [dato_2, setDato_2] = useState(valoresIniciales.dato_2 || ''); // RESTANTE EN D
  const [dato_3, setDato_3] = useState(valoresIniciales.dato_3 || ''); // ORIGINALES POR PLANTA
  const [dato_4, setDato_4] = useState(valoresIniciales.dato_4 || ''); // Nudos remanentes 1
  const [dato_5, setDato_5] = useState(valoresIniciales.dato_5 || ''); // Nudos remanentes 2
  const [dato_6, setDato_6] = useState(valoresIniciales.dato_6 || ''); // Nudos remanentes 3
  const [dato_7, setDato_7] = useState(valoresIniciales.dato_7 || ''); // Nudos remanentes 4
  const [dato_8, setDato_8] = useState(valoresIniciales.dato_8 || ''); // Nudos remanentes 5
  const [dato_9, setDato_9] = useState(valoresIniciales.dato_9 || ''); // Defoliación
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

  // ✅ Actualizar valores iniciales con verificación de montaje
  useEffect(() => {
    if (visible) {
      setDato_1(valoresIniciales.dato_1 || '');
      setDato_2(valoresIniciales.dato_2 || '');
      setDato_3(valoresIniciales.dato_3 || '');
      setDato_4(valoresIniciales.dato_4 || '');
      setDato_5(valoresIniciales.dato_5 || '');
      setDato_6(valoresIniciales.dato_6 || '');
      setDato_7(valoresIniciales.dato_7 || '');
      setDato_8(valoresIniciales.dato_8 || '');
      setDato_9(valoresIniciales.dato_9 || '');
      setCoordenada(valoresIniciales.coordenada || '');
    }
  }, [visible, valoresIniciales]);

  // ✅ Auto-obtener coordenadas en modo creación
  useEffect(() => {
    if (!esEdicion && visible && !valoresIniciales.coordenada) {
      actualizarCoordenada();
    }
  }, [visible, esEdicion, valoresIniciales.coordenada]);

  // ✅ Actualizar coordenada memoizada
  const actualizarCoordenada = useCallback(async () => {
    if (esEdicion) return;
    
    if (isMountedRef.current) {
      setLoadingGPS(true);
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesita permiso de ubicación para obtener las coordenadas GPS');
        if (isMountedRef.current) {
          setCoordenada('Error: Sin permisos de ubicación');
        }
        return;
      }

      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('GPS timeout')), 10000)
        )
      ]);

      const coords = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
      
      if (isMountedRef.current) {
        setCoordenada(coords);
        Alert.alert('Éxito', 'Coordenadas GPS actualizadas');
      }
    } catch (error) {
      console.error('Error obteniendo coordenadas:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'No se pudieron obtener las coordenadas GPS');
        setCoordenada('Error obteniendo coordenadas');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingGPS(false);
      }
    }
  }, [esEdicion]);

  // ✅ Validación de campos memoizada (todos los 9 datos + coordenada)
  const camposValidos = useMemo(() => {
    return dato_1.trim() && 
           dato_2.trim() && 
           dato_3.trim() && 
           dato_4.trim() && 
           dato_5.trim() && 
           dato_6.trim() && 
           dato_7.trim() && 
           dato_8.trim() && 
           dato_9.trim() && 
           coordenada.trim();
  }, [dato_1, dato_2, dato_3, dato_4, dato_5, dato_6, dato_7, dato_8, dato_9, coordenada]);

  // ✅ Guardar memoizado
  const handleGuardar = useCallback(() => {
    if (!camposValidos) {
      Alert.alert('Error', 'Todos los campos de datos y la coordenada son obligatorios');
      return;
    }

    const datosMuestra = {
      dato_1: dato_1,
      dato_2: dato_2,
      dato_3: dato_3,
      dato_4: dato_4,
      dato_5: dato_5,
      dato_6: dato_6,
      dato_7: dato_7,
      dato_8: dato_8,
      dato_9: dato_9,
      coordenada: coordenada
    };
    
    onGuardar(datosMuestra); 
    onClose();
  }, [camposValidos, dato_1, dato_2, dato_3, dato_4, dato_5, dato_6, dato_7, dato_8, dato_9, coordenada, onGuardar, onClose]);

  // ✅ Cerrar memoizado con reset de valores
  const handleCerrar = useCallback(() => {
    setDato_1(valoresIniciales.dato_1 || '');
    setDato_2(valoresIniciales.dato_2 || '');
    setDato_3(valoresIniciales.dato_3 || '');
    setDato_4(valoresIniciales.dato_4 || '');
    setDato_5(valoresIniciales.dato_5 || '');
    setDato_6(valoresIniciales.dato_6 || '');
    setDato_7(valoresIniciales.dato_7 || '');
    setDato_8(valoresIniciales.dato_8 || '');
    setDato_9(valoresIniciales.dato_9 || '');
    setCoordenada(valoresIniciales.coordenada || '');
    onClose();
  }, [valoresIniciales, onClose]);

  // ✅ Título memoizado
  const titulo = useMemo(() => {
    return esEdicion ? 'Editar Muestra R1-R3,5' : 'Nueva Muestra R1-R3,5';
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
                placeholder="Pérdida en D"
                value={dato_1}
                onChangeText={setDato_1}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={styles.label}>Restante en D:</Text>
              <TextInput
                style={styles.input}
                placeholder="Restante en D"
                value={dato_2}
                onChangeText={setDato_2}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={styles.label}>Nudos originales por Planta:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nudos originales por Planta"
                value={dato_3}
                onChangeText={setDato_3}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={styles.label}>Nudos remanentes 1:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nudos remanentes 1"
                value={dato_4}
                onChangeText={setDato_4}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={styles.label}>Nudos remanentes 2:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nudos remanentes 2"
                value={dato_5}
                onChangeText={setDato_5}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>Nudos remanentes 3:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nudos remanentes 3"
                value={dato_6}
                onChangeText={setDato_6}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>Nudos remanentes 4:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nudos remanentes 4"
                value={dato_7}
                onChangeText={setDato_7}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>Nudos remanentes 5:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nudos remanentes 5"
                value={dato_8}
                onChangeText={setDato_8}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>% Defoliación:</Text>
              <TextInput
                style={styles.input}
                placeholder="% Defoliación"
                value={dato_9}
                onChangeText={setDato_9}
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
    paddingTop: Platform.OS === 'android' ? 40 : 0, 
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