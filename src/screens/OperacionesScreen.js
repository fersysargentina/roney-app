import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CrearOperacionModal from '../components/modals/CrearOperacionModal';
import OperacionItem from '../components/OperacionItem';
import { ErrorHandler } from '../utils/ErrorHandler';
import logo from '../../assets/roney.png';

// ✅ Constantes fuera del componente
const OPERACION_ITEM_HEIGHT = 100; // Ajusta según tu diseño real de OperacionItem

export default function OperacionesScreen({ navigation }) {
  const [operaciones, setOperaciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [operacionSeleccionada, setOperacionSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // ✅ Ref para verificar si el componente está montado
  const isMountedRef = useRef(true);

  // ✅ Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    console.log('🔧 OperacionesScreen: Inicializando...');
    cargarOperaciones();
  }, []);

  // ✅ Cargar operaciones con verificación de montaje
  const cargarOperaciones = useCallback(async () => {
    console.log('📂 OperacionesScreen: Cargando operaciones...');
    try {
      const data = await ErrorHandler.getStorageData('operaciones');
      const operacionesCargadas = ErrorHandler.safeJsonParse(data, []);
      const operacionesValidadas = ErrorHandler.sanitizeData(operacionesCargadas, 'operaciones');
      
      console.log('✅ OperacionesScreen: Operaciones cargadas:', operacionesValidadas.length);
      
      if (isMountedRef.current) {
        setOperaciones(operacionesValidadas);
      }
    } catch (e) {
      console.error('❌ OperacionesScreen: Error cargando operaciones:', e);
      if (isMountedRef.current) {
        ErrorHandler.handleError(e, 'Error de Carga', 'No se pudieron cargar las operaciones');
      }
    }
  }, []);

  // ✅ Guardar operaciones con verificación de montaje
  const guardarOperaciones = useCallback(async (nuevasOperaciones) => {
    console.log('💾 OperacionesScreen: Guardando operaciones...', nuevasOperaciones.length);
    try {
      const sanitized = ErrorHandler.sanitizeData(nuevasOperaciones, 'operaciones');
      await ErrorHandler.setStorageData('operaciones', sanitized);
      
      console.log('✅ OperacionesScreen: Operaciones guardadas exitosamente');
      
      if (isMountedRef.current) {
        setOperaciones(sanitized);
      }
    } catch (e) {
      console.error('❌ OperacionesScreen: Error guardando operaciones:', e);
      if (isMountedRef.current) {
        ErrorHandler.handleError(e, 'Error de Guardado', 'No se pudieron guardar las operaciones');
      }
    }
  }, []);

  // ✅ Memoizar handleGuardarOperacion
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
      if (isMountedRef.current) {
        setModalVisible(false);
        setOperacionSeleccionada(null);
        setModoEdicion(false);
      }
    } catch (e) {
      console.error('❌ OperacionesScreen: Error en handleGuardarOperacion:', e);
      if (isMountedRef.current) {
        ErrorHandler.handleError(e, 'Error de Operación', 'No se pudo procesar la operación');
      }
    }
  }, [modoEdicion, operacionSeleccionada, operaciones, guardarOperaciones]);

  // ✅ Memoizar handleBorrarOperacion
  const handleBorrarOperacion = useCallback((id) => {
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
  }, [operaciones, guardarOperaciones]);

  // ✅ Memoizar funciones de modal
  const abrirModalCreacion = useCallback(() => {
    setOperacionSeleccionada(null);
    setModoEdicion(false);
    setModalVisible(true);
  }, []);

  const abrirModalEdicion = useCallback((operacion) => {
    setOperacionSeleccionada(operacion);
    setModoEdicion(true);
    setModalVisible(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalVisible(false);
    setOperacionSeleccionada(null);
    setModoEdicion(false);
  }, []);

  // ✅ Memoizar navegación a Muestras
  const navegarAMuestras = useCallback((roney_op, operacionId) => {
    navigation.navigate('Muestras', { roney_op, operacionId });
  }, [navigation]);

  // ✅ Memoizar renderItem
  const renderItem = useCallback(({ item }) => (
    <OperacionItem
      item={item}
      onPress={() => abrirModalEdicion(item)}
      onBorrar={() => handleBorrarOperacion(item.id)}
      onMuestras={() => navegarAMuestras(item.roney_op, item.id)}
    />
  ), [abrirModalEdicion, handleBorrarOperacion, navegarAMuestras]);

  // ✅ Memoizar keyExtractor
  const keyExtractor = useCallback((item) => item.id, []);

  // ✅ Memoizar getItemLayout
  const getItemLayout = useCallback((data, index) => ({
    length: OPERACION_ITEM_HEIGHT,
    offset: OPERACION_ITEM_HEIGHT * index,
    index,
  }), []);

  // ✅ Memoizar ItemSeparator
  const ItemSeparator = useCallback(() => <View style={styles.separator} />, []);

  // ✅ Memoizar EmptyComponent
  const EmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>No hay operaciones</Text>
      <Text style={styles.emptySubtext}>Crea tu primera operación para comenzar</Text>
    </View>
  ), []);

  // ✅ Memoizar valores iniciales del modal
  const valoresInicialesModal = useMemo(() => {
    if (modoEdicion && operacionSeleccionada) {
      return {
        roney_op: operacionSeleccionada.roney_op,
        cultivo: operacionSeleccionada.cultivo,
      };
    }
    return { roney_op: '', cultivo: '' };
  }, [modoEdicion, operacionSeleccionada]);

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
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={EmptyComponent}
        // ✅ Optimizaciones de performance
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={5}
      />
      
      <CrearOperacionModal
        visible={modalVisible}
        onClose={cerrarModal}
        onGuardar={handleGuardarOperacion}
        valoresIniciales={valoresInicialesModal}
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});