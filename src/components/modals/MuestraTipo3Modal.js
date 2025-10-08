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
  Alert
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function MuestraTipo3Modal({ visible, onClose, onGuardar, valoresIniciales = {}, esEdicion = false }) {
  // 1. DEFINICIÓN DE ESTADOS LOCALES (12 DATOS + GPS)
  // Datos 1 al 4 existentes (usamos nombres descriptivos como sugerencia)
  const [dato_1, setDato_1] = useState(valoresIniciales.dato_1 || ''); // Vainas en el suelo
  const [dato_2, setDato_2] = useState(valoresIniciales.dato_2 || ''); // Vainas Abiertas 1
  const [dato_3, setDato_3] = useState(valoresIniciales.dato_3 || ''); // Vainas Sanas 1
  const [dato_4, setDato_4] = useState(valoresIniciales.dato_4 || ''); // Vainas Abiertas 2
  
  // Nuevos 8 datos (dato_5 a dato_12)
  const [dato_5, setDato_5] = useState(valoresIniciales.dato_5 || ''); // Vainas Sanas 2
  const [dato_6, setDato_6] = useState(valoresIniciales.dato_6 || ''); // Vainas Abiertas 3
  const [dato_7, setDato_7] = useState(valoresIniciales.dato_7 || ''); // Vainas Sanas 3
  const [dato_8, setDato_8] = useState(valoresIniciales.dato_8 || ''); // Vainas Abiertas 4
  const [dato_9, setDato_9] = useState(valoresIniciales.dato_9 || ''); // Vainas Sanas 4
  const [dato_10, setDato_10] = useState(valoresIniciales.dato_10 || ''); // Vainas Abiertas 5
  const [dato_11, setDato_11] = useState(valoresIniciales.dato_11 || ''); // Vainas Sanas 5
  const [dato_12, setDato_12] = useState(valoresIniciales.dato_12 || ''); // Defoliación

  const [coordenada, setCoordenada] = useState(valoresIniciales.coordenada || '');
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loading] = useState(false);

  // 2. ACTUALIZACIÓN DE ESTADOS AL CAMBIAR valoresIniciales
  useEffect(() => {
    setDato_1(valoresIniciales.dato_1 || '');
    setDato_2(valoresIniciales.dato_2 || '');
    setDato_3(valoresIniciales.dato_3 || '');
    setDato_4(valoresIniciales.dato_4 || '');
    setDato_5(valoresIniciales.dato_5 || '');
    setDato_6(valoresIniciales.dato_6 || '');
    setDato_7(valoresIniciales.dato_7 || '');
    setDato_8(valoresIniciales.dato_8 || '');
    setDato_9(valoresIniciales.dato_9 || '');
    setDato_10(valoresIniciales.dato_10 || '');
    setDato_11(valoresIniciales.dato_11 || '');
    setDato_12(valoresIniciales.dato_12 || '');
    setCoordenada(valoresIniciales.coordenada || '');
  }, [valoresIniciales]);

  useEffect(() => {
    if (!esEdicion && visible && !valoresIniciales.coordenada) {
      actualizarCoordenada();
    }
  }, [visible]);

  // 3. HANDLE GUARDAR (ADAPTADO A OBJETO)
  const handleGuardar = () => {
    // Validar los 12 campos y la coordenada
    if (
        !dato_1.trim() || !dato_2.trim() || !dato_3.trim() || !dato_4.trim() ||
        !dato_5.trim() || !dato_6.trim() || !dato_7.trim() || !dato_8.trim() ||
        !dato_9.trim() || !dato_10.trim() || !dato_11.trim() || !dato_12.trim() ||
        !coordenada.trim()
    ) {
      Alert.alert('Error', 'Todos los campos de datos y la coordenada son obligatorios');
      return;
    }

    // Empaquetar todos los 12 datos y la coordenada en un objeto
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
        dato_10: dato_10,
        dato_11: dato_11,
        dato_12: dato_12,
        coordenada: coordenada
    };

    onGuardar(datosMuestra); // Llamar con el objeto
    onClose();
  };

  // 4. HANDLE CERRAR (ADAPTADO A 12 DATOS)
  const handleCerrar = () => {
    // Resetear los 12 estados
    setDato_1(valoresIniciales.dato_1 || '');
    setDato_2(valoresIniciales.dato_2 || '');
    setDato_3(valoresIniciales.dato_3 || '');
    setDato_4(valoresIniciales.dato_4 || '');
    setDato_5(valoresIniciales.dato_5 || '');
    setDato_6(valoresIniciales.dato_6 || '');
    setDato_7(valoresIniciales.dato_7 || '');
    setDato_8(valoresIniciales.dato_8 || '');
    setDato_9(valoresIniciales.dato_9 || '');
    setDato_10(valoresIniciales.dato_10 || '');
    setDato_11(valoresIniciales.dato_11 || '');
    setDato_12(valoresIniciales.dato_12 || '');
    
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

      // Obtener ubicación actual
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

  // Función auxiliar para verificar si todos los campos están llenos (para deshabilitar el botón)
  const isFormValid = () => {
      return (
          dato_1.trim() && dato_2.trim() && dato_3.trim() && dato_4.trim() &&
          dato_5.trim() && dato_6.trim() && dato_7.trim() && dato_8.trim() &&
          dato_9.trim() && dato_10.trim() && dato_11.trim() && dato_12.trim() &&
          coordenada.trim()
      );
  };

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
              <Text style={styles.titulo}>
                {esEdicion ? 'Editar Muestra R4-R7' : 'Nueva Muestra R4-R7 (12 Datos)'}
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
                      value={coordenada}
                      onChangeText={setCoordenada}
                      editable={!esEdicion}
                    />
                    
                    {/* Botón de actualizar GPS solo visible en creación */}
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

              {/* Campos de datos (12 en total) */}
              
              <Text style={styles.label}>Vainas en el suelo:</Text>
              <TextInput
                style={styles.input}
                placeholder="Vainas en el suelo"
                value={dato_1}
                onChangeText={setDato_1}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={styles.label}>Vainas Abiertas (Nudo 1):</Text>
              <TextInput
                style={styles.input}
                placeholder="Vainas Abiertas (Nudo 1)"
                value={dato_2}
                onChangeText={setDato_2}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={styles.label}>Vainas Sanas (Nudo 1):</Text>
              <TextInput
                style={styles.input}
                placeholder="Vainas Sanas (Nudo 1)"
                value={dato_3}
                onChangeText={setDato_3}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={styles.label}>Vainas Abiertas (Nudo 2):</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingrese dato 4"
                value={dato_4}
                onChangeText={setDato_4}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>Vainas Sanas (Nudo 2):</Text>
              <TextInput
                style={styles.input}
                placeholder="Vainas Sanas (Nudo 2)"
                value={dato_5}
                onChangeText={setDato_5}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>Vainas Abiertas (Nudo 3):</Text>
              <TextInput
                style={styles.input}
                placeholder="Vainas Abiertas (Nudo 3)"
                value={dato_6}
                onChangeText={setDato_6}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>Vainas Sanas (Nudo 3):</Text>
              <TextInput
                style={styles.input}
                placeholder="Vainas Sanas (Nudo 3)"
                value={dato_7}
                onChangeText={setDato_7}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>Vainas Abiertas (Nudo 4):</Text>
              <TextInput
                style={styles.input}
                placeholder="Vainas Abiertas (Nudo 4)"
                value={dato_8}
                onChangeText={setDato_8}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>Vainas Sanas (Nudo 4):</Text>
              <TextInput
                style={styles.input}
                placeholder="Vainas Sanas (Nudo 4)"
                value={dato_9}
                onChangeText={setDato_9}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>Vainas Abiertas (Nudo 5):</Text>
              <TextInput
                style={styles.input}
                placeholder="Vainas Abiertas (Nudo 5)"
                value={dato_10}
                onChangeText={setDato_10}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>Vainas Sanas (Nudo 5):</Text>
              <TextInput
                style={styles.input}
                placeholder="Vainas Sanas (Nudo 5)"
                value={dato_11}
                onChangeText={setDato_11}
                keyboardType="numeric"
                returnKeyType="next"
              />

              <Text style={styles.label}>% Defoliación:</Text>
              <TextInput
                style={styles.input}
                placeholder="% Defoliación"
                value={dato_12}
                onChangeText={setDato_12}
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
                  style={[
                    styles.button, 
                    styles.saveButton,
                    !isFormValid() && styles.saveButtonDisabled
                  ]}
                  onPress={handleGuardar}
                  disabled={!isFormValid()}
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
    maxHeight: '90%', // Ajustado para que quepa mejor en pantalla con muchos campos
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