import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

// ✅ Constante de mapeo de cultivos (fuera del componente)
const CULTIVOS_MAP = {
  'soja': 'Soja',
  'maiz': 'Maíz',
  'trigo': 'Trigo',
  'girasol': 'Girasol'
};

export default function CrearOperacionModal({
  visible,
  onClose,
  onGuardar,
  valoresIniciales = { roney_op: '', cultivo: '' },
  modoEdicion = false,
}) {
  const [roneyOp, setRoneyOp] = useState(valoresIniciales.roney_op || '');
  const [cultivo, setCultivo] = useState(valoresIniciales.cultivo || '');

  // ✅ Sincronizar con valoresIniciales cuando visible cambia
  useEffect(() => {
    if (visible) {
      setRoneyOp(valoresIniciales.roney_op || '');
      setCultivo(valoresIniciales.cultivo || '');
    }
  }, [valoresIniciales, visible]);

  // ✅ Validación de campos memoizada
  const camposCompletos = useMemo(() => {
    return roneyOp.trim() && cultivo.trim();
  }, [roneyOp, cultivo]);

  // ✅ Nombre del cultivo memoizado
  const nombreCultivo = useMemo(() => {
    return CULTIVOS_MAP[cultivo] || cultivo;
  }, [cultivo]);

  // ✅ Título memoizado
  const titulo = useMemo(() => {
    if (modoEdicion) {
      return valoresIniciales.roney_op || 'Editar Operación';
    }
    return 'Nueva Operación';
  }, [modoEdicion, valoresIniciales.roney_op]);

  // ✅ Texto del botón guardar memoizado
  const textoBotonGuardar = useMemo(() => {
    return modoEdicion ? 'Guardar Cambios' : 'Guardar';
  }, [modoEdicion]);

  // ✅ Texto del cultivo display memoizado
  const cultivoDisplayText = useMemo(() => {
    return `🌾 Cultivo: ${nombreCultivo}`;
  }, [nombreCultivo]);

  // ✅ Guardar memoizado
  const handleGuardar = useCallback(() => {
    if (!camposCompletos) {
      return;
    }
    onGuardar(roneyOp, cultivo);
    setRoneyOp('');
    setCultivo('');
  }, [camposCompletos, roneyOp, cultivo, onGuardar]);

  // ✅ Cerrar memoizado
  const handleCerrar = useCallback(() => {
    setRoneyOp(valoresIniciales.roney_op || '');
    setCultivo(valoresIniciales.cultivo || '');
    onClose();
  }, [valoresIniciales, onClose]);

  // ✅ Estilos dinámicos memoizados
  const saveButtonStyle = useMemo(() => [
    styles.saveButton,
    !camposCompletos && styles.saveButtonDisabled,
    camposCompletos && !modoEdicion && styles.saveButtonActive
  ], [camposCompletos, modoEdicion]);

  const inputDisabledStyle = useMemo(() => [
    styles.input, 
    styles.inputDisabled
  ], []);

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
              <Text style={styles.titulo}>{titulo}</Text>
              <TouchableOpacity 
                onPress={handleCerrar} 
                accessibilityRole="button" 
                accessibilityLabel="Cerrar"
              >
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
                    style={styles.picker}
                  >
                    <Picker.Item 
                      label="Selecciona un cultivo..." 
                      value="" 
                      style={styles.pickerItem} 
                    />
                    <Picker.Item 
                      label="Soja" 
                      value="soja" 
                      style={styles.pickerItem} 
                    />
                    <Picker.Item 
                      label="Maíz" 
                      value="maiz" 
                      style={styles.pickerItem} 
                    />
                    <Picker.Item 
                      label="Trigo" 
                      value="trigo" 
                      style={styles.pickerItem} 
                    />
                    <Picker.Item 
                      label="Girasol" 
                      value="girasol" 
                      style={styles.pickerItem} 
                    />
                  </Picker>
                </View>
              ) : (
                <View style={inputDisabledStyle}>
                  <Text style={styles.cultivoTexto}>
                    {cultivoDisplayText}
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
                  style={saveButtonStyle}
                  onPress={handleGuardar}
                  disabled={!camposCompletos}
                >
                  <Text style={styles.saveButtonText}>
                    {textoBotonGuardar}
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
  picker: {
    width: '100%',
    color: '#000',
  },
  pickerItem: {
    color: '#000',
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