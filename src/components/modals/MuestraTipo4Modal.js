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
  Alert,
  SafeAreaView
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// --- CONFIGURACIÓN DE LOS 21 CAMPOS DE DATOS ---
const DATOS_COUNT = 21;
const DATOS_FIELDS = Array.from({ length: DATOS_COUNT }, (_, i) => `dato_${i + 1}`);

// ✅ Generar etiquetas una sola vez (constante)
const LABELS = (() => {
  const labels = ['En el suelo'];
  for (let i = 1; i <= 10; i++) {
    labels.push(`En vainas abiertas ${i}`);
    labels.push(`En vainas sanas ${i}`);
  }
  return labels;
})();
// ------------------------------------------------

export default function MuestraTipo4Modal({ 
  visible, 
  onClose, 
  onGuardar, 
  valoresIniciales = {}, 
  esEdicion = false 
}) {
  
  // ✅ Función de inicialización memoizada
  const initializeDataState = useCallback((initialValues) => {
    return DATOS_FIELDS.reduce((acc, key) => {
      acc[key] = initialValues[key] || '';
      return acc;
    }, {});
  }, []);

  const [data, setData] = useState(() => initializeDataState(valoresIniciales));
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

  // ✅ Sincroniza estado al cambiar valoresIniciales
  useEffect(() => {
    if (visible) {
      setData(initializeDataState(valoresIniciales));
      setCoordenada(valoresIniciales.coordenada || '');
    }
  }, [visible, valoresIniciales, initializeDataState]);

  // ✅ Obtiene GPS solo en creación y si es visible
  useEffect(() => {
    if (!esEdicion && visible && !valoresIniciales.coordenada) {
      actualizarCoordenada();
    }
  }, [visible, esEdicion, valoresIniciales.coordenada]);

  // ✅ Actualiza un campo específico del estado 'data' - memoizado
  const handleDataChange = useCallback((key, text) => {
    setData(prev => ({ ...prev, [key]: text }));
  }, []);

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

  // ✅ Validación de campos memoizada
  const camposValidos = useMemo(() => {
    return DATOS_FIELDS.every(key => data[key]?.trim());
  }, [data]);

  // ✅ Guardar memoizado
  const handleGuardar = useCallback(() => {
    if (!camposValidos) {
      Alert.alert('Error', 'Todos los campos de datos son obligatorios');
      return;
    }
    
    const datosCompletos = { ...data, coordenada };
    onGuardar(datosCompletos);
  }, [camposValidos, data, coordenada, onGuardar]);

  // ✅ Cerrar memoizado
  const handleCerrar = useCallback(() => {
    setData(initializeDataState(valoresIniciales));
    setCoordenada(valoresIniciales.coordenada || '');
    onClose();
  }, [valoresIniciales, initializeDataState, onClose]);

  // ✅ Render de inputs memoizado
  const renderDataInputs = useMemo(() => {
    return DATOS_FIELDS.map((key, index) => {
      const labelText = LABELS[index];

      return (
        <React.Fragment key={key}>
          <Text style={styles.label}>{labelText}:</Text>
          <TextInput
            style={styles.input}
            placeholder={labelText}
            value={data[key]}
            onChangeText={(text) => handleDataChange(key, text)}
            keyboardType="numeric"
            returnKeyType={index === DATOS_COUNT - 1 ? 'done' : 'next'}
          />
        </React.Fragment>
      );
    });
  }, [data, handleDataChange]);

  // ✅ Título memoizado
  const titulo = useMemo(() => {
    return esEdicion ? 'Editar Muestra R8' : 'Nueva Muestra R8';
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
      <SafeAreaView style={styles.safeArea}>
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

                {renderDataInputs}
                
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
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1,
  },
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
    maxHeight: '95%',
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