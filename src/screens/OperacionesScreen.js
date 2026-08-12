import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Image, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CrearOperacionModal from '../components/modals/CrearOperacionModal';
import PerfilModal from '../components/modals/PerfilModal';
import OperacionItem from '../components/OperacionItem';
import { ErrorHandler } from '../utils/ErrorHandler';
import logo from '../../assets/roney.png';

// ✅ Constantes fuera del componente
const OPERACION_ITEM_HEIGHT = 100;

export default function OperacionesScreen({ navigation, userSession, onLogout, onDeleteAccount }) {
  const [operaciones, setOperaciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [perfilModalVisible, setPerfilModalVisible] = useState(false);
  const [operacionSeleccionada, setOperacionSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // ✅ Ref para verificar si el componente está montado
  const isMountedRef = useRef(true);

  // ✅ Listener de foco con cleanup correcto
  useEffect(() => {
    isMountedRef.current = true;
    cargarOperaciones();

    const unsubscribe = navigation.addListener('focus', () => {
      if (isMountedRef.current) {
        cargarOperaciones();
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [navigation, cargarOperaciones]);

  const cargarOperaciones = useCallback(async () => {
    try {
      const data = await ErrorHandler.getStorageData('operaciones');
      const operacionesCargadas = ErrorHandler.safeJsonParse(data, []);
      const operacionesValidadas = ErrorHandler.sanitizeData(operacionesCargadas, 'operaciones');
      
      // Ordenar operaciones más recientes primero
      const operacionesOrdenadas = [...operacionesValidadas].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

      if (isMountedRef.current) {
        setOperaciones(operacionesOrdenadas);
      }
    } catch (e) {
      console.error('❌ OperacionesScreen: Error cargando operaciones:', e);
      if (isMountedRef.current) {
        ErrorHandler.handleError(e, 'Error de Carga', 'No se pudieron cargar las operaciones');
      }
    }
  }, []);

  const guardarOperaciones = useCallback(async (nuevasOperaciones) => {
    try {
      const sanitized = ErrorHandler.sanitizeData(nuevasOperaciones, 'operaciones');
      await ErrorHandler.setStorageData('operaciones', sanitized);
      
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

  const handleGuardarOperacion = useCallback((roney_op, cultivo) => {
    try {
      if (modoEdicion && operacionSeleccionada) {
        // Editar operación existente
        const nuevasOperaciones = operaciones.map(op =>
          op.id === operacionSeleccionada.id ? { ...op, roney_op, cultivo } : op
        );
        guardarOperaciones(nuevasOperaciones);
      } else {
        // Crear nueva operación al principio de la lista (más reciente primero)
        const nuevaOperacion = {
          id: Date.now().toString(),
          roney_op,
          cultivo,
        };
        const nuevasOperaciones = [nuevaOperacion, ...operaciones];
        guardarOperaciones(nuevasOperaciones);
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

  const isNavigatingRef = useRef(false);

  // ✅ Memoizar navegación a Muestras con Debounce para evitar pantallas duplicadas
  const navegarAMuestras = useCallback((roney_op, operacionId) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    navigation.navigate('Muestras', { roney_op, operacionId });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 600);
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
      <View style={styles.userBar}>
        <TouchableOpacity
          style={styles.perfilHeaderBtn}
          onPress={() => setPerfilModalVisible(true)}
        >
          <Text style={styles.perfilHeaderBtnText}>👤 Mi Perfil</Text>
        </TouchableOpacity>

        {onLogout && (
          <TouchableOpacity
            style={styles.logoutHeaderBtn}
            onPress={onLogout}
          >
            <Text style={styles.logoutHeaderBtnText}>🚪 Salir</Text>
          </TouchableOpacity>
        )}
      </View>

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
        // ✅ Optimizaciones de performance seguras
        removeClippedSubviews={Platform.OS === 'android' ? false : true}
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

      <PerfilModal
        visible={perfilModalVisible}
        onClose={() => setPerfilModalVisible(false)}
        userSession={userSession}
        onLogout={() => {
          setPerfilModalVisible(false);
          if (onLogout) onLogout();
        }}
        onDeleteAccount={() => {
          setPerfilModalVisible(false);
          if (onDeleteAccount) onDeleteAccount();
        }}
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
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  perfilHeaderBtn: {
    backgroundColor: '#edf3fc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cce0ff',
  },
  perfilHeaderBtnText: {
    color: '#08428b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logoutHeaderBtn: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logoutHeaderBtnText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logo: {
    width: 300,
    height: 120,
    resizeMode: 'contain',
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