import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const DMS_REGEX = /(\d{1,3})°\s*(\d{1,2})'\s*(\d{1,2}(?:[.,]\d{1,2})?)"\s*([NS])\s*,\s*(\d{1,3})°\s*(\d{1,2})'\s*(\d{1,2}(?:[.,]\d{1,2})?)"\s*([EO])/i;

export function CoordenadasDmsInput({ value, editable = true, onEdit, style }) {
  const vacio = !value || !String(value).trim();
  return (
    <TouchableOpacity
      style={[styles.field, style]}
      onPress={onEdit}
      disabled={!editable}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel="Editar coordenadas GPS"
    >
      <Text
        numberOfLines={1}
        style={[styles.fieldText, vacio && styles.fieldTextEmpty]}
      >
        {vacio ? 'Tocá para cargar la coordenada GPS' : value}
      </Text>
    </TouchableOpacity>
  );
}

export function CoordenadasDmsOverlay({ visible, value, onClose, onSave }) {
  const [latD, setLatD] = useState('');
  const [latM, setLatM] = useState('');
  const [latS, setLatS] = useState('');
  const [lonD, setLonD] = useState('');
  const [lonM, setLonM] = useState('');
  const [lonS, setLonS] = useState('');

  useEffect(() => {
    const reset = () => {
      setLatD('');
      setLatM('');
      setLatS('');
      setLonD('');
      setLonM('');
      setLonS('');
    };
    if (!visible) {
      reset();
      return;
    }
    const m = value ? DMS_REGEX.exec(String(value)) : null;
    if (m) {
      setLatD(m[1]);
      setLatM(m[2]);
      setLatS(m[3]);
      setLonD(m[5]);
      setLonM(m[6]);
      setLonS(m[7]);
    } else {
      reset();
    }
  }, [visible, value]);

  if (!visible) return null;

  const campos = [latD, latM, latS, lonD, lonM, lonS];

  const handleAceptar = () => {
    if (campos.some(c => String(c).trim() === '')) {
      Alert.alert('Error', 'Completá los 6 campos (grados, minutos y segundos).');
      return;
    }
    const norm = campos.map(c => String(c).trim().replace(',', '.'));
    const nums = norm.map(n => Number(n));
    if (nums.some(n => !Number.isFinite(n))) {
      Alert.alert('Error', 'Ingresá solo números.');
      return;
    }
    if (![nums[0], nums[1], nums[3], nums[4]].every(n => Number.isInteger(n))) {
      Alert.alert('Error', 'Grados y minutos deben ser números enteros.');
      return;
    }
    if (nums[0] < 0 || nums[0] > 90 || nums[1] < 0 || nums[1] > 59 || nums[2] < 0 || nums[2] > 59.9) {
      Alert.alert('Error', 'Latitud: grados 0 a 90, minutos 0 a 59, segundos 0 a 59,9.');
      return;
    }
    if (nums[3] < 0 || nums[3] > 180 || nums[4] < 0 || nums[4] > 59 || nums[5] < 0 || nums[5] > 59.9) {
      Alert.alert('Error', 'Longitud: grados 0 a 180, minutos 0 a 59, segundos 0 a 59,9.');
      return;
    }
    const fmt = n => (Number.isInteger(n) ? String(n) : n.toFixed(1));
    const formatted =
      `${fmt(nums[0])}° ${fmt(nums[1])}' ${fmt(nums[2])}" S, ` +
      `${fmt(nums[3])}° ${fmt(nums[4])}' ${fmt(nums[5])}" O`;
    onSave(formatted);
  };

  const renderFila = (setters, values, maxLens) => (
    <View style={styles.row}>
      <TextInput
        style={styles.dmsInput}
        keyboardType="decimal-pad"
        textAlign="center"
        maxLength={maxLens[0]}
        placeholder="--"
        placeholderTextColor="#adb5bd"
        value={values[0]}
        onChangeText={setters[0]}
      />
      <Text style={styles.unit}>°</Text>
      <TextInput
        style={styles.dmsInput}
        keyboardType="decimal-pad"
        textAlign="center"
        maxLength={maxLens[1]}
        placeholder="--"
        placeholderTextColor="#adb5bd"
        value={values[1]}
        onChangeText={setters[1]}
      />
      <Text style={styles.unit}>'</Text>
      <TextInput
        style={styles.dmsInput}
        keyboardType="decimal-pad"
        textAlign="center"
        maxLength={maxLens[2]}
        placeholder="--"
        placeholderTextColor="#adb5bd"
        value={values[2]}
        onChangeText={setters[2]}
      />
      <Text style={styles.unit}>"</Text>
    </View>
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'padding' })}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Cargar coordenadas GPS</Text>

          <Text style={styles.caption}>Latitud (S)</Text>
          {renderFila([setLatD, setLatM, setLatS], [latD, latM, latS], [3, 2, 5])}

          <Text style={styles.caption}>Longitud (O)</Text>
          {renderFila([setLonD, setLonM, setLonS], [lonD, lonM, lonS], [3, 2, 5])}

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAceptar}>
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  fieldText: {
    fontSize: 16,
    color: '#666',
  },
  fieldTextEmpty: {
    color: '#9aa0a6',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#212529',
  },
  caption: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginTop: 8,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dmsInput: {
    flex: 1,
    minWidth: 0,
    maxWidth: 72,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 2,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#212529',
  },
  unit: {
    width: 22,
    textAlign: 'center',
    fontSize: 16,
    color: '#495057',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  cancelButtonText: {
    color: '#343a40',
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#28a745',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
