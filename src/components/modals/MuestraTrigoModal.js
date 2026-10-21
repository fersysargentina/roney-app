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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DraftService } from '../../services/DraftService';
import PhotoCapture from '../PhotoCapture';
import { CoordenadasDmsInput, CoordenadasDmsOverlay } from '../../components/CoordenadasDms';
import { parseInputNumber } from '../../utils/calculoDeDano';
import { formatearCoordenadasDMS } from '../../utils/coordenadas';
import { obtenerEstadosFenologicos } from '../../utils/fenologicosConfig';
import { validarDatosMuestra, normalizarConteos } from '../../utils/validacionMuestras';
import SelectorEstadoMuestra from '../SelectorEstadoMuestra';

const DRAFT_KEY = 'muestra_trigo_draft';

// --- CONFIGURACIÓN DE LOS 23 CAMPOS DE DATOS PARA TRIGO ---
const DATOS_COUNT = 23;
const DATOS_FIELDS = Array.from({ length: DATOS_COUNT }, (_, i) => `dato_${i + 1}`);

const LABELS = [
  'Plantas/Espigas Nacidas en D',  // dato_1
  'Plantas/Espigas Colgadas en D',  // dato_2
  'Plantas/Espigas restantes en Pie en D', // dato_3
  'Espiga 1 - Granos Perdidos',     // dato_4
  'Espiga 1 - Granos Totales',     // dato_5
  'Espiga 2 - Granos Perdidos',     // dato_6
  'Espiga 2 - Granos Totales',     // dato_7
  'Espiga 3 - Granos Perdidos',     // dato_8
  'Espiga 3 - Granos Totales',     // dato_9
  'Espiga 4 - Granos Perdidos',     // dato_10
  'Espiga 4 - Granos Totales',     // dato_11
  'Espiga 5 - Granos Perdidos',     // dato_12
  'Espiga 5 - Granos Totales',     // dato_13
  'Espiga 6 - Granos Perdidos',     // dato_14
  'Espiga 6 - Granos Totales',     // dato_15
  'Espiga 7 - Granos Perdidos',     // dato_16
  'Espiga 7 - Granos Totales',     // dato_17
  'Espiga 8 - Granos Perdidos',     // dato_18
  'Espiga 8 - Granos Totales',     // dato_19
  'Espiga 9 - Granos Perdidos',     // dato_20
  'Espiga 9 - Granos Totales',     // dato_21
  'Espiga 10 - Granos Perdidos',    // dato_22
  'Espiga 10 - Granos Totales'   // dato_23
];
// ------------------------------------------------

export default function MuestraTrigoModal({
  visible,
  onClose,
  onGuardar,
  valoresIniciales = {},
  estadoFenologico = '',
  esEdicion = false,
  cultivo = 'Trigo',
  estadoMuestra,
  estadosPermitidos,
  onCambiarEstado,
}) {

  // Función para inicializar el estado de los datos (dato_1 a dato_23)
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
  const [estadoSel, setEstadoSel] = useState('');
  const insets = useSafeAreaInsets();

  // Sincroniza estado al cambiar valoresIniciales y recupera borrador si existe
  useEffect(() => {
    if (visible) {
      setEstadoSel(estadoMuestra ?? '');
      if (!esEdicion) {
        DraftService.getDraft(DRAFT_KEY).then(draft => {
          if (draft) {
            setData(initializeDataState(draft));
            setCoordenada(formatearCoordenadasDMS(draft.coordenada || valoresIniciales.coordenada) || '');
          } else {
            setData(initializeDataState(valoresIniciales));
            setCoordenada(formatearCoordenadasDMS(valoresIniciales.coordenada) || '');
            setFotos(valoresIniciales.fotos || (valoresIniciales.fotoUri ? [valoresIniciales.fotoUri] : []));
          }
        });
      } else {
        setData(initializeDataState(valoresIniciales));
        setCoordenada(formatearCoordenadasDMS(valoresIniciales.coordenada) || '');
        setFotos(valoresIniciales.fotos || (valoresIniciales.fotoUri ? [valoresIniciales.fotoUri] : []));
      }
    }
  }, [visible, valoresIniciales, esEdicion, estadoMuestra]);

  // Auto-guardado de borrador al escribir
  useEffect(() => {
    if (visible && !esEdicion) {
      DraftService.saveDraft(DRAFT_KEY, { ...data, coordenada });
    }
  }, [visible, esEdicion, data, coordenada]);

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
    const validacion = validarDatosMuestra('trigo', data);

    if (!validacion.ok) {
      Alert.alert('Error', validacion.mensaje);
      return;
    }

    // Crea objeto completo con todos los datos
    const datosCompletos = normalizarConteos('trigo', {
      ...data,
      coordenada,
      fotos,
      fotoUri: fotos[0] || null,
    });

    DraftService.clearDraft(DRAFT_KEY);
    // Llama a onGuardar pasando el objeto completo
    onGuardar(datosCompletos);
  };

  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const handleCerrar = () => {
    DraftService.clearDraft(DRAFT_KEY);
    setData(initializeDataState(valoresIniciales));
    setCoordenada(formatearCoordenadasDMS(valoresIniciales.coordenada) || '');
    setFotos(valoresIniciales.fotos || (valoresIniciales.fotoUri ? [valoresIniciales.fotoUri] : []));
    onClose();
  };

  const actualizarCoordenada = async () => {
    if (esEdicion || !visibleRef.current) return;

    setLoadingGPS(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (!visibleRef.current) return;

      if (status !== 'granted') {
        if (visibleRef.current) {
          Alert.alert('Error', 'Se necesita permiso de ubicación para obtener las coordenadas GPS');
          setCoordenada('');
          setLoadingGPS(false);
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

      if (!visibleRef.current) return;

      const coords = formatearCoordenadasDMS(location.coords.latitude, location.coords.longitude);
      setCoordenada(coords);
    } catch (error) {
      if (!visibleRef.current) return;
      console.error('Error obteniendo coordenadas:', error);
      Alert.alert('Error', 'No se pudieron obtener las coordenadas GPS');
      setCoordenada('');
    } finally {
      if (visibleRef.current) {
        setLoadingGPS(false);
      }
    }
  };

  const getTituloEstado = () => {
    const prefijo = esEdicion ? 'Editar Muestra' : 'Nueva Muestra';
    const valorTitulo = esEdicion ? estadoSel : estadoFenologico;
    let label = (estadosPermitidos || []).find(e => String(e.value) === String(valorTitulo))?.label || '';
    if (!label) {
      const estados = obtenerEstadosFenologicos(cultivo);
      const estado = estados.find(e => String(e.value) === String(estadoFenologico));
      label = estado?.label || '';
    }
    return label ? `${prefijo} - ${label}` : prefijo;
  };

  const perdidasEnD = Math.max(
    0,
    parseInputNumber(data.dato_1) - parseInputNumber(data.dato_2) - parseInputNumber(data.dato_3)
  );

  const mostrarPerdidas =
    String(data.dato_1 ?? '').trim() !== '' ||
    String(data.dato_2 ?? '').trim() !== '' ||
    String(data.dato_3 ?? '').trim() !== '';

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
          {index === 2 && mostrarPerdidas && (
            <Text style={styles.perdidasText}>
                Plantas/Espigas Perdidas en D: {String(Number(perdidasEnD.toFixed(2)))}
            </Text>
          )}
        </React.Fragment>
      );
    });
  };

  const isSaveDisabled = !coordenada.trim() ||
    coordenada.trim().startsWith('Error');

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
                {esEdicion && (
                  <View style={styles.estadoGroup}>
                    <Text style={styles.label}>Estado fenológico</Text>
                    <SelectorEstadoMuestra
                      estadoActual={estadoSel}
                      estados={estadosPermitidos || []}
                      onSeleccionar={(v) => { setEstadoSel(v); onCambiarEstado && onCambiarEstado(v); }}
                    />
                  </View>
                )}

                <Text style={styles.label}>Coordenadas GPS:</Text>
                <View style={styles.gpsContainer}>
                  {loadingGPS ? (
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

                <Text style={styles.gpsEjemplo}>D : Distancia/Plantas de Muestreo</Text>

                {renderDataInputs()}

                <PhotoCapture
                  fotos={fotos}
                  onFotosChange={setFotos}
                  coordenada={coordenada}
                  keyPrefix="trigo"
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
        </View>
        <CoordenadasDmsOverlay
          visible={editCoordDms}
          value={coordenada}
          onClose={() => setEditCoordDms(false)}
          onSave={(v) => { setCoordenada(v); setEditCoordDms(false); }}
        />
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
    marginTop: 5,
    marginBottom: 5,
  },
  estadoGroup: {
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 7,
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
    marginBottom: 7,
  },
  gpsEjemplo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
  perdidasText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 4,
    marginBottom: 8,
  },
});