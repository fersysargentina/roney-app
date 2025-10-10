import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function CrearOperacionModal({
  visible,
  onClose,
  onGuardar,
  valoresIniciales = { roney_op: '', cultivo: '' },
  modoEdicion = false,
}) {
  const [roneyOp, setRoneyOp] = useState(valoresIniciales.roney_op || '');
  const [cultivo, setCultivo] = useState(valoresIniciales.cultivo || '');

  useEffect(() => {
    setRoneyOp(valoresIniciales.roney_op || '');
    setCultivo(valoresIniciales.cultivo || '');
  }, [valoresIniciales, visible]);

  const handleGuardar = () => {
    if (!roneyOp.trim() || !cultivo.trim()) {
      return;
    }
    onGuardar(roneyOp, cultivo);
    setRoneyOp('');
    setCultivo('');
  };

  const handleCerrar = () => {
    setRoneyOp(valoresIniciales.roney_op || '');
    setCultivo(valoresIniciales.cultivo || '');
    onClose();
  };

  const camposCompletos = roneyOp.trim() && cultivo.trim();

  const getNombreCultivo = (value) => {
    const cultivos = {
      'soja': 'Soja',
      'maiz': 'Maíz',
      'trigo': 'Trigo',
      'girasol': 'Girasol'
    };
    return cultivos[value] || value;
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
                {modoEdicion ? (valoresIniciales.roney_op || 'Editar Operación') : 'Nueva Operación'}
              </Text>
              <TouchableOpacity onPress={handleCerrar} accessibilityRole="button" accessibilityLabel="Cerrar">
                <Text style={styles.cerrar}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Nombre de la operación"
                value={roneyOp}
                onChangeText={setRoneyOp}
                autoFocus
                returnKeyType="next"
                editable
              />
              
              {!modoEdicion ? (
                <View style={styles.input}>
                  <Picker
                    selectedValue={cultivo}
                    onValueChange={setCultivo}
                    style={{ width: '100%', color: '#000' }}
                  >
                    <Picker.Item label="Selecciona un cultivo..." value="" style={{ color: '#000' }} />
                    <Picker.Item label="Soja" value="soja" style={{ color: '#000' }} />
                    <Picker.Item label="Maíz" value="maiz" style={{ color: '#000' }} />
                    <Picker.Item label="Trigo" value="trigo" style={{ color: '#000' }} />
                    <Picker.Item label="Girasol" value="girasol" style={{ color: '#000' }} />
                  </Picker>
                </View>
              ) : (
                <View style={[styles.input, styles.inputDisabled]}>
                  <Text style={styles.cultivoTexto}>
                    🌾 Cultivo: {getNombreCultivo(cultivo)}
                  </Text>
                </View>
              )}

              <View style={styles.botones}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCerrar}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    !camposCompletos && styles.saveButtonDisabled,
                    camposCompletos && !modoEdicion && styles.saveButtonActive 
                  ]}
                  onPress={handleGuardar}
                  disabled={!camposCompletos}
                >
                  <Text style={styles.saveButtonText}>
                    {modoEdicion ? 'Guardar Cambios' : 'Guardar'}
                  </Text>
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'stretch',
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cerrar: {
    fontSize: 22,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  cultivoTexto: {
    fontSize: 16,
    color: '#333',
    padding: 2,
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonActive: {
    backgroundColor: '#28a745', 
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});