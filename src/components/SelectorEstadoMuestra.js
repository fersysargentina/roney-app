import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function SelectorEstadoMuestra({
  estadoActual,
  estados = [],
  onSeleccionar,
  deshabilitado = false,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const labelActual = (estados || []).find(e => String(e.value) === String(estadoActual))?.label || 'Seleccionar';

  const handleSeleccionar = (value) => {
    setModalVisible(false);
    onSeleccionar && onSeleccionar(value);
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.campo, deshabilitado && styles.campoDeshabilitado]}
        onPress={() => { if (!deshabilitado) setModalVisible(true); }}
        disabled={deshabilitado}
        accessibilityRole="button"
        accessibilityLabel="Estado fenológico"
      >
        <Text
          style={[
            styles.campoTexto,
            !estadoActual && styles.campoTextoPlaceholder,
          ]}
          numberOfLines={1}
        >
          {labelActual}
        </Text>
        <Text style={styles.campoFlecha}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Estado fenológico</Text>
            <FlatList
              data={estados || []}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleSeleccionar(item.value)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      String(item.value) === String(estadoActual) && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {String(item.value) === String(estadoActual) && (
                    <Text style={styles.modalOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  campoDeshabilitado: {
    backgroundColor: '#f0f0f0',
  },
  campoTexto: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  campoTextoPlaceholder: {
    color: '#777',
    fontStyle: 'italic',
  },
  campoFlecha: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  modalOptionCheck: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalCloseBtn: {
    marginTop: 15,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
});
