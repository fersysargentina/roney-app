import React, { useMemo, useCallback, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatearCoordenadasDMS } from '../../utils/coordenadas';
import { mapearEstadoATipoModal, normalizarCultivo, obtenerEstadosFenologicos } from '../../utils/fenologicosConfig';

// ✅ Configuraciones como constantes (fuera del componente)
const LABELS_CONFIG = {
  soja: {
    '1': ['Nacidas en D', 'Remanentes en D', '% nudos perdidos', '% defoliación'],
    '2': ['Pérdida en D', 'Restante en D', '% nudos perdidos', '% defoliación'],
    '3': ['Pérdida en D', 'Restante en D', 'Nudos originales por Planta:', 'Nudos remanentes 1', 'Nudos remanentes 2', 'Nudos remanentes 3', 'Nudos remanentes 4', 'Nudos remanentes 5', '% Defoliación'],
    '4': ['Vainas en el suelo', 'Vainas abiertas (Nudo 1)', 'Vainas Sanas (Nudo 1)', 'Vainas abiertas (Nudo 2)', 'Vainas Sanas (Nudo 2)', 'Vainas abiertas (Nudo 3)', 'Vainas Sanas (Nudo 3)', 'Vainas abiertas (Nudo 4)', 'Vainas Sanas (Nudo 4)', 'Vainas abiertas (Nudo 5)', 'Vainas Sanas (Nudo 5)', '% Defoliación'],
  },
  maiz: {
    '1': ['Nacidas en D', 'Remanentes en D', '% defoliacion'],
    '2': ['Nacidas en D', 'Remanentes en D', 'N° de hileras promedio', 'Largo hilera promedio', 'Granos perdidos totales', '% defoliacion'],
  },
  trigo: {
    '1': ['Pérdidas en D', 'Colgadas en D', 'Restantes en D', 'Espiga 1 P', 'Espiga 1 T', 'Espiga 2 P', 'Espiga 2 T', 'Espiga 3 P', 'Espiga 3 T', 'Espiga 4 P', 'Espiga 4 T', 'Espiga 5 P', 'Espiga 5 T', 'Espiga 6 P', 'Espiga 6 T', 'Espiga 7 P', 'Espiga 7 T', 'Espiga 8 P', 'Espiga 8 T', 'Espiga 9 P', 'Espiga 9 T', 'Espiga 10 P', 'Espiga 10 T'],
    '2': ['Pérdidas en D', 'Colgadas en D', 'Restantes en D', 'Espiga 1 P', 'Espiga 1 T', 'Espiga 2 P', 'Espiga 2 T', 'Espiga 3 P', 'Espiga 3 T', 'Espiga 4 P', 'Espiga 4 T', 'Espiga 5 P', 'Espiga 5 T', 'Espiga 6 P', 'Espiga 6 T', 'Espiga 7 P', 'Espiga 7 T', 'Espiga 8 P', 'Espiga 8 T', 'Espiga 9 P', 'Espiga 9 T', 'Espiga 10 P', 'Espiga 10 T'],
    '3': ['Pérdidas en D', 'Colgadas en D', 'Restantes en D', 'Espiga 1 P', 'Espiga 1 T', 'Espiga 2 P', 'Espiga 2 T', 'Espiga 3 P', 'Espiga 3 T', 'Espiga 4 P', 'Espiga 4 T', 'Espiga 5 P', 'Espiga 5 T', 'Espiga 6 P', 'Espiga 6 T', 'Espiga 7 P', 'Espiga 7 T', 'Espiga 8 P', 'Espiga 8 T', 'Espiga 9 P', 'Espiga 9 T', 'Espiga 10 P', 'Espiga 10 T'],
    '4': ['Pérdidas en D', 'Colgadas en D', 'Restantes en D', 'Espiga 1 P', 'Espiga 1 T', 'Espiga 2 P', 'Espiga 2 T', 'Espiga 3 P', 'Espiga 3 T', 'Espiga 4 P', 'Espiga 4 T', 'Espiga 5 P', 'Espiga 5 T', 'Espiga 6 P', 'Espiga 6 T', 'Espiga 7 P', 'Espiga 7 T', 'Espiga 8 P', 'Espiga 8 T', 'Espiga 9 P', 'Espiga 9 T', 'Espiga 10 P', 'Espiga 10 T'],
    '5': ['Pérdidas en D', 'Colgadas en D', 'Restantes en D', 'Espiga 1 P', 'Espiga 1 T', 'Espiga 2 P', 'Espiga 2 T', 'Espiga 3 P', 'Espiga 3 T', 'Espiga 4 P', 'Espiga 4 T', 'Espiga 5 P', 'Espiga 5 T', 'Espiga 6 P', 'Espiga 6 T', 'Espiga 7 P', 'Espiga 7 T', 'Espiga 8 P', 'Espiga 8 T', 'Espiga 9 P', 'Espiga 9 T', 'Espiga 10 P', 'Espiga 10 T'],
    '6': ['Pérdidas en D', 'Colgadas en D', 'Restantes en D', 'Espiga 1 P', 'Espiga 1 T', 'Espiga 2 P', 'Espiga 2 T', 'Espiga 3 P', 'Espiga 3 T', 'Espiga 4 P', 'Espiga 4 T', 'Espiga 5 P', 'Espiga 5 T', 'Espiga 6 P', 'Espiga 6 T', 'Espiga 7 P', 'Espiga 7 T', 'Espiga 8 P', 'Espiga 8 T', 'Espiga 9 P', 'Espiga 9 T', 'Espiga 10 P', 'Espiga 10 T']
  },
  girasol: {
    '1': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion'],
    '2': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion'],
    '3': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion'],
    '4': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion'],
    '5': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion'],
    '6': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion'],
    '7': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion'],
    '8': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion'],
    '9': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion'],
    '10': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion'],
    '11': ['Pérdida en D', 'Improduct en D', 'Restante en D', '% promedio daño capít.', '% defoliacion']
  }
};

const ESTADOS_NOMBRES = {
  soja: {
    '1': 'V1-Vn',
    '2': 'R1-R3,5',
    '3': 'R4-R7',
    '4': 'R8'
  },
  maiz: {
    '1': 'V1-V8',
    '2': 'V9-R6'
  },
  trigo: {
    '1': 'Espigamiento (Z.50/59)',
    '2': 'Floración (Z.60/69)',
    '3': 'Lechoso (Z.70/79)',
    '4': 'Pastoso blando (Z.80/84)',
    '5': 'Pastoso duro (Z.85/89)',
    '6': 'Próx. a madurez (Z.90/99)'
  },
  girasol: {
    '1': 'V1-V11',
    '2': 'V12-Vn',
    '3': 'R1 (estrella)',
    '4': 'R2 (botón a 0,5 - 2 cm)',
    '5': 'R3 (botón a + de 2 cm)',
    '6': 'R4 (apertura inflorescencia)',
    '7': 'R5 (inicio floración)',
    '8': 'R6 (fin floración)',
    '9': 'R7 (envés capítulo inicio amarilleo)',
    '10': 'R8 (envés capítulo amarillo)',
    '11': 'R9 (brácteas amarillo/marrón)',
  }
};

export default function VerMuestraModal({ 
  visible, 
  onClose, 
  muestra,
  cultivo = 'soja',
  tipoFenologico = '1'
}) {
  // ✅ Insets de safe area (obligatorio llamar al hook siempre)
  const insets = useSafeAreaInsets();

  // ✅ Estado para visor de fotos a pantalla completa
  const [fotoFullscreenVisible, setFotoFullscreenVisible] = useState(false);
  const [fotoFullscreenIndex, setFotoFullscreenIndex] = useState(0);

  // ✅ Fotos de la muestra (array de URIs)
  // Las fotos se guardan en muestra.datos.fotos / datos.fotoUri (estructura real de la muestra)
  const fotos = useMemo(() => {
    const f = muestra?.datos?.fotos ?? muestra?.fotos;
    const fUri = muestra?.datos?.fotoUri ?? muestra?.fotoUri;
    if (Array.isArray(f) && f.length > 0) return f;
    return fUri ? [fUri] : [];
  }, [muestra?.datos?.fotos, muestra?.datos?.fotoUri, muestra?.fotos, muestra?.fotoUri]);

  const tieneFotos = fotos.length > 0;

  // ✅ Labels memoizados
  const labels = useMemo(() => {
    // La prop puede venir como "Maíz", "Cebada", etc. → normalizar a la clave interna ('maiz', 'trigo', ...)
    const c = normalizarCultivo(cultivo);
    const cultivoConfig = LABELS_CONFIG[c];
    if (!cultivoConfig) {
      console.warn('⚠️ VerMuestraModal: No config for cultivo:', cultivo, '→', c);
      return [];
    }
    
    // Mapear el valor del estado fenológico al tipo de modal
    // Nota: MAPEO_TIPO_MODAL.trigo retorna 'trigo' (tipo de modal único); los labels
    // de trigo están indexados por el value del estado (1-6, Zadoks)
    let tipoModal = mapearEstadoATipoModal(c, tipoFenologico);
    if (tipoModal === 'trigo') tipoModal = String(tipoFenologico);
    
    const tipoConfig = cultivoConfig[tipoModal];
    if (!tipoConfig) {
      console.warn('⚠️ VerMuestraModal: No config for tipoFenologico:', tipoFenologico, 'mapped to tipoModal:', tipoModal, 'in cultivo:', c);
      console.log('Available keys:', Object.keys(cultivoConfig));
      return [];
    }
    
    return tipoConfig;
  }, [cultivo, tipoFenologico]);

  // ✅ Nombre del estado fenológico memoizado
  const nombreEstado = useMemo(() => {
    const c = normalizarCultivo(cultivo);
    // Buscar el label real del estado (ej: "V2", "Floración (Z.60/69)") por su value
    const estados = obtenerEstadosFenologicos(c);
    const estado = estados.find(e => String(e.value) === String(tipoFenologico));
    if (estado) return estado.label;

    // Fallback: nombre por tipo de modal
    const cultivoEstados = ESTADOS_NOMBRES[c];
    if (!cultivoEstados) return `Tipo ${tipoFenologico}`;
    
    let tipoModal = mapearEstadoATipoModal(c, tipoFenologico);
    if (tipoModal === 'trigo') tipoModal = String(tipoFenologico);
    return cultivoEstados[tipoModal] || `Tipo ${tipoFenologico}`;
  }, [cultivo, tipoFenologico]);

  // ✅ Datos de la muestra memoizados
  const datos = useMemo(() => {
    const data = muestra?.datos || {};
    console.log('🔍 VerMuestraModal - datos recibidos:', data);
    console.log('🔍 VerMuestraModal - cultivo:', cultivo, 'tipoFenologico:', tipoFenologico);
    console.log('🔍 VerMuestraModal - labels:', labels);
    return data;
  }, [muestra]);

  // ✅ Verificar si hay coordenadas memoizado
  const tieneCoordenas = useMemo(() => {
    return Boolean(datos.coordenada);
  }, [datos.coordenada]);

  // ✅ Verificar si hay porcentaje de daño memoizado
  const tienePorcentajeDano = useMemo(() => {
    return datos.porcentajeDaño !== undefined;
  }, [datos.porcentajeDaño]);

  // ✅ Renderizar campo de dato memoizado
  const renderDataField = useCallback((label, key, index) => {
    const value = datos[key];
    console.log(`📊 Render field: ${label} (${key}) =`, value);
    
    return (
      <View key={key} style={styles.dataRow}>
        <View style={styles.dataIconContainer}>
          <Text style={styles.dataIcon}>📊</Text>
        </View>
        <View style={styles.dataContent}>
          <Text style={styles.dataLabel}>{label}:</Text>
          <Text style={styles.dataValue}>{value !== undefined && value !== null && value !== '' ? value : '-'}</Text>
        </View>
      </View>
    );
  }, [datos]);

  // ✅ Renderizar lista de campos memoizada
  const dataFields = useMemo(() => {
    if (labels.length === 0) {
      console.warn('⚠️ No labels found for cultivo:', cultivo, 'tipoFenologico:', tipoFenologico);
      return <Text style={styles.noDataText}>No hay datos configurados para este cultivo/estado fenológico</Text>;
    }
    return labels.map((label, index) => {
      const key = `dato_${index + 1}`;
      return renderDataField(label, key, index);
    });
  }, [labels, renderDataField]);

  // ✅ Estilo del valor de daño memoizado
  const danioValueStyle = useMemo(() => [
    styles.infoValue, 
    styles.danioValue
  ], []);

  if (!muestra) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={[styles.overlay, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8, paddingLeft: 16, paddingRight: 16 }]}>
          <View style={[styles.modalContainer, { marginTop: insets.top + 8, marginBottom: insets.bottom + 8 }]}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Ver Muestra</Text>
                {/* <Text style={styles.subtitle}>{nombreEstado}</Text> */}
              </View>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.content}>
                {/* Información General */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>ℹ️ Información General</Text>
                  
                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Nombre:</Text>
                      <Text style={styles.infoValue}>{muestra.nombre}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Fecha:</Text>
                      <Text style={styles.infoValue}>{muestra.fecha}</Text>
                    </View>
                    
                    {tienePorcentajeDano && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Daño Calculado:</Text>
                        <Text style={danioValueStyle}>
                          {datos.porcentajeDaño}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {tieneCoordenas && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 Coordenadas GPS</Text>
                    <View style={styles.gpsCard}>
                      <Ionicons name="location" size={20} color="#007bff" />
                      <Text style={styles.gpsText}>{formatearCoordenadasDMS(datos.coordenada)}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📊 Datos de la Muestra</Text>
                  <View style={styles.dataContainer}>
                    {dataFields}
                  </View>

                  {tieneFotos && (
                    <View style={styles.fotosContainer}>
                      <Text style={styles.fotosSubtitle}>📸 Fotos de la muestra ({fotos.length}):</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.fotosRow}
                      >
                        {fotos.map((item, index) => (
                          <TouchableOpacity
                            key={`ver_foto_${index}_${item}`}
                            style={styles.fotoItem}
                            onPress={() => {
                              setFotoFullscreenIndex(index);
                              setFotoFullscreenVisible(true);
                            }}
                            activeOpacity={0.8}
                          >
                            <Image source={{ uri: item }} style={styles.fotoThumbnail} />
                            <View style={styles.fotoCounter}>
                              <Text style={styles.fotoCounterText}>
                                {index + 1} / {fotos.length}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={styles.fotoHint}>
                        Toca una foto para verla a pantalla completa
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.closeFooterButton} 
                onPress={onClose}
              >
                <Text style={styles.closeFooterButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal pantalla completa para ver fotos */}
      <Modal
        visible={fotoFullscreenVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setFotoFullscreenVisible(false)}
      >
        <View style={styles.fullscreenOverlay}>
          {fotos.length > 1 && (
            <TouchableOpacity
              style={styles.fullscreenNav}
              onPress={() => setFotoFullscreenIndex((i) => (i === 0 ? fotos.length - 1 : i - 1))}
              hitSlop={{ left: 50, right: 50, top: 100, bottom: 100 }}
            >
              <Ionicons name="chevron-back" size={40} color="#fff" />
            </TouchableOpacity>
          )}
          <ScrollView
            style={styles.fullscreenScroll}
            contentContainerStyle={styles.fullscreenScrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <Image
              source={{ uri: fotos[fotoFullscreenIndex] }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </ScrollView>
          {fotos.length > 1 && (
            <TouchableOpacity
              style={[styles.fullscreenNav, styles.fullscreenNavRight]}
              onPress={() => setFotoFullscreenIndex((i) => (i === fotos.length - 1 ? 0 : i + 1))}
              hitSlop={{ left: 50, right: 50, top: 100, bottom: 100 }}
            >
              <Ionicons name="chevron-forward" size={40} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={styles.fullscreenHeader}>
            <Text style={styles.fullscreenCounter}>
              {fotoFullscreenIndex + 1} / {fotos.length}
            </Text>
            <TouchableOpacity
              style={styles.fullscreenClose}
              onPress={() => setFotoFullscreenVisible(false)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
    minHeight: '70%',
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
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginTop: 2,
    alignSelf: 'center',
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
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
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  danioValue: {
    color: '#dc3545',
    fontSize: 16,
  },
  gpsCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  gpsText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  dataContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fotosContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  fotosSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataIconContainer: {
    width: 32,
    alignItems: 'center',
  },
  dataIcon: {
    fontSize: 16,
  },
  dataContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 12,
  },
  dataLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: 'bold',
    textAlign: 'right',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeFooterButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Fotos (carrusel solo lectura)
  fotoItem: {
    position: 'relative',
    marginRight: 12,
  },
  fotosRow: {
    paddingVertical: 4,
    paddingRight: 10,
  },
  fotoThumbnail: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#007bff',
    backgroundColor: '#eee',
  },
  fotoCounter: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fotoCounterText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fotoHint: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Fullscreen foto
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  fullscreenScroll: {
    flex: 1,
  },
  fullscreenScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.75,
  },
  fullscreenNav: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullscreenNavRight: {
    left: 'auto',
    right: 0,
  },
  fullscreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    zIndex: 20,
  },
  fullscreenCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullscreenClose: {
    padding: 8,
  },
});