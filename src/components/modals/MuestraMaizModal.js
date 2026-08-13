import React, { useState, useEffect, useRef } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- CONFIGURACIÓN DE LOS 23 CAMPOS DE DATOS PARA TRIGO ---
const DATOS_COUNT = 23;
const DATOS_FIELDS = Array.from({ length: DATOS_COUNT }, (_, i) => `dato_${i + 1}`);

// Etiquetas específicas para trigo (ajusta según tus necesidades)
const LABELS = [
  'Pérdidas en D',  // dato_1
  'Colgadas en D',  // dato_2
  'Restantes en D', // dato_3
  'Espiga 1 P',     // dato_4
  'Espiga 1 T',     // dato_5
  'Espiga 2 P',     // dato_6
  'Espiga 2 T',     // dato_7
  'Espiga 3 P',     // dato_8
  'Espiga 3 T',     // dato_9
  'Espiga 4 P',     // dato_10
  'Espiga 4 T',     // dato_11
  'Espiga 5 P',     // dato_12
  'Espiga 5 T',     // dato_13
  'Espiga 6 P',     // dato_14
  'Espiga 6 T',     // dato_15
  'Espiga 7 P',     // dato_16
  'Espiga 7 T',     // dato_17
  'Espiga 8 P',     // dato_18
  'Espiga 8 T',     // dato_19
  'Espiga 9 P',     // dato_20
  'Espiga 9 T',     // dato_21
  'Espiga 10 P',    // dato_22
  'Espiga 10 T'   // dato_23
];
// ------------------------------------------------

export default function MuestraMaizModal({ 
  visible, 
  onClose, 
  onGuardar, 
  valoresIniciales = {},
  estadoFenologico = '', 
  esEdicion = false 
}) {
  
  // Función para inicializar el estado de los datos (dato_1 a dato_23)
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
  const insets = useSafeAreaInsets();

  // Sincroniza estado al cambiar valoresIniciales
  useEffect(() => {
    setData(initializeDataState(valoresIniciales));
    setCoordenada(valoresIniciales.coordenada || '');
  }, [valoresIniciales]);

  // Obtiene GPS solo en creación
  useEffect(() => {
    if (!esEdicion && visible && !valoresIniciales.coordenada) {
      actualizarCoordenada();
    }
  }, [visible, esEdicion]);

  // Función para actualizar un campo específico
  const handleDataChange = (key, text) => {
    setData(prev => ({ ...prev, [key]: text }));
  };

  const handleGuardar = () => {
    // Validar que todos los 23 campos estén completos
    const allFieldsValid = DATOS_FIELDS.every(key => data[key].trim());
    
    if (!allFieldsValid) {
      Alert.alert('Error', 'Todos los campos de datos son obligatorios');
      return;
    }
    
    // Crear objeto completo con todos los datos
    const datosCompletos = { ...data, coordenada };
    
    // Llamar a onGuardar pasando el objeto completo
    onGuardar(datosCompletos);
  };

  const handleCerrar = () => {
    setData(initializeDataState(valoresIniciales));
    setCoordenada(valoresIniciales.coordenada || '');
    onClose();
  };

  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const actualizarCoordenada = async () => {
    if (esEdicion || !visibleRef.current) return;
    
    setLoadingGPS(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (!visibleRef.current) return;

      if (status !== 'granted') {
        if (visibleRef.current) {
          Alert.alert('Error', 'Se necesita permiso de ubicación para obtener las coordenadas GPS');
          setCoordenada('Error: Sin permisos de ubicación');
          setLoadingGPS(false);
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

      if (!visibleRef.current) return;

      const coords = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
      setCoordenada(coords);
      Alert.alert('Éxito', 'Coordenadas GPS actualizadas');
    } catch (error) {
      if (!visibleRef.current) return;
      console.error('Error obteniendo coordenadas:', error);
      Alert.alert('Error', 'No se pudieron obtener las coordenadas GPS');
      setCoordenada('Error obteniendo coordenadas');
    } finally {
      if (visibleRef.current) {
        setLoadingGPS(false);
      }
    }
  };

  // Obtener el nombre del estado fenológico para el título
  const getTituloEstado = () => {
    // Mapear el valor del estado a su nombre legible
    const estados = {
      '1': 'Espigamiento (Z.50/59)',
      '2': 'Floración (Z.60/69)',
      '3': 'Lechoso (Z.70/79)',
      '4': 'Pastoso blando (Z.80/84)',
      '5': 'Pastoso duro (Z.85/89)',
      '6': 'Próx. a mudurez (Z.90/99)',
    };
    return estados[estadoFenologico] || 'Trigo';
  };

  // Renderizar los 23 inputs
  const renderDataInputs = () => {
    return DATOS_FIELDS.map((key, index) => {
      const labelText = LABELS[index];

      return (
        <React.Fragment key={key}>
          <Text style={styles.label}>{labelText}:</Text>
          <TextInput
            style={styles.input}
            placeholder={labelText}
            placeholderTextColor="#444444"
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
      <View style={[styles.overlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <KeyboardAvoidingView 
          behavior={Platform.select({ ios: 'padding', android: 'padding' })}
          keyboardVerticalOffset={insets.top + 12}
          style={styles.avoider}
        >
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.titulo}>
                {esEdicion 
                  ? `Editar Muestra - ${getTituloEstado()}` 
                  : `Nueva Muestra - ${getTituloEstado()}`}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCerrar} 
                accessibilityRole="button" 
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView keyboardShouldPersistTaps="handled">
              {/* Coordenadas GPS */}
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

              {/* Campos de datos dinámicos */}
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
    maxHeight: '95%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 4,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 12,
  },
  closeButton: {
    marginTop: 4,
    padding: 6,
    alignSelf: 'center',
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