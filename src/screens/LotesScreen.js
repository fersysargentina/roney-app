import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoteItem from '../components/LoteItem';
import EditarLoteModal from '../components/modals/EditarLoteModal';
import { ErrorHandler } from '../utils/ErrorHandler';

export default function LotesScreen({ route, navigation }) {
  const { operacionId, roney_op } = route.params || {};
  const [lotes, setLotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);

  useEffect(() => {
    console.log('🔧 LotesScreen: Inicializando...', { operacionId, roney_op });
    if (!operacionId) {
      ErrorHandler.handleError(
        new Error('Missing operation parameters'),
        'Error de Navegación',
        'No se recibieron los datos de la operación'
      );
      navigation.goBack();
      return;
    }
    cargarLotes();
  }, [operacionId]);

  // Escuchar cambios cuando se regrese de otras pantallas
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarLotes();
    });
    return unsubscribe;
  }, [navigation]);

  const cargarLotes = useCallback(async () => {
    console.log('📂 LotesScreen: Cargando lotes...', operacionId);
    try {
      const data = await ErrorHandler.getStorageData(`lotes_${operacionId}`);
      const lotesCargados = ErrorHandler.safeJsonParse(data, []);
      const lotesValidados = ErrorHandler.sanitizeData(lotesCargados, 'lotes');
      console.log('✅ LotesScreen: Lotes cargados:', lotesValidados.length);
      setLotes(lotesValidados);
    } catch (e) {
      console.error('❌ LotesScreen: Error cargando lotes:', e);
      ErrorHandler.handleError(e, 'Error de Carga', 'No se pudieron cargar los lotes');
    }
  }, [operacionId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarLotes();
    setRefreshing(false);
  }, []);

  const abrirModalEdicion = (lote) => {
    setLoteSeleccionado(lote);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setLoteSeleccionado(null);
  };

  const actualizarLote = async (loteActualizado) => {
    try {
      const nuevosLotes = lotes.map(lote => 
        lote.id === loteActualizado.id ? loteActualizado : lote
      );
      await AsyncStorage.setItem(`lotes_${operacionId}`, JSON.stringify(nuevosLotes));
      setLotes(nuevosLotes);
      cerrarModal();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el lote');
    }
  };

  const eliminarLote = async (loteId) => {
    try {
      // Obtener el lote a eliminar
      const loteAEliminar = lotes.find(l => l.id === loteId);
      if (!loteAEliminar) return;

      // Liberar las muestras (cambiar su loteId a null)
      const muestrasData = await AsyncStorage.getItem(`muestras_${operacionId}`);
      if (muestrasData) {
        const muestras = JSON.parse(muestrasData);
        const muestrasActualizadas = muestras.map(muestra => {
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
      setLotes(nuevosLotes);

      Alert.alert('✓ Completado', 'Lote eliminado y muestras liberadas');
    } catch (e) {
      Alert.alert('Error', 'No se pudo eliminar el lote');
    }
  };

  const liberarMuestra = async (loteId, muestraId) => {
    try {
      // Actualizar la muestra para liberar su loteId
      const muestrasData = await AsyncStorage.getItem(`muestras_${operacionId}`);
      if (muestrasData) {
        const muestras = JSON.parse(muestrasData);
        const muestrasActualizadas = muestras.map(muestra => {
          if (muestra.id === muestraId) {
            return { ...muestra, loteId: null };
          }
          return muestra;
        });
        await AsyncStorage.setItem(`muestras_${operacionId}`, JSON.stringify(muestrasActualizadas));
      }

      // Actualizar el lote removiendo la muestra de su lista
      const nuevosLotes = lotes.map(lote => {
        if (lote.id === loteId) {
          const nuevasMuestrasIds = lote.muestrasIds.filter(id => id !== muestraId);
          
          // Recalcular daño real si hay muestras restantes
          let nuevoDañoReal = 0;
          if (nuevasMuestrasIds.length > 0 && muestrasData) {
            const muestras = JSON.parse(muestrasData);
            const muestrasDelLote = muestras.filter(m => nuevasMuestrasIds.includes(m.id));
            nuevoDañoReal = muestrasDelLote.reduce((sum, m) => sum + (m.datos.porcentajeDaño || 0), 0) / muestrasDelLote.length;
          }

          return {
            ...lote,
            muestrasIds: nuevasMuestrasIds,
            dañoReal: Math.round(nuevoDañoReal * 100) / 100
          };
        }
        return lote;
      }).filter(lote => lote.muestrasIds.length > 0); // Eliminar lotes sin muestras

      await AsyncStorage.setItem(`lotes_${operacionId}`, JSON.stringify(nuevosLotes));
      setLotes(nuevosLotes);

      return true;
    } catch (e) {
      Alert.alert('Error', 'No se pudo liberar la muestra');
      return false;
    }
  };

  const navegarAMuestras = () => {
    navigation.navigate('Muestras', { 
      operacionId, 
      roney_op 
    });
  };

  const renderLote = ({ item }) => (
    <LoteItem
      lote={item}
      onPress={() => abrirModalEdicion(item)}
      onDelete={eliminarLote}
    />
  );

  const totalHectareas = lotes.reduce((sum, lote) => sum + lote.hectareas, 0);

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Lotes - {roney_op}</Text>
        <TouchableOpacity
          style={styles.muestrasBtn}
          onPress={navegarAMuestras}
        >
          <Text style={styles.btnText}>Ver Muestras</Text>
        </TouchableOpacity>
      </View> */}

      {lotes.length > 0 && (
        <View style={styles.statsContainer}>
          {/* <Text style={styles.statsText}>📊 Total de lotes: {lotes.length}</Text> */}
          <Text style={styles.statsText}>🌾 Total hectáreas: {totalHectareas.toFixed(1)} ha</Text>
        </View>
      )}

      <FlatList
        data={lotes}
        keyExtractor={(item) => item.id}
        renderItem={renderLote}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
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
        }
      />

      <EditarLoteModal
        visible={modalVisible}
        lote={loteSeleccionado}
        operacionId={operacionId}
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  muestrasBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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