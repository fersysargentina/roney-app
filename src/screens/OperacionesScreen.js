import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CrearOperacionModal from '../components/modals/CrearOperacionModal';
import OperacionItem from '../components/OperacionItem';
import { ErrorHandler } from '../utils/ErrorHandler';
import logo from '../../assets/roney.png';

export default function OperacionesScreen({ navigation }) {
  const [operaciones, setOperaciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [operacionSeleccionada, setOperacionSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  useEffect(() => {
    console.log('🔧 OperacionesScreen: Inicializando...');
    cargarOperaciones();
  }, []);

  const cargarOperaciones = useCallback(async () => {
    console.log('📂 OperacionesScreen: Cargando operaciones...');
    try {
      const data = await ErrorHandler.getStorageData('operaciones');
      const operacionesCargadas = ErrorHandler.safeJsonParse(data, []);
      const operacionesValidadas = ErrorHandler.sanitizeData(operacionesCargadas, 'operaciones');
      console.log('✅ OperacionesScreen: Operaciones cargadas:', operacionesValidadas.length);
      setOperaciones(operacionesValidadas);
    } catch (e) {
      console.error('❌ OperacionesScreen: Error cargando operaciones:', e);
      ErrorHandler.handleError(e, 'Error de Carga', 'No se pudieron cargar las operaciones');
    }
  }, []);

  const guardarOperaciones = useCallback(async (nuevasOperaciones) => {
    console.log('💾 OperacionesScreen: Guardando operaciones...', nuevasOperaciones.length);
    try {
      const sanitized = ErrorHandler.sanitizeData(nuevasOperaciones, 'operaciones');
      await ErrorHandler.setStorageData('operaciones', sanitized);
      setOperaciones(sanitized);
      console.log('✅ OperacionesScreen: Operaciones guardadas exitosamente');
    } catch (e) {
      console.error('❌ OperacionesScreen: Error guardando operaciones:', e);
      ErrorHandler.handleError(e, 'Error de Guardado', 'No se pudieron guardar las operaciones');
    }
  }, []);

  const handleGuardarOperacion = useCallback((roney_op, cultivo) => {
    console.log('🔄 OperacionesScreen: Guardando operación...', { roney_op, cultivo, modoEdicion });
    try {
      if (modoEdicion && operacionSeleccionada) {
        // Editar operación existente
        const nuevasOperaciones = operaciones.map(op =>
          op.id === operacionSeleccionada.id ? { ...op, roney_op, cultivo } : op
        );
        guardarOperaciones(nuevasOperaciones);
        console.log('✅ OperacionesScreen: Operación editada');
      } else {
        // Crear nueva operación
        const nuevaOperacion = {
          id: Date.now().toString(),
          roney_op,
          cultivo,
        };
        const nuevasOperaciones = [...operaciones, nuevaOperacion];
        guardarOperaciones(nuevasOperaciones);
        console.log('✅ OperacionesScreen: Nueva operación creada');
      }
      
      // Cerrar modal y resetear estados
      setModalVisible(false);
      setOperacionSeleccionada(null);
      setModoEdicion(false);
    } catch (e) {
      console.error('❌ OperacionesScreen: Error en handleGuardarOperacion:', e);
      ErrorHandler.handleError(e, 'Error de Operación', 'No se pudo procesar la operación');
    }
  }, [modoEdicion, operacionSeleccionada, operaciones, guardarOperaciones]);

  const handleBorrarOperacion = (id) => {
    Alert.alert(
      'Confirmar',
      '¿Seguro que deseas borrar esta operación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            const nuevasOperaciones = operaciones.filter(op => op.id !== id);
            guardarOperaciones(nuevasOperaciones);
          }
        }
      ]
    );
  };

  const abrirModalCreacion = () => {
    setOperacionSeleccionada(null);
    setModoEdicion(false);
    setModalVisible(true);
  };

  const abrirModalEdicion = (operacion) => {
    setOperacionSeleccionada(operacion);
    setModoEdicion(true);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setOperacionSeleccionada(null);
    setModoEdicion(false);
  };

  const renderItem = ({ item }) => (
    <OperacionItem
      item={item}
      onPress={() => abrirModalEdicion(item)}
      onBorrar={() => handleBorrarOperacion(item.id)}
      onMuestras={() => {
        navigation.navigate('Muestras', { roney_op: item.roney_op, operacionId: item.id });
      }}
    />
  );

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />
      <TouchableOpacity
        style={styles.crearBtn}
        onPress={abrirModalCreacion}
      >
        <Text style={styles.crearBtnText}>Crear Operación</Text>
      </TouchableOpacity>
      <FlatList
        data={operaciones}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay operaciones</Text>}
      />
      
      <CrearOperacionModal
        visible={modalVisible}
        onClose={cerrarModal}
        onGuardar={handleGuardarOperacion}
        valoresIniciales={
          modoEdicion && operacionSeleccionada
            ? {
                roney_op: operacionSeleccionada.roney_op,
                cultivo: operacionSeleccionada.cultivo,
              }
            : { roney_op: '', cultivo: '' }
        }
        modoEdicion={modoEdicion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  logo: {
    width: 300,
    height: 150,
    alignSelf: 'center',
    marginBottom: 16,
  },
  separator: {
    height: 12,
  },
  crearBtn: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  crearBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});