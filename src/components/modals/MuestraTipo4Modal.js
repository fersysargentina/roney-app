import React, { useState, useEffect } from 'react';
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

// Generar las etiquetas y placeholders para los 21 campos
const generateLabels = () => {
  const labels = ['En el suelo'];
  for (let i = 1; i <= 10; i++) {
    labels.push(`En vainas abiertas ${i}`);
    labels.push(`En vainas sanas ${i}`);
  }
  return labels;
};
const LABELS = generateLabels();
// ------------------------------------------------

export default function MuestraTipo4Modal({ 
  visible, 
  onClose, 
  onGuardar, 
  valoresIniciales = {}, 
  esEdicion = false 
}) {
  
  //Inicializa el estado de los datos (dato_1 a dato_21)
  const initializeDataState = (initialValues) => {
    return DATOS_FIELDS.reduce((acc, key) => {
      acc[key] = initialValues[key] || '';
      return acc;
    }, {});
  };

  const [data, setData] = useState(initializeDataState(valoresIniciales));
  const [coordenada, setCoordenada] = useState(valoresIniciales.coordenada || '');
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sincroniza estado al cambiar valoresIniciales (para edición/reset)
  useEffect(() => {
    setData(initializeDataState(valoresIniciales));
    setCoordenada(valoresIniciales.coordenada || '');
  }, [valoresIniciales]);

  // Obtiene GPS solo en creación y si es visible
  useEffect(() => {
    if (!esEdicion && visible && !valoresIniciales.coordenada) {
      actualizarCoordenada();
    }
  }, [visible, esEdicion]);

  // Actualiza un campo específico del estado 'data'
  const handleDataChange = (key, text) => {
    setData(prev => ({ ...prev, [key]: text }));
  };

  const handleGuardar = () => {
    // Valida que todos los 21 campos de datos no estén vacíos
    const allFieldsValid = DATOS_FIELDS.every(key => data[key].trim());
    
    if (!allFieldsValid) {
      Alert.alert('Error', 'Todos los campos de datos son obligatorios');
      return;
    }
    
    // CREAA UN ÚNICO OBJETO DE DATOS que incluye los 21 campos y la coordenada
    const datosCompletos = { ...data, coordenada };
    onGuardar(datosCompletos);
  };

  const handleCerrar = () => {
    setData(initializeDataState(valoresIniciales));
    setCoordenada(valoresIniciales.coordenada || '');
    onClose();
  };

  const actualizarCoordenada = async () => {
    if (esEdicion) return;
    
    setLoadingGPS(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesita permiso de ubicación para obtener las coordenadas GPS');
        setCoordenada('Error: Sin permisos de ubicación');
        setLoadingGPS(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
      setCoordenada(coords);
      Alert.alert('Éxito', 'Coordenadas GPS actualizadas');
    } catch (error) {
      console.error('Error obteniendo coordenadas:', error);
      Alert.alert('Error', 'No se pudieron obtener las coordenadas GPS');
      setCoordenada('Error obteniendo coordenadas');
    }

    setLoadingGPS(false);
  };

  const renderDataInputs = () => {
    return DATOS_FIELDS.map((key, index) => {
      const labelText = LABELS[index];
      const placeholderText = LABELS[index]; 

      return (
        <React.Fragment key={key}>
          <Text style={styles.label}>{labelText}:</Text>
          <TextInput
            style={styles.input}
            placeholder={placeholderText}
            value={data[key]}
            onChangeText={(text) => handleDataChange(key, text)}
            keyboardType="numeric"
            returnKeyType={index === DATOS_COUNT - 1 ? 'done' : 'next'}
          />
        </React.Fragment>
      );
    });
  };

  const isSaveDisabled = !DATOS_FIELDS.every(key => data[key].trim());

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
              <Text style={styles.titulo}>
                {esEdicion ? 'Editar Muestra R8' : 'Nueva Muestra R8'}
              </Text>
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
                      style={[
                        styles.input, 
                        styles.coordsInput,
                        esEdicion && styles.coordsInputDisabled
                      ]}
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

              {renderDataInputs()}
              
              <View style={styles.botones}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCerrar}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.button, 
                    styles.saveButton,
                    isSaveDisabled && styles.saveButtonDisabled
                  ]}
                  onPress={handleGuardar}
                  disabled={isSaveDisabled}
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