import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { formatearCoordenadasDMS } from '../utils/coordenadas';

const MAX_PHOTOS = 5;
const IMAGE_QUALITY = 0.5;
const WATERMARK_QUALITY = 0.7;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Two internal screens inside the camera modal
const SCREEN_CAMERA = 'camera';
const SCREEN_PREVIEW = 'preview';

export default function PhotoCapture({
  fotos = [],
  onFotosChange,
  coordenada = '',
  roneyOp = '',
  disabled = false,
}) {
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(SCREEN_CAMERA);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [captureTime, setCaptureTime] = useState('');
  const [selectedPhotoForViewer, setSelectedPhotoForViewer] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const cameraRef = useRef(null);
  const previewRef = useRef(null);

  const watermarkText = useMemo(() => {
    const coordTexto = (coordenada && coordenada.trim())
      ? formatearCoordenadasDMS(coordenada.trim())
      : 'Sin GPS';
    return coordTexto + ' | ' + captureTime;
  }, [coordenada, captureTime]);

  const handleOpenCameraButton = useCallback(async () => {
    if (fotos.length >= MAX_PHOTOS) {
      Alert.alert('Límite alcanzado', 'Ya has tomado el máximo de 5 fotos para esta muestra.');
      return;
    }

    const perm = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();

    if (!perm.granted) {
      Alert.alert(
        'Permiso requerido',
        'Se necesita acceso a la cámara para tomar fotografías de las muestras.'
      );
      return;
    }

    setCameraReady(false);
    setPreviewPhoto(null);
    setCurrentScreen(SCREEN_CAMERA);
    setCameraVisible(true);
  }, [fotos.length, cameraPermission, requestCameraPermission]);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || isSaving) return;

    try {
      setIsSaving(true);
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-AR');
      setCaptureTime(dateStr);
      const photo = await cameraRef.current.takePictureAsync({
        quality: IMAGE_QUALITY,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setPreviewPhoto(photo);
        setCurrentScreen(SCREEN_PREVIEW);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto. Intentá nuevamente.');
    } finally {
      setIsSaving(false);
    }
  }, [cameraReady, isSaving]);

  // Descartar foto (NO) — vuelve a la cámara
  const handleDiscardPhoto = useCallback(() => {
    setPreviewPhoto(null);
    setCurrentScreen(SCREEN_CAMERA);
  }, []);

  // Confirmar y guardar foto (SI) — vuelve a la cámara, o cierra si llegó al límite
  const handleSavePhoto = useCallback(async () => {
    if (!previewPhoto || !previewRef.current) return;

    setIsSaving(true);
    try {
      const composedUri = await captureRef(previewRef.current, {
        format: 'jpg',
        quality: WATERMARK_QUALITY,
        result: 'tmpfile',
      });

      const filename = 'foto_' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '.jpg';
      const destination = FileSystem.documentDirectory + filename;
      await FileSystem.copyAsync({ from: composedUri, to: destination });

      const updatedFotos = [...fotos, destination];
      onFotosChange?.(updatedFotos);
      setPreviewPhoto(null);

      if (updatedFotos.length >= MAX_PHOTOS) {
        // Límite alcanzado → cierra la cámara y vuelve al modal padre
        setCameraVisible(false);
        Alert.alert('Límite alcanzado', 'Has alcanzado el máximo de 5 fotos permitidas.');
      } else {
        // Todavía hay lugar → vuelve a la cámara
        setCurrentScreen(SCREEN_CAMERA);
      }
    } catch (error) {
      console.error('Error al guardar foto con marca de agua:', error);
      Alert.alert('Error', 'No se pudo procesar la foto con marca de agua.');
    } finally {
      setIsSaving(false);
    }
  }, [previewPhoto, fotos, onFotosChange]);

  // Eliminar foto desde la cruz o desde el viewer
  const confirmDeletePhoto = useCallback((index) => {
    Alert.alert(
      'Eliminar foto',
      '¿Seguro que deseas eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updated = fotos.filter((_, i) => i !== index);
            onFotosChange?.(updated);
            if (selectedPhotoForViewer) {
              setSelectedPhotoForViewer(null);
            }
          },
        },
      ]
    );
  }, [fotos, onFotosChange, selectedPhotoForViewer]);

  return (
    <View style={styles.container}>
      {/* ─── Carrusel de miniaturas si hay fotos ─── */}
      {fotos.length > 0 && (
        <View style={styles.carouselContainer}>
          <Text style={styles.carouselTitle}>Fotos de la muestra ({fotos.length}/{MAX_PHOTOS}):</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselScroll}
          >
            {fotos.map((uri, idx) => (
              <View key={`${uri}_${idx}`} style={styles.thumbWrapper}>
                <TouchableOpacity
                  onPress={() => setSelectedPhotoForViewer(uri)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri }} style={styles.thumbnail} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBadge}
                  onPress={() => confirmDeletePhoto(idx)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ─── Botón de lado a lado arriba de guardar y cancelar ─── */}
      <TouchableOpacity
        style={[
          styles.takePhotoBtn,
          fotos.length >= MAX_PHOTOS && styles.takePhotoBtnDisabled,
        ]}
        onPress={handleOpenCameraButton}
        disabled={fotos.length >= MAX_PHOTOS || disabled}
      >
        <Ionicons name="camera" size={22} color="#fff" />
        <Text style={styles.takePhotoBtnText}>
          {fotos.length >= MAX_PHOTOS
            ? 'Límite de fotos alcanzado (5/5)'
            : `Tomar Foto (${fotos.length}/${MAX_PHOTOS})`}
        </Text>
      </TouchableOpacity>

      {/* ─── Modal de Cámara Fullscreen ─── */}
      <Modal
        visible={cameraVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          setPreviewPhoto(null);
          setCurrentScreen(SCREEN_CAMERA);
          setCameraVisible(false);
        }}
      >
        <View style={styles.fullScreen}>

          {/* ════ Pantalla Cámara ════ */}
          {currentScreen === SCREEN_CAMERA && (
            <View style={styles.fullScreen}>
              <SafeAreaView style={styles.cameraTopBarSafe}>
                <View style={styles.cameraTopBar}>
                  <View style={styles.counterBadge}>
                    <Text style={styles.counterText}>
                      {fotos.length} / {MAX_PHOTOS} fotos
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeCameraBtn}
                    onPress={() => setCameraVisible(false)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={32} color="#fff" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              <CameraView
                ref={cameraRef}
                style={styles.cameraView}
                facing="back"
                onCameraReady={() => setCameraReady(true)}
              />

              <View style={styles.shutterContainer}>
                <Text style={styles.cameraHint}>
                  {cameraReady ? 'Enfocá y tocá el botón para disparar' : 'Iniciando cámara...'}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.shutterButton,
                    (!cameraReady || isSaving) && styles.shutterButtonDisabled,
                  ]}
                  onPress={takePhoto}
                  disabled={!cameraReady || isSaving}
                >
                  {isSaving
                    ? <ActivityIndicator color="#000" size="large" />
                    : <View style={styles.shutterInner} />}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ════ Pantalla Preview ════ */}
          {currentScreen === SCREEN_PREVIEW && previewPhoto && (
            <View style={styles.previewScreen}>
              {/* Recuadro capturable: foto + marca de agua */}
              <View ref={previewRef} collapsable={false} style={styles.photoBox}>
                <Image
                  source={{ uri: previewPhoto.uri }}
                  style={styles.photoBoxImage}
                  resizeMode="cover"
                />
                <View style={styles.watermarkBar}>
                  <Text style={styles.watermarkText} numberOfLines={2}>
                    {watermarkText}
                  </Text>
                </View>
              </View>

              {/* Panel de decisión debajo del recuadro */}
              <View style={styles.decisionPanel}>
                <Text style={styles.decisionQuestion}>¿Usar esta foto?</Text>
                <View style={styles.decisionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.decisionBtn, styles.btnNo]}
                    onPress={handleDiscardPhoto}
                    disabled={isSaving}
                  >
                    <Text style={styles.decisionBtnText}>NO</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.decisionBtn, styles.btnYes]}
                    onPress={handleSavePhoto}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.decisionBtnText}>SÍ</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

        </View>
      </Modal>

      {/* ─── Modal Visor de Foto Fullscreen ─── */}
      <Modal
        visible={!!selectedPhotoForViewer}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedPhotoForViewer(null)}
      >
        <View style={styles.viewerScreen}>
          <SafeAreaView style={styles.viewerTopBar}>
            <TouchableOpacity
              style={styles.viewerCloseBtn}
              onPress={() => setSelectedPhotoForViewer(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {selectedPhotoForViewer && (
            <Image
              source={{ uri: selectedPhotoForViewer }}
              style={styles.viewerFullImage}
              resizeMode="contain"
            />
          )}

          <SafeAreaView style={styles.viewerBottomBar}>
            <TouchableOpacity
              style={styles.viewerDeleteBtn}
              onPress={() => {
                const idx = fotos.indexOf(selectedPhotoForViewer);
                if (idx !== -1) {
                  confirmDeletePhoto(idx);
                }
              }}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.viewerDeleteBtnText}>Eliminar Foto</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },

  // Carrusel
  carouselContainer: {
    marginBottom: 10,
  },
  carouselTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
  },
  carouselScroll: {
    paddingVertical: 4,
    paddingRight: 10,
  },
  thumbWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#007bff',
    backgroundColor: '#eee',
  },
  deleteBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc3545',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  // Botón Tomar Foto de lado a lado
  takePhotoBtn: {
    width: '100%',
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  takePhotoBtnDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.8,
  },
  takePhotoBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Pantalla compartida (fullscreen negro)
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraTopBarSafe: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 30 : 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  cameraTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  counterBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeCameraBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cameraView: {
    flex: 1,
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cameraHint: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  shutterButtonDisabled: {
    opacity: 0.4,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },

  // Pantalla Preview — foto en recuadro + panel de decisión debajo
  previewScreen: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
  },
  photoBox: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.55,
    backgroundColor: '#000',
    position: 'relative',
  },
  photoBoxImage: {
    width: '100%',
    height: '100%',
  },
  watermarkBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  watermarkText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  decisionPanel: {
    backgroundColor: '#1a1a1a',
    paddingTop: 20,
    paddingBottom: Platform.OS === 'android' ? 28 : 36,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  decisionQuestion: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  decisionButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  decisionBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNo: {
    backgroundColor: '#dc3545',
  },
  btnYes: {
    backgroundColor: '#28a745',
  },
  decisionBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Visor Fullscreen
  viewerScreen: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerTopBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 30 : 0,
    right: 20,
    zIndex: 10,
  },
  viewerCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerFullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  viewerBottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  viewerDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  viewerDeleteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
