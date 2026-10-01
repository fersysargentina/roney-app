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
import PhotoCapture from '../PhotoCapture';
import { CoordenadasDmsInput, CoordenadasDmsOverlay } from '../../components/CoordenadasDms';
import { formatearCoordenadasDMS } from '../../utils/coordenadas';
import { obtenerEstadosFenologicos } from '../../utils/fenologicosConfig';

// --- CONFIGURACIÓN DE LOS 3 CAMPOS DE DATOS PARA MAÍZ TIPO 1 (V1-V8) ---
const DATOS_COUNT = 3;
const DATOS_FIELDS = ['dato_1', 'dato_2', 'dato_3'];

const LABELS = [
  'Nacidas en D',       // dato_1
  'Remanentes en D',    // dato_2
  '% defoliacion'       // dato_3
];

export default function MuestraMaizModal({
  visible,
  onClose,
  onGuardar,
  valoresIniciales = {},
  estadoFenologico = '',
  esEdicion = false,
  cultivo = 'Maiz'
}) {

  const initializeDataState = (initialValues) => {
    return DATOS_FIELDS.reduce((acc, key) => {
      acc[key] = initialValues[key] || '';
      return acc;
    }, {});
  };

  const [data, setData] = useState(initializeDataState(valoresIniciales));
  const [coordenada, setCoordenada] = useState(formatearCoordenadasDMS(valoresIniciales.coordenada) || '');
  const [fotos, setFotos] = useState(valoresIniciales.fotos || (valoresIniciales.fotoUri ? [valoresIniciales.fotoUri] : []));
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [editCoordDms, setEditCoordDms] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // Sincroniza estado al cambiar valoresIniciales
  useEffect(() => {
    setData(initializeDataState(valoresIniciales));
    setCoordenada(formatearCoordenadasDMS(valoresIniciales.coordenada) || '');
    setFotos(valoresIniciales.fotos || (valoresIniciales.fotoUri ? [valoresIniciales.fotoUri] : []));
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
    const allFieldsValid = DATOS_FIELDS.every(key => data[key].trim());

    if (!allFieldsValid) {
      Alert.alert('Error', 'Todos los campos de datos son obligatorios');
      return;
    }

    const datosCompletos = {
      ...data,
      coordenada,
      fotos,
      fotoUri: fotos[0] || null,
    };

    onGuardar(datosCompletos);
  };

  const handleCerrar = () => {
    setData(initializeDataState(valoresIniciales));
    setCoordenada(formatearCoordenadasDMS(valoresIniciales.coordenada) || '');
    setFotos(valoresIniciales.fotos || (valoresIniciales.fotoUri ? [valoresIniciales.fotoUri] : []));
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

      const coords = formatearCoordenadasDMS(location.coords.latitude, location.coords.longitude);
      setCoordenada(coords);
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

  const getTituloEstado = () => {
    const estados = obtenerEstadosFenologicos(cultivo);
    const estado = estados.find(e => String(e.value) === String(estadoFenologico));
    const label = estado?.label || '';
    const prefijo = esEdicion ? 'Editar Muestra' : 'Nueva Muestra';
    return label ? `${prefijo} - ${label}` : prefijo;
  };

  // Renderizar los 3 inputs
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
              <Text style={styles.titulo}>{getTituloEstado()}</Text>
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
                    <CoordenadasDmsInput
                      style={[
                        styles.input,
                        styles.coordsInput,
                        esEdicion && styles.coordsInputDisabled
                      ]}
                      value={coordenada}
                      editable={!esEdicion}
                      onEdit={() => setEditCoordDms(true)}
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

              <Text style={styles.gpsEjemplo}>Ejemplo: 34° 36' 13.4" S, 58° 22' 53.7" O</Text>

              {/* Campos de datos dinámicos */}
              {renderDataInputs()}

              <PhotoCapture
                fotos={fotos}
                onFotosChange={setFotos}
                coordenada={coordenada}
                keyPrefix="maiz"
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
        <CoordenadasDmsOverlay
          visible={editCoordDms}
          value={coordenada}
          onClose={() => setEditCoordDms(false)}
          onSave={(v) => { setCoordenada(v); setEditCoordDms(false); }}
        />
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
  gpsEjemplo: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    marginBottom: 8,
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
