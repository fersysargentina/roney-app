import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function MuestraTipo3Modal({ visible, onClose, onGuardar, valoresIniciales = { dato_1: '', dato_2: '', dato_3: '', dato_4: '' } }) {
  const [dato_1, setDato_1] = useState(valoresIniciales.dato_1 || '');
  const [dato_2, setDato_2] = useState(valoresIniciales.dato_2 || '');
  const [dato_3, setDato_3] = useState(valoresIniciales.dato_3 || '');
  const [dato_4, setDato_4] = useState(valoresIniciales.dato_4 || '');

  useEffect(() => {
    setDato_1(valoresIniciales.dato_1 || '');
    setDato_2(valoresIniciales.dato_2 || '');
    setDato_3(valoresIniciales.dato_3 || '');
    setDato_4(valoresIniciales.dato_4 || '');
  }, [valoresIniciales, visible]);

  const handleGuardar = () => {
    if (!dato_1.trim() || !dato_2.trim() || !dato_3.trim() || !dato_4.trim()) return;
    onGuardar(dato_1, dato_2, dato_3, dato_4);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={'padding'} style={styles.avoider}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.titulo}>Muestra Tipo 3</Text>
              <TouchableOpacity onPress={onClose}><Text style={styles.cerrar}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="always">
              <TextInput style={styles.input} placeholder="Dato 1" value={dato_1} onChangeText={setDato_1} autoFocus returnKeyType="next" />
              <TextInput style={styles.input} placeholder="Dato 2" value={dato_2} onChangeText={setDato_2} returnKeyType="next" />
              <TextInput style={styles.input} placeholder="Dato 3" value={dato_3} onChangeText={setDato_3} returnKeyType="next" />
              <TextInput style={styles.input} placeholder="Dato 4" value={dato_4} onChangeText={setDato_4} returnKeyType="done" />
              <View style={styles.botones}>
                <Button title="Cancelar" onPress={onClose} color="#888" />
                <Button title="Guardar" onPress={handleGuardar} color="#007bff" disabled={!dato_1.trim() || !dato_2.trim() || !dato_3.trim() || !dato_4.trim()} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'stretch', paddingHorizontal: 16 },
  avoider: { width: '100%' },
  modalContainer: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 24, elevation: 5 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titulo: { fontSize: 20, fontWeight: 'bold' },
  cerrar: { fontSize: 22, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 16 },
  botones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 10 },
});


