import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Image, TouchableOpacity, Platform, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CrearOperacionModal from '../components/modals/CrearOperacionModal';
import PerfilModal from '../components/modals/PerfilModal';
import OperacionItem from '../components/OperacionItem';
import { ErrorHandler } from '../utils/ErrorHandler';
import { getDeviceInfo } from '../services/AuthService';
import logo from '../../assets/roney.png';

// ✅ Constantes fuera del componente
const OPERACION_ITEM_HEIGHT = 100;

export default function OperacionesScreen({ navigation, userSession, onLogout, onDeleteAccount }) {
  const [operaciones, setOperaciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [perfilModalVisible, setPerfilModalVisible] = useState(false);
  const [operacionSeleccionada, setOperacionSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [sugerenciasVisibles, setSugerenciasVisibles] = useState(false);

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

  const handleGuardarOperacion = useCallback((datosOp) => {
    try {
      const roney_op = typeof datosOp === 'object' ? datosOp.roney_op : arguments[0];
      const cultivo = typeof datosOp === 'object' ? datosOp.cultivo : arguments[1];
      const campo = typeof datosOp === 'object' ? datosOp.campo : (arguments[2] || '');
      const campana = typeof datosOp === 'object' ? datosOp.campana : (arguments[3] || '');

      const nombreLimpio = (roney_op || '').trim();

      if (modoEdicion && operacionSeleccionada) {
        // Validar que no colisione con otra operación de distinto ID
        const yaExiste = operaciones.some(
          op => op.id !== operacionSeleccionada.id && op.roney_op?.trim().toLowerCase() === nombreLimpio.toLowerCase()
        );
        if (yaExiste) {
          Alert.alert('Operación existente', `Ya existe otra operación con el nombre "${nombreLimpio}".`);
          return;
        }

        // Editar operación existente
        const nuevasOperaciones = operaciones.map(op =>
          op.id === operacionSeleccionada.id ? { ...op, roney_op: nombreLimpio, cultivo, campo: (campo || '').trim(), campana: campana || '' } : op
        );
        guardarOperaciones(nuevasOperaciones);
      } else {
        // Verificar que no exista ya en el dispositivo por nombre de operación
        const yaExiste = operaciones.some(
          op => op.roney_op?.trim().toLowerCase() === nombreLimpio.toLowerCase()
        );
        if (yaExiste) {
          Alert.alert('Operación existente', `Ya existe una operación con el nombre "${nombreLimpio}".`);
          return;
        }

        // Crear nueva operación al principio de la lista (más reciente primero)
        const nuevaOperacion = {
          id: Date.now().toString(),
          roney_op: nombreLimpio,
          campo: (campo || '').trim(),
          campana: campana || '',
          cultivo,
          fecha: new Date().toISOString(),
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

  // ✅ Sincronizar con el backend sincroniza.php (con fallback a mock data)
  const handleSincronizar = useCallback(async () => {
    if (sincronizando) return;
    setSincronizando(true);

    try {
      const { iddispositivo } = await getDeviceInfo();
      const deviceIdToSend = iddispositivo || userSession?.iddispositivo || 'unknown-device';

      let ordenesParaProcesar = [];

      try {
        const formData = new FormData();
        formData.append('iddispositivo', deviceIdToSend);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch('http://gestionroney.com/sincroniza.php', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          let data = null;
          try {
            data = JSON.parse(text);
          } catch (pe) {
            console.log('Respuesta no JSON de sincroniza.php:', text);
          }

          if (Array.isArray(data)) {
            ordenesParaProcesar = data;
          } else if (data && typeof data === 'object') {
            if (Array.isArray(data.operaciones)) ordenesParaProcesar = data.operaciones;
            else if (Array.isArray(data.ordenes)) ordenesParaProcesar = data.ordenes;
            else if (Array.isArray(data.data)) ordenesParaProcesar = data.data;
            else if (data.nombre || data.roney_op) ordenesParaProcesar = [data];
          }
        }
      } catch (netErr) {
        console.log('sincroniza.php no disponible aún, usando mock de datos:', netErr.message);
      }

      // Si el servidor no devolvió órdenes (endpoint aún en construcción), generar datos mock
      if (ordenesParaProcesar.length === 0) {
        const generarCodigo = () => {
          const prefijo = Math.random() > 0.5 ? 'RU' : 'ZU';
          const num = Math.floor(1000 + Math.random() * 9000);
          return `${prefijo}${num}`;
        };

        const nombreAleatorio = Math.random() > 0.4
          ? `${generarCodigo()} / ${generarCodigo()}`
          : generarCodigo();

        const esFina = Math.random() > 0.5;
        const mockCampana = esFina ? 'Fina' : 'Gruesa';
        const mockCultivo = esFina
          ? ['Trigo', 'Cebada', 'Avena', 'Centeno'][Math.floor(Math.random() * 4)]
          : ['Soja de 1.a', 'Soja de 2.a', 'Maíz', 'Maíz Tardío', 'Girasol'][Math.floor(Math.random() * 5)];

        const camposMock = ['La Esperanza', 'San Pedro', 'El Ombú', 'La Huella', 'Don Julián'];
        const mockCampo = camposMock[Math.floor(Math.random() * camposMock.length)];

        ordenesParaProcesar = [
          {
            nombre: nombreAleatorio,
            campo: mockCampo,
            campana: mockCampana,
            cultivo: mockCultivo,
          }
        ];
      }

      // Obtener operaciones actuales frescas del storage
      const dataActual = await ErrorHandler.getStorageData('operaciones');
      const opsActuales = ErrorHandler.safeJsonParse(dataActual, operaciones);

      let nuevasAgregadas = 0;
      let yaExistentes = 0;
      let listaActualizada = [...opsActuales];

      for (const item of ordenesParaProcesar) {
        const nombreOp = (item.roney_op || item.nombre || item.operacion || item.nombre_operacion || '').trim();
        if (!nombreOp) continue;

        // Verificar por nombre de operación que no exista ya en el dispositivo
        const yaExiste = listaActualizada.some(
          op => op.roney_op?.trim().toLowerCase() === nombreOp.toLowerCase()
        );

        if (yaExiste) {
          yaExistentes++;
        } else {
          const nuevaOp = {
            id: item.id?.toString() || Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
            roney_op: nombreOp,
            campo: (item.campo || item.nombre_campo || '').trim(),
            campana: item.campana || item.campaña || 'Fina',
            cultivo: item.cultivo || 'Trigo',
            fecha: item.fecha || new Date().toISOString(),
          };
          listaActualizada = [nuevaOp, ...listaActualizada];
          nuevasAgregadas++;
        }
      }

      if (nuevasAgregadas > 0) {
        await guardarOperaciones(listaActualizada);
        Alert.alert(
          'Sincronización Exitosa',
          `Se agregaron ${nuevasAgregadas} nueva(s) operación(es) desde el servidor.${yaExistentes > 0 ? ` (${yaExistentes} ya existían)` : ''}`
        );
      } else if (yaExistentes > 0) {
        Alert.alert(
          'Sincronización',
          'La(s) orden(es) recibida(s) ya existen en el dispositivo.'
        );
      } else {
        Alert.alert(
          'Sincronización',
          'No se encontraron nuevas órdenes para este dispositivo.'
        );
      }
    } catch (e) {
      console.error('Error durante sincronización:', e);
      Alert.alert('Error', 'Ocurrió un error al sincronizar las operaciones.');
    } finally {
      if (isMountedRef.current) {
        setSincronizando(false);
      }
    }
  }, [sincronizando, userSession, operaciones, guardarOperaciones]);

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

  // ✅ Memoizar EmptyComponent (diferencia "sin operaciones" de "sin resultados")
  const EmptyComponent = useMemo(() => {
    if (busqueda.trim().length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔎</Text>
          <Text style={styles.emptyText}>Sin resultados</Text>
          <Text style={styles.emptySubtext}>No se encontraron operaciones para "{busqueda.trim()}"</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No hay operaciones</Text>
        <Text style={styles.emptySubtext}>Crea tu primera operación para comenzar</Text>
      </View>
    );
  }, [busqueda]);

  // ✅ Memoizar valores iniciales del modal
  const valoresInicialesModal = useMemo(() => {
    if (modoEdicion && operacionSeleccionada) {
      return {
        roney_op: operacionSeleccionada.roney_op || '',
        campo: operacionSeleccionada.campo || '',
        campana: operacionSeleccionada.campana || '',
        cultivo: operacionSeleccionada.cultivo || '',
      };
    }
    return { roney_op: '', campo: '', campana: '', cultivo: '' };
  }, [modoEdicion, operacionSeleccionada]);

  // ✅ Normalizar texto (sin tildes, minúsculas) para comparar
  const normalizarTexto = useCallback((texto) => {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }, []);

  // ✅ Filtrado en vivo por nombre de operación o nombre de campo
  const operacionesFiltradas = useMemo(() => {
    const q = normalizarTexto(busqueda.trim());
    if (!q) return operaciones;
    return operaciones.filter((op) =>
      normalizarTexto(op.roney_op).includes(q) || normalizarTexto(op.campo).includes(q)
    );
  }, [operaciones, busqueda, normalizarTexto]);

  // ✅ Sugerencias tipo Google: hasta 5 coincidencias mientras se tipea
  const sugerencias = useMemo(() => {
    const q = normalizarTexto(busqueda.trim());
    if (!q || !sugerenciasVisibles) return [];
    return operacionesFiltradas.slice(0, 5);
  }, [operacionesFiltradas, busqueda, sugerenciasVisibles, normalizarTexto]);

  // ✅ Al clickear una sugerencia: solo queda esa operación en pantalla
  const seleccionarSugerencia = useCallback((op) => {
    setBusqueda(op.roney_op || '');
    setSugerenciasVisibles(false);
    Keyboard.dismiss();
  }, []);

  const limpiarBusqueda = useCallback(() => {
    setBusqueda('');
    setSugerenciasVisibles(false);
  }, []);

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
      
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.crearBtn}
          onPress={abrirModalCreacion}
        >
          <Text style={styles.crearBtnText}>+ Crear Operación</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sincronizarBtn, sincronizando && styles.sincronizarBtnDisabled]}
          onPress={handleSincronizar}
          disabled={sincronizando}
        >
          {sincronizando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sincronizarBtnText}>🔄 Sincronizar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 🔍 Buscador de operaciones */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={busqueda}
          onChangeText={(t) => {
            setBusqueda(t);
            setSugerenciasVisibles(true);
          }}
          placeholder="Buscar por operación o campo..."
          placeholderTextColor="#999"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity
            style={styles.searchClearBtn}
            onPress={limpiarBusqueda}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.searchClearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 💡 Sugerencias (estilo Google) */}
      {sugerencias.length > 0 && (
        <View style={styles.sugerenciasContainer}>
          {sugerencias.map((op) => (
            <TouchableOpacity
              key={`sug_${op.id}`}
              style={styles.sugerenciaItem}
              onPress={() => seleccionarSugerencia(op)}
              activeOpacity={0.7}
            >
              <Text style={styles.sugerenciaIcono}>🔍</Text>
              <View style={styles.sugerenciaTextos}>
                <Text style={styles.sugerenciaNombre} numberOfLines={1}>{op.roney_op}</Text>
                {!!op.campo && <Text style={styles.sugerenciaCampo} numberOfLines={1}>{op.campo}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={operacionesFiltradas}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={EmptyComponent}
        keyboardShouldPersistTaps="handled"
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
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  crearBtn: {
    flex: 1.1,
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crearBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sincronizarBtn: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sincronizarBtnDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.8,
  },
  sincronizarBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // 🔍 Buscador
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    padding: 0,
  },
  searchClearBtn: {
    paddingLeft: 8,
  },
  searchClearText: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
  },
  // 💡 Sugerencias
  sugerenciasContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  sugerenciaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sugerenciaIcono: {
    fontSize: 14,
    marginRight: 10,
  },
  sugerenciaTextos: {
    flex: 1,
  },
  sugerenciaNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  sugerenciaCampo: {
    fontSize: 12,
    color: '#777',
    marginTop: 1,
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