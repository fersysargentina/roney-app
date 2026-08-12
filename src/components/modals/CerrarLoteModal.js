import React, { useState, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';

export default function CerrarLoteModal({ 
  visible, 
  onClose, 
  onConfirmar, 
  muestrasSeleccionadas = [],
  tipoFenologicoSeleccionado,
  tipoFenologicoLabel
}) {
  const [nombreLote, setNombreLote] = useState('');
  const [hectareas, setHectareas] = useState('');
  const [dañoPactado, setDañoPactado] = useState('');

  // ✅ Calcular daño real memoizado
  const dañoRealCalculado = useMemo(() => {
    if (muestrasSeleccionadas.length === 0) return 0;
    
    const sumaDaños = muestrasSeleccionadas.reduce((sum, muestra) => {
      const porcentaje = parseFloat(muestra.datos?.porcentajeDaño) || 0;
      return sum + porcentaje;
    }, 0);
    
    return sumaDaños / muestrasSeleccionadas.length;
  }, [muestrasSeleccionadas]);

  // ✅ Display fenológico memoizado
  const fenologicoDisplay = useMemo(() => {
    return tipoFenologicoLabel || tipoFenologicoSeleccionado || '-';
  }, [tipoFenologicoLabel, tipoFenologicoSeleccionado]);

  // ✅ Validación de campos memoizada
  const camposValidos = useMemo(() => {
    const nombreValido = nombreLote.trim().length > 0;
    const hectareasNumero = parseFloat(hectareas);
    const hectareasValidas = !isNaN(hectareasNumero) && hectareasNumero > 0;
    
    return nombreValido && hectareasValidas;
  }, [nombreLote, hectareas]);

  // ✅ Confirmación memoizada
  const handleConfirmar = useCallback(() => {
    // Validaciones
    if (!nombreLote.trim()) {
      Alert.alert('Error', 'Debe ingresar un nombre para el lote');
      return;
    }

    if (!hectareas.trim()) {
      Alert.alert('Error', 'Debe ingresar las hectáreas del lote');
      return;
    }

    const hectareasNumero = parseFloat(hectareas);
    if (isNaN(hectareasNumero) || hectareasNumero <= 0) {
      Alert.alert('Error', 'Las hectáreas deben ser un número mayor a 0');
      return;
    }

    const datosLote = {
      nombreLote: nombreLote.trim(),
      hectareas: hectareasNumero,
      dañoReal: Math.round(dañoRealCalculado * 100) / 100,
      dañoPactado: dañoPactado.trim() ? parseFloat(dañoPactado) : null,
      muestrasIds: muestrasSeleccionadas.map(m => m.id),
      tipoFenologico: tipoFenologicoSeleccionado,
    };

    onConfirmar(datosLote);
    handleClose();
  }, [nombreLote, hectareas, dañoPactado, dañoRealCalculado, muestrasSeleccionadas, tipoFenologicoSeleccionado, onConfirmar]);

  // ✅ Cierre memoizado
  const handleClose = useCallback(() => {
    setNombreLote('');
    setHectareas('');
    setDañoPactado('');
    onClose();
  }, [onClose]);

  // ✅ Texto de cantidad de muestras memoizado
  const cantidadMuestrasText = useMemo(() => {
    return `📊 Muestras seleccionadas: ${muestrasSeleccionadas.length}`;
  }, [muestrasSeleccionadas.length]);

  // ✅ Texto de estado fenológico memoizado
  const estadoFenologicoText = useMemo(() => {
    return `🧬 Estado fenológico: ${fenologicoDisplay}`;
  }, [fenologicoDisplay]);

  // ✅ Mostrar warning si no hay muestras
  const mostrarWarning = useMemo(() => {
    return muestrasSeleccionadas.length === 0;
  }, [muestrasSeleccionadas.length]);

  // ✅ Label de daño real memoizado
  const labelDañoReal = useMemo(() => {
    return `Daño Real ${muestrasSeleccionadas.length > 0 ? '(Calculado)' : '(Sin muestras)'}`;
  }, [muestrasSeleccionadas.length]);

  // ✅ Nota calculada memoizada
  const notaCalculada = useMemo(() => {
    return muestrasSeleccionadas.length > 0 
      ? 'Promedio automático de las muestras'
      : 'Sin muestras para calcular';
  }, [muestrasSeleccionadas.length]);

  // ✅ Daño formateado memoizado
  const dañoFormateado = useMemo(() => {
    return `${(Math.round(dañoRealCalculado * 100) / 100).toFixed(2)}%`;
  }, [dañoRealCalculado]);

  // ✅ Estilos dinámicos memoizados
  const calculatedContainerStyle = useMemo(() => [
    styles.calculatedContainer,
    muestrasSeleccionadas.length === 0 && styles.calculatedContainerEmpty
  ], [muestrasSeleccionadas.length]);

  const calculatedValueStyle = useMemo(() => [
    styles.calculatedValue,
    muestrasSeleccionadas.length === 0 && styles.calculatedValueEmpty
  ], [muestrasSeleccionadas.length]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Crear Lote</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>{cantidadMuestrasText}</Text>
                <Text style={styles.infoText}>{estadoFenologicoText}</Text>
                {mostrarWarning && (
                  <Text style={styles.warningText}>
                    ⚠️ Este lote no tendrá muestras asociadas
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre del Lote *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Lote Norte 2024"
                  placeholderTextColor="#444444"
                  value={nombreLote}
                  onChangeText={setNombreLote}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Hectáreas *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 25.5"
                  placeholderTextColor="#444444"
                  value={hectareas}
                  onChangeText={setHectareas}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{labelDañoReal}</Text>
                <View style={calculatedContainerStyle}>
                  <Text style={calculatedValueStyle}>{dañoFormateado}</Text>
                  <Text style={styles.calculatedNote}>{notaCalculada}</Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleConfirmar}
              >
                <Text style={styles.confirmButtonText}>Crear Lote</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 13,
    color: '#ff9800',
    marginTop: 8,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#fafafa',
  },
  calculatedContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3e6c3',
  },
  calculatedContainerEmpty: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
  },
  calculatedValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
  },
  calculatedValueEmpty: {
    color: '#856404',
  },
  calculatedNote: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});