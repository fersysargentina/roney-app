import React, { useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ Configuraciones como constantes (fuera del componente)
const LABELS_CONFIG = {
  soja: {
    '1': ['Pérdida en D', 'Restante en D', '% nudos perdidos', '% defoliación'],
    '2': ['Pérdida en D', 'Restante en D', '% nudos perdidos', '% defoliación'],
    '3': ['Pérdida en D', 'Restante en D', '% nudos perdidos', '% defoliación'],
    '4': ['Pérdida en D', 'Restante en D', 'Nudos originales por Planta:', 'Nudos remanentes 1', 'Nudos remanentes 2', 'Nudos remanentes 3', 'Nudos remanentes 4', 'Nudos remanentes 5', '% Defoliación'],
    '5': ['Pérdida en D', 'Restante en D', 'Nudos originales por Planta:', 'Nudos remanentes 1', 'Nudos remanentes 2', 'Nudos remanentes 3', 'Nudos remanentes 4', 'Nudos remanentes 5', '% Defoliación'],
    '6': ['Pérdida en D', 'Restante en D', 'Nudos originales por Planta:', 'Nudos remanentes 1', 'Nudos remanentes 2', 'Nudos remanentes 3', 'Nudos remanentes 4', 'Nudos remanentes 5', '% Defoliación'],
    '7': ['Pérdida en D', 'Restante en D', 'Nudos originales por Planta:', 'Nudos remanentes 1', 'Nudos remanentes 2', 'Nudos remanentes 3', 'Nudos remanentes 4', 'Nudos remanentes 5', '% Defoliación'],
    '8': ['Vainas en el suelo', 'Vainas abiertas (Nudo 1)', 'Vainas Sanas (Nudo 1)', 'Vainas abiertas (Nudo 2)', 'Vainas Sanas (Nudo 2)', 'Vainas abiertas (Nudo 3)', 'Vainas Sanas (Nudo 3)', 'Vainas abiertas (Nudo 4)', 'Vainas Sanas (Nudo 4)', 'Vainas abiertas (Nudo 5)', 'Vainas Sanas (Nudo 5)', '% Defoliación'],
    '9': ['Vainas en el suelo', 'Vainas abiertas (Nudo 1)', 'Vainas Sanas (Nudo 1)', 'Vainas abiertas (Nudo 2)', 'Vainas Sanas (Nudo 2)', 'Vainas abiertas (Nudo 3)', 'Vainas Sanas (Nudo 3)', 'Vainas abiertas (Nudo 4)', 'Vainas Sanas (Nudo 4)', 'Vainas abiertas (Nudo 5)', 'Vainas Sanas (Nudo 5)', '% Defoliación'],
    '10': ['Vainas en el suelo', 'Vainas abiertas (Nudo 1)', 'Vainas Sanas (Nudo 1)', 'Vainas abiertas (Nudo 2)', 'Vainas Sanas (Nudo 2)', 'Vainas abiertas (Nudo 3)', 'Vainas Sanas (Nudo 3)', 'Vainas abiertas (Nudo 4)', 'Vainas Sanas (Nudo 4)', 'Vainas abiertas (Nudo 5)', 'Vainas Sanas (Nudo 5)', '% Defoliación'],
    '11': ['Vainas en el suelo', 'Vainas abiertas (Nudo 1)', 'Vainas Sanas (Nudo 1)', 'Vainas abiertas (Nudo 2)', 'Vainas Sanas (Nudo 2)', 'Vainas abiertas (Nudo 3)', 'Vainas Sanas (Nudo 3)', 'Vainas abiertas (Nudo 4)', 'Vainas Sanas (Nudo 4)', 'Vainas abiertas (Nudo 5)', 'Vainas Sanas (Nudo 5)', '% Defoliación'],
    '12': ['Vainas en el suelo', 'Vainas abiertas (Nudo 1)', 'Vainas Sanas (Nudo 1)', 'Vainas abiertas (Nudo 2)', 'Vainas Sanas (Nudo 2)', 'Vainas abiertas (Nudo 3)', 'Vainas Sanas (Nudo 3)', 'Vainas abiertas (Nudo 4)', 'Vainas Sanas (Nudo 4)', 'Vainas abiertas (Nudo 5)', 'Vainas Sanas (Nudo 5)', '% Defoliación'],
    '13': ['Vainas en el suelo', 'Vainas abiertas 1', 'Vainas Sanas 1', 'Vainas abiertas 2', 'Vainas Sanas 2', 'Vainas abiertas 3', 'Vainas Sanas 3', 'Vainas abiertas 4', 'Vainas Sanas 4', 'Vainas abiertas 5', 'Vainas Sanas 5', 'Vainas abiertas 6', 'Vainas Sanas 6', 'Vainas abiertas 7', 'Vainas Sanas 7', 'Vainas abiertas 8', 'Vainas Sanas 8', 'Vainas abiertas 9', 'Vainas Sanas 9', 'Vainas abiertas 10', 'Vainas Sanas 10']
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
    '2': 'R1-R2',
    '3': 'R3-R4',
    '4': 'R5-R6'
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
  // ✅ Labels memoizados
  const labels = useMemo(() => {
    const cultivoConfig = LABELS_CONFIG[cultivo];
    if (!cultivoConfig) return [];
    
    const tipoConfig = cultivoConfig[tipoFenologico];
    if (!tipoConfig) return [];
    
    return tipoConfig;
  }, [cultivo, tipoFenologico]);

  // ✅ Nombre del estado fenológico memoizado
  const nombreEstado = useMemo(() => {
    const cultivoEstados = ESTADOS_NOMBRES[cultivo];
    if (!cultivoEstados) return `Tipo ${tipoFenologico}`;
    
    return cultivoEstados[tipoFenologico] || `Tipo ${tipoFenologico}`;
  }, [cultivo, tipoFenologico]);

  // ✅ Datos de la muestra memoizados
  const datos = useMemo(() => {
    return muestra?.datos || {};
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
    
    return (
      <View key={key} style={styles.dataRow}>
        <View style={styles.dataIconContainer}>
          <Text style={styles.dataIcon}>📊</Text>
        </View>
        <View style={styles.dataContent}>
          <Text style={styles.dataLabel}>{label}:</Text>
          <Text style={styles.dataValue}>{value || '-'}</Text>
        </View>
      </View>
    );
  }, [datos]);

  // ✅ Renderizar lista de campos memoizada
  const dataFields = useMemo(() => {
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
                    <Text style={styles.gpsText}>{datos.coordenada}</Text>
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Datos de la Muestra</Text>
                <View style={styles.dataContainer}>
                  {dataFields}
                </View>
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
    maxHeight: '90%',
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
  content: {
    padding: 20,
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
});