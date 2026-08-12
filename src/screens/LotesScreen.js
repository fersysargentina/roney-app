import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoteItem from '../components/LoteItem';
import EditarLoteModal from '../components/modals/EditarLoteModal';
import { ErrorHandler } from '../utils/ErrorHandler';

// ✅ Constantes fuera del componente
const LOTE_ITEM_HEIGHT = 200; // Ajusta según tu LoteItem real

export default function LotesScreen({ route, navigation }) {
  const { operacionId, roney_op } = route.params || {};
  const [lotes, setLotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [cultivo, setCultivo] = useState('soja');

  // ✅ Ref para verificar si el componente está montado
  const isMountedRef = useRef(true);

  // ✅ Ref para prevenir navegaciones simultáneas
  const isNavigatingRef = useRef(false);

  // ✅ Lifecycle con cleanup correcto
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    isNavigatingRef.current = false;
    if (!operacionId) {
      ErrorHandler.handleError(
        new Error('Missing operation parameters'),
        'Error de Navegación',
        'No se recibieron los datos de la operación'
      );
      if (navigation.canGoBack()) navigation.goBack();
      return;
    }
    cargarDatosOperacion(); 
    cargarLotes();
  }, [operacionId]);

  // ✅ Cargar datos con verificación de montaje
  const cargarDatosOperacion = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('operaciones');
      if (data) {
        const operaciones = ErrorHandler.safeJsonParse(data, []);
        const operacionActual = Array.isArray(operaciones) ? operaciones.find(op => op.id === operacionId) : null;
        if (operacionActual && isMountedRef.current) {
          setCultivo(operacionActual.cultivo || 'soja');
        }
      }
    } catch (e) {
      if (isMountedRef.current) {
        console.error('Error cargando datos de operación:', e);
      }
    }
  }, [operacionId]);

  // ✅ Cargar lotes con verificación de montaje
  const cargarLotes = useCallback(async () => {
    try {
      const data = await ErrorHandler.getStorageData(`lotes_${operacionId}`);
      const lotesCargados = ErrorHandler.safeJsonParse(data, []);
      const lotesValidados = ErrorHandler.sanitizeData(lotesCargados, 'lotes');
      
      // Ordenar lotes más recientes primero
      const lotesOrdenados = [...lotesValidados].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

      if (isMountedRef.current) {
        setLotes(lotesOrdenados);
      }
    } catch (e) {
      if (isMountedRef.current) {
        ErrorHandler.handleError(e, 'Error de Carga', 'No se pudieron cargar los lotes');
      }
    }
  }, [operacionId]);

  // ✅ Listener con cleanup correcto
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isMountedRef.current) {
        cargarLotes();
      }
    });
    return unsubscribe;
  }, [navigation, cargarLotes]);

  // ✅ onRefresh con verificación de montaje
  const onRefresh = useCallback(async () => {
    if (isMountedRef.current) {
      setRefreshing(true);
    }
    await cargarLotes();
    if (isMountedRef.current) {
      setRefreshing(false);
    }
  }, [cargarLotes]);

  const abrirModalEdicion = useCallback((lote) => {
    setLoteSeleccionado(lote);
    setModalVisible(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalVisible(false);
    setLoteSeleccionado(null);
  }, []);

  const actualizarLote = useCallback(async (loteActualizado) => {
    try {
      const nuevosLotes = lotes.map(lote => 
        lote.id === loteActualizado.id ? loteActualizado : lote
      );
      await AsyncStorage.setItem(`lotes_${operacionId}`, JSON.stringify(nuevosLotes));
      
      if (isMountedRef.current) {
        setLotes(nuevosLotes);
        cerrarModal();
      }
    } catch (e) {
      if (isMountedRef.current) {
        Alert.alert('Error', 'No se pudo actualizar el lote');
      }
    }
  }, [lotes, operacionId, cerrarModal]);

  const eliminarLote = useCallback(async (loteId) => {
    try {
      const loteAEliminar = lotes.find(l => l.id === loteId);
      if (!loteAEliminar) return;

      // Liberar las muestras
      const muestrasData = await AsyncStorage.getItem(`muestras_${operacionId}`);
      if (muestrasData) {
        const muestras = ErrorHandler.safeJsonParse(muestrasData, []);
        const listaMuestras = Array.isArray(muestras) ? muestras : [];
        const muestrasActualizadas = listaMuestras.map(muestra => {
          if (loteAEliminar.muestrasIds.includes(muestra.id)) {
            return { ...muestra, loteId: null };
          }
          return muestra;
        });
        await AsyncStorage.setItem(`muestras_${operacionId}`, JSON.stringify(muestrasActualizadas));
      }

      // Eliminar el lote
      const nuevosLotes = lotes.filter(lote => lote.id !== loteId);
      await AsyncStorage.setItem(`lotes_${operacionId}`, JSON.stringify(nuevosLotes));
      
      if (isMountedRef.current) {
        setLotes(nuevosLotes);
        Alert.alert('✔ Completado', 'Lote eliminado y muestras liberadas');
      }
    } catch (e) {
      if (isMountedRef.current) {
        Alert.alert('Error', 'No se pudo eliminar el lote');
      }
    }
  }, [lotes, operacionId]);

  const liberarMuestra = useCallback(async (loteId, muestraId) => {
    try {
      // Actualizar la muestra
      const muestrasData = await AsyncStorage.getItem(`muestras_${operacionId}`);
      if (muestrasData) {
        const muestras = ErrorHandler.safeJsonParse(muestrasData, []);
        const listaMuestras = Array.isArray(muestras) ? muestras : [];
        const muestrasActualizadas = listaMuestras.map(muestra => {
          if (muestra.id === muestraId) {
            return { ...muestra, loteId: null };
          }
          return muestra;
        });
        await AsyncStorage.setItem(`muestras_${operacionId}`, JSON.stringify(muestrasActualizadas));
      }

      // Actualizar el lote
      const nuevosLotes = lotes.map(lote => {
        if (lote.id === loteId) {
          const nuevasMuestrasIds = lote.muestrasIds.filter(id => id !== muestraId);
          
          let nuevoDañoReal = 0;
          if (nuevasMuestrasIds.length > 0 && muestrasData) {
            const muestras = ErrorHandler.safeJsonParse(muestrasData, []);
            const muestrasDelLote = Array.isArray(muestras) ? muestras.filter(m => m && m.id && nuevasMuestrasIds.includes(m.id)) : [];
            if (muestrasDelLote.length > 0) {
              const suma = muestrasDelLote.reduce((sum, m) => {
                const val = parseFloat(String(m?.datos?.porcentajeDaño ?? '0').replace(',', '.'));
                return sum + (isNaN(val) ? 0 : val);
              }, 0);
              nuevoDañoReal = suma / muestrasDelLote.length;
              if (isNaN(nuevoDañoReal) || !isFinite(nuevoDañoReal)) nuevoDañoReal = 0;
            }
          }

          return {
            ...lote,
            muestrasIds: nuevasMuestrasIds,
            dañoReal: Math.round(nuevoDañoReal * 100) / 100
          };
        }
        return lote;
      }).filter(lote => lote.muestrasIds.length > 0);

      await AsyncStorage.setItem(`lotes_${operacionId}`, JSON.stringify(nuevosLotes));
      
      if (isMountedRef.current) {
        setLotes(nuevosLotes);
      }
      
      return true;
    } catch (e) {
      if (isMountedRef.current) {
        Alert.alert('Error', 'No se pudo liberar la muestra');
      }
      return false;
    }
  }, [lotes, operacionId]);

  const navegarAMuestras = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    navigation.navigate('Muestras', { 
      operacionId, 
      roney_op 
    });
    setTimeout(() => {
      if (isMountedRef.current) isNavigatingRef.current = false;
    }, 600);
  }, [navigation, operacionId, roney_op]);

  // ✅ Memoizar totalHectareas
  const totalHectareas = useMemo(() => {
    return lotes.reduce((sum, lote) => sum + lote.hectareas, 0);
  }, [lotes]);

  // ✅ Memoizar renderLote
  const renderLote = useCallback(({ item }) => (
    <LoteItem
      lote={item}
      onPress={() => abrirModalEdicion(item)}
      onDelete={eliminarLote}
    />
  ), [abrirModalEdicion, eliminarLote]);

  // ✅ Memoizar keyExtractor
  const keyExtractor = useCallback((item) => item.id, []);

  // ✅ Memoizar getItemLayout
  const getItemLayout = useCallback((data, index) => ({
    length: LOTE_ITEM_HEIGHT,
    offset: LOTE_ITEM_HEIGHT * index,
    index,
  }), []);

  // ✅ Memoizar EmptyComponent
  const EmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>No hay lotes creados</Text>
      <Text style={styles.emptyText}>
        Ve a la pantalla de muestras para crear tu primer lote
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={navegarAMuestras}
      >
        <Text style={styles.emptyButtonText}>Ir a Muestras</Text>
      </TouchableOpacity>
    </View>
  ), [navegarAMuestras]);

  return (
    <View style={styles.container}>
      {lotes.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>🌾 Total hectáreas: {totalHectareas.toFixed(1)} ha</Text>
        </View>
      )}

      <FlatList
        data={lotes}
        keyExtractor={keyExtractor}
        renderItem={renderLote}
        getItemLayout={getItemLayout}
        // ✅ Optimizaciones de performance seguras
        removeClippedSubviews={Platform.OS === 'android' ? false : true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        initialNumToRender={8}
        windowSize={5}
        // ✅ RefreshControl
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        // ✅ EmptyComponent memoizado
        ListEmptyComponent={EmptyComponent}
      />

      <EditarLoteModal
        visible={modalVisible}
        lote={loteSeleccionado}
        operacionId={operacionId}
        cultivo={cultivo}
        onClose={cerrarModal}
        onActualizar={actualizarLote}
        onLiberarMuestra={liberarMuestra}
        onEliminarLote={eliminarLote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statsText: {
    fontSize: 20,
    color: '#666',
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});