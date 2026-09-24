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
  FlatList 
} from 'react-native';

const CULTIVOS_FINA = [
  'Trigo',
  'Cebada',
  'Avena',
  'Centeno'
];

const CULTIVOS_GRUESA = [
  'Soja de 1.a',
  'Soja de 2.a',
  'Maíz',
  'Maíz Tardío',
  'Girasol'
];

export default function CrearOperacionModal({
  visible,
  onClose,
  onGuardar,
  valoresIniciales = { roney_op: '', campo: '', campana: '', cultivo: '' },
  modoEdicion = false,
}) {
  const [roneyOp, setRoneyOp] = useState(valoresIniciales.roney_op || '');
  const [campo, setCampo] = useState(valoresIniciales.campo || '');
  const [campana, setCampana] = useState(valoresIniciales.campana || ''); // 'Fina' | 'Gruesa' | ''
  const [cultivo, setCultivo] = useState(valoresIniciales.cultivo || '');
  const [cultivoModalVisible, setCultivoModalVisible] = useState(false);

  // Sincronizar con valoresIniciales cuando visible cambia
  useEffect(() => {
    if (visible) {
      setRoneyOp(valoresIniciales.roney_op || '');
      setCampo(valoresIniciales.campo || '');
      setCampana(valoresIniciales.campana || '');
      setCultivo(valoresIniciales.cultivo || '');
    }
  }, [valoresIniciales, visible]);

  // Manejar cambio de campaña: si el cultivo actual no pertenece a la nueva campaña, resetearlo
  const handleSeleccionarCampana = useCallback((tipo) => {
    setCampana(tipo);
    const listaValida = tipo === 'Fina' ? CULTIVOS_FINA : CULTIVOS_GRUESA;
    if (cultivo && !listaValida.includes(cultivo)) {
      setCultivo('');
    }
  }, [cultivo]);

  // Lista de cultivos según la campaña seleccionada
  const cultivosDisponibles = useMemo(() => {
    if (campana === 'Fina') return CULTIVOS_FINA;
    if (campana === 'Gruesa') return CULTIVOS_GRUESA;
    return [];
  }, [campana]);

  // Validación de campos
  const camposCompletos = useMemo(() => {
    return (
      roneyOp.trim().length > 0 &&
      campo.trim().length > 0 &&
      campana.trim().length > 0 &&
      cultivo.trim().length > 0
    );
  }, [roneyOp, campo, campana, cultivo]);

  // Título memoizado
  const titulo = useMemo(() => {
    if (modoEdicion) {
      return valoresIniciales.roney_op || 'Editar Operación';
    }
    return 'Nueva Operación';
  }, [modoEdicion, valoresIniciales.roney_op]);

  // Texto del botón guardar memoizado
  const textoBotonGuardar = useMemo(() => {
    return modoEdicion ? 'Guardar Cambios' : 'Guardar';
  }, [modoEdicion]);

  // Guardar
  const handleGuardar = useCallback(() => {
    if (!camposCompletos) return;

    onGuardar({
      roney_op: roneyOp.trim(),
      campo: campo.trim(),
      campana,
      cultivo
    });

    handleCerrar();
  }, [camposCompletos, roneyOp, campo, campana, cultivo, onGuardar]);

  // Cerrar y resetear
  const handleCerrar = useCallback(() => {
    setRoneyOp(valoresIniciales.roney_op || '');
    setCampo(valoresIniciales.campo || '');
    setCampana(valoresIniciales.campana || '');
    setCultivo(valoresIniciales.cultivo || '');
    onClose();
  }, [valoresIniciales, onClose]);

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
          behavior={Platform.select({ ios: 'padding', android: undefined })}
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

            <View>
              {/* 1. Nombre de la operación */}
              <Text style={styles.fieldLabel}>Nombre de la operación</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Lote 1 - San Pedro"
                placeholderTextColor="#888"
                value={roneyOp}
                onChangeText={setRoneyOp}
                autoFocus={!modoEdicion}
                returnKeyType="next"
              />

              {/* 2. Campo */}
              <Text style={styles.fieldLabel}>Campo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: La Esperanza"
                placeholderTextColor="#888"
                value={campo}
                onChangeText={setCampo}
                returnKeyType="next"
              />

              {/* 3. Campaña (Fina / Gruesa) */}
              <Text style={styles.fieldLabel}>Campaña</Text>
              <View style={styles.campanaButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.campanaBtn,
                    styles.campanaFinaBtn,
                    campana === 'Fina' && styles.campanaFinaBtnSelected
                  ]}
                  onPress={() => handleSeleccionarCampana('Fina')}
                >
                  <Text
                    style={[
                      styles.campanaBtnText,
                      styles.campanaFinaBtnText,
                      campana === 'Fina' && styles.campanaBtnTextSelected
                    ]}
                  >
                    {campana === 'Fina' ? '✓ Fina' : 'Fina'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.campanaBtn,
                    styles.campanaGruesaBtn,
                    campana === 'Gruesa' && styles.campanaGruesaBtnSelected
                  ]}
                  onPress={() => handleSeleccionarCampana('Gruesa')}
                >
                  <Text
                    style={[
                      styles.campanaBtnText,
                      styles.campanaGruesaBtnText,
                      campana === 'Gruesa' && styles.campanaBtnTextSelected
                    ]}
                  >
                    {campana === 'Gruesa' ? '✓ Gruesa' : 'Gruesa'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 4. Cultivo (dependiente de Campaña) */}
              <Text style={styles.fieldLabel}>Cultivo</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.selectorContainer,
                  !campana && styles.selectorDisabled
                ]}
                onPress={() => {
                  if (campana) setCultivoModalVisible(true);
                }}
                disabled={!campana}
              >
                <Text style={cultivo ? styles.cultivoTexto : styles.cultivoPlaceholder}>
                  {!campana 
                    ? '⚠️ Primero presione Fina o Gruesa' 
                    : (cultivo ? `🌾 ${cultivo}` : `Seleccionar cultivo (${campana})...`)
                  }
                </Text>
                <Text style={styles.chevronIcon}>▼</Text>
              </TouchableOpacity>

              {/* Modal selector de Cultivo */}
              <Modal
                visible={cultivoModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCultivoModalVisible(false)}
              >
                <View style={styles.modalBg}>
                  <View style={styles.subModalContainer}>
                    <Text style={styles.modalTitle}>
                      Cultivos para Campaña {campana}
                    </Text>
                    <FlatList
                      data={cultivosDisponibles}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.modalOption}
                          onPress={() => {
                            setCultivo(item);
                            setCultivoModalVisible(false);
                          }}
                        >
                          <Text style={[
                            styles.modalOptionText,
                            item === cultivo && styles.modalOptionSelected
                          ]}>
                            {item}
                          </Text>
                          {item === cultivo && (
                            <Text style={styles.cultivoCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    />
                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={() => setCultivoModalVisible(false)}
                    >
                      <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* Botones inferiores */}
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
                    !camposCompletos && styles.saveButtonDisabled
                  ]}
                  onPress={handleGuardar}
                  disabled={!camposCompletos}
                >
                  <Text style={styles.saveButtonText}>
                    {textoBotonGuardar}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 30,
  },
  avoider: {
    width: '100%',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  cerrar: {
    fontSize: 26,
    color: '#666',
    padding: 6,
  },
  fieldLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ced4da',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 0,
    fontSize: 18,
    color: '#111',
    backgroundColor: '#fff',
  },
  campanaButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  campanaBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  campanaFinaBtn: {
    borderColor: '#28a745',
    backgroundColor: '#e8f5e9',
  },
  campanaFinaBtnSelected: {
    backgroundColor: '#28a745',
  },
  campanaFinaBtnText: {
    color: '#1e7e34',
  },
  campanaGruesaBtn: {
    borderColor: '#fd7e14',
    backgroundColor: '#fff3e0',
  },
  campanaGruesaBtnSelected: {
    backgroundColor: '#fd7e14',
  },
  campanaGruesaBtnText: {
    color: '#d96102',
  },
  campanaBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  campanaBtnTextSelected: {
    color: '#fff',
  },
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 14,
  },
  selectorDisabled: {
    backgroundColor: '#f1f3f5',
    borderColor: '#dee2e6',
  },
  chevronIcon: {
    fontSize: 12,
    color: '#666',
  },
  cultivoTexto: {
    fontSize: 18,
    color: '#222',
    fontWeight: '500',
  },
  cultivoPlaceholder: {
    fontSize: 17,
    color: '#777',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subModalContainer: {
    width: '85%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    maxHeight: '75%',
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#222',
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
  modalOptionSelected: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  cultivoCheck: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalCloseBtn: {
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalCloseBtnText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '600',
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 14,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});