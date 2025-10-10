import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MuestraItem from '../components/MuestraItem';
import MuestraTipo1Modal from '../components/modals/MuestraTipo1Modal';
import MuestraTipo2Modal from '../components/modals/MuestraTipo2Modal';
import MuestraTipo3Modal from '../components/modals/MuestraTipo3Modal';
import MuestraTipo4Modal from '../components/modals/MuestraTipo4Modal';
import CerrarLoteModal from '../components/modals/CerrarLoteModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandler } from '../utils/ErrorHandler';
import { calculoDeDaño } from '../utils/calculoDeDaño';
import { 
  obtenerEstadosFenologicos, 
  esEstadoValido,
  mapearEstadoATipoModal 
} from '../utils/fenologicosConfig';
import MuestraTrigoModal from '../components/modals/MuestraTrigoModal';
import MuestraMaizModal from '../components/modals/MuestraMaizModal'; // TODO: Crear estos modales
import MuestraGirasolModal from '../components/modals/MuestraGirasolModal'; // TODO: Crear este modal

export default function MuestrasScreen({ route, navigation }) {
  const { roney_op, operacionId } = route.params || {};
  const [cultivo, setCultivo] = useState('soja');
  const [estadosFenologicos, setEstadosFenologicos] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [fenologicoSeleccionado, setFenologicoSeleccionado] = useState('1');
  
  const [modalTipo, setModalTipo] = useState(null);
  const [muestraEnEdicion, setMuestraEnEdicion] = useState(null);
  const [muestrasSeleccionadas, setMuestrasSeleccionadas] = useState(new Set());
  const [cerrarLoteModalVisible, setCerrarLoteModalVisible] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

  // Función de mapeo ahora usa la configuración según el cultivo
  const mapSeleccionToTipo = useCallback((valorSeleccion) => {
    return mapearEstadoATipoModal(cultivo, valorSeleccion);
  }, [cultivo]);

  useEffect(() => {
    if (!roney_op || !operacionId) {
      ErrorHandler.handleError(
        new Error('Missing operation parameters'),
        'Error de Navegación',
        'No se recibieron los datos de la operación'
      );
      navigation.goBack();
      return;
    }
    cargarDatosOperacion();
    inicializarDatos();
  }, [operacionId, roney_op]);

  // Cargar el tipo de cultivo de la operación actual
  const cargarDatosOperacion = async () => {
    try {
      const data = await ErrorHandler.getStorageData('operaciones');
      const operaciones = ErrorHandler.safeJsonParse(data, []);
      const operacionActual = operaciones.find(op => op.id === operacionId);
      
      if (operacionActual) {
        const cultivoActual = operacionActual.cultivo || 'soja';
        setCultivo(cultivoActual);
        const estados = obtenerEstadosFenologicos(cultivoActual);
        setEstadosFenologicos(estados);
        
        // Si el estado actual no es válido para este cultivo, resetear al primero
        if (!esEstadoValido(cultivoActual, fenologicoSeleccionado)) {
          setFenologicoSeleccionado(estados[0]?.value || '1');
        }
      }
    } catch (e) {
      ErrorHandler.handleError(e, 'Error de Carga', 'No se pudo cargar el tipo de cultivo');
      // Usar soja por defecto en caso de error
      const estadosDefault = obtenerEstadosFenologicos('soja');
      setEstadosFenologicos(estadosDefault);
    }
  };

  // Recargar muestras cuando se regrese de otras pantallas
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarMuestras();
    });
    return unsubscribe;
  }, [navigation]);

  const inicializarDatos = async () => {
    await cargarMuestras();
  };

  const cargarMuestras = useCallback(async () => {
    try {
      const data = await ErrorHandler.getStorageData(`muestras_${operacionId}`);
      const muestrasCargadas = ErrorHandler.safeJsonParse(data, []);
      const muestrasValidadas = ErrorHandler.sanitizeData(muestrasCargadas, 'muestras');
      setMuestras(muestrasValidadas);
    } catch (e) {
      ErrorHandler.handleError(e, 'Error de Carga', 'No se pudieron cargar las muestras');
    }
  }, [operacionId]);

  const guardarMuestras = useCallback(async (nuevasMuestras) => {
    try {
      const sanitized = ErrorHandler.sanitizeData(nuevasMuestras, 'muestras');
      await ErrorHandler.setStorageData(`muestras_${operacionId}`, sanitized);
      setMuestras(sanitized);
    } catch (e) {
      ErrorHandler.handleError(e, 'Error de Guardado', 'No se pudieron guardar las muestras');
    }
  }, [operacionId]);

  const abrirModalSegunTipo = () => {
    setMuestraEnEdicion(null);
    const tipoMapeado = mapSeleccionToTipo(fenologicoSeleccionado);
    setModalTipo(tipoMapeado);
  };

  const cerrarModal = () => {
    setModalTipo(null);
    setMuestraEnEdicion(null);
  };

  const abrirModalEdicion = (muestra) => {
    setMuestraEnEdicion(muestra);
    setModalTipo(muestra.tipo);
  };

  const agregarMuestraDesdeModal = async (tipo, datosCompletos) => {
    const porcentajeDaño = calculoDeDaño(datosCompletos, fenologicoSeleccionado, cultivo);
  
    console.log('🔍 Debug agregarMuestra:', {
      cultivo,
      fenologicoSeleccionado,
      tipo,
      datos: datosCompletos,
      porcentajeDaño
    });
    
    const datosConDaño = { ...datosCompletos, porcentajeDaño };
  
    if (muestraEnEdicion) {
      const nuevasMuestras = muestras.map((m) =>
        m.id === muestraEnEdicion.id
          ? { ...m, datos: { ...datosConDaño, coordenada: m.datos?.coordenada } }
          : m
      );
      guardarMuestras(nuevasMuestras);
    } else {
      // CAMBIO: Obtener siguiente número del contador
      const numeroMuestra = await obtenerSiguienteNumeroMuestra(operacionId, tipo);
      
      const nuevaMuestra = {
        id: Date.now().toString(),
        tipo,
        datos: { ...datosConDaño },
        nombre: `Muestra ${numeroMuestra}`, // <-- AHORA USA EL CONTADOR
        fecha: new Date().toLocaleDateString(),
        operacionId: operacionId,
        loteId: null,
      };
      const nuevasMuestras = [...muestras, nuevaMuestra];
      guardarMuestras(nuevasMuestras);
    }
    cerrarModal();
  };

  const recalcularDañoMuestrasActuales = async (fenologicoParam = null) => {
    setRecalculando(true);
    
    try {
      const fenologicoParaCalculo = fenologicoParam ?? fenologicoSeleccionado;
      const tipoMapeado = mapSeleccionToTipo(fenologicoParaCalculo);
      const muestrasActualizadas = muestras.map(muestra => {
        // Solo recalcular muestras del tipo fenológico actual y que no estén en lotes
        if (muestra.tipo === tipoMapeado && !muestra.loteId) {
          // *** CAMBIO CLAVE: Ahora pasamos el cultivo a calculoDeDaño ***
          const nuevoPorcentajeDaño = calculoDeDaño(
            muestra.datos,
            fenologicoParaCalculo,
            cultivo
          );
          
          return {
            ...muestra,
            datos: {
              ...muestra.datos,
              porcentajeDaño: nuevoPorcentajeDaño
            }
          };
        }
        return muestra;
      });

      await guardarMuestras(muestrasActualizadas);
    } catch (e) {
      Alert.alert('Error', 'No se pudo recalcular el daño de las muestras');
    } finally {
      // Delay mínimo para mostrar el loading
      setTimeout(() => setRecalculando(false), 500);
    }
  };

  const calcularPromedioSeleccionadas = () => {
    if (muestrasSeleccionadas.size === 0) return '0,0';
    
    const muestrasArray = muestras.filter(m => muestrasSeleccionadas.has(m.id));
    const sumaDanos = muestrasArray.reduce((sum, m) => {
      const porcentaje = parseFloat(m.datos?.porcentajeDaño) || 0;
      return sum + porcentaje;
    }, 0);
    
    const promedio = sumaDanos / muestrasArray.length;
    const trunc = Math.trunc(promedio * 10) / 10; // truncar a 1 decimal, no redondear
    return trunc.toFixed(1).replace('.', ',');
  };

  const handleCambioFenologico = async (nuevoFenologico) => {
    setFenologicoSeleccionado(nuevoFenologico);
    setMuestrasSeleccionadas(new Set()); // Limpiar selección
    // Recalcular inmediatamente usando el nuevo valor
    await recalcularDañoMuestrasActuales(nuevoFenologico);
  };

  const borrarMuestra = (id) => {
    const muestra = muestras.find(m => m.id === id);
    
    if (muestra?.loteId) {
      Alert.alert(
        'Muestra en Lote',
        'Esta muestra está asignada a un lote. Primero debe liberarla desde la pantalla de lotes.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar',
      '¿Seguro que deseas borrar esta muestra?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            const nuevasMuestras = muestras.filter(m => m.id !== id);
            guardarMuestras(nuevasMuestras);
            const nuevasSeleccionadas = new Set(muestrasSeleccionadas);
            nuevasSeleccionadas.delete(id);
            setMuestrasSeleccionadas(nuevasSeleccionadas);
          }
        }
      ]
    );
  };

  const tipoFenologicoLabel = React.useMemo(() => {
    const estadoActual = estadosFenologicos.find(e => e.value === fenologicoSeleccionado);
    return estadoActual?.label || fenologicoSeleccionado;
  }, [estadosFenologicos, fenologicoSeleccionado]);

  const toggleSeleccionMuestra = (id) => {
    const muestra = muestras.find(m => m.id === id);
    if (muestra?.loteId) {
      Alert.alert('Info', 'Esta muestra ya está asignada a un lote');
      return;
    }

    const nuevasSeleccionadas = new Set(muestrasSeleccionadas);
    if (nuevasSeleccionadas.has(id)) {
      nuevasSeleccionadas.delete(id);
    } else {
      nuevasSeleccionadas.add(id);
    }
    setMuestrasSeleccionadas(nuevasSeleccionadas);
  };

  const abrirCerrarLoteModal = () => {
    // Permitir crear lote sin muestras seleccionadas
    setCerrarLoteModalVisible(true);
  };

  const handleCerrarLote = async (datosLote) => {
    try {
      // Obtener el label del estado fenológico seleccionado
      const estadoActual = estadosFenologicos.find(e => e.value === fenologicoSeleccionado);
      const fenologicoLabel = estadoActual?.label || fenologicoSeleccionado;

      const nuevoLote = {
        id: Date.now().toString(),
        nombreLote: datosLote.nombreLote,
        hectareas: datosLote.hectareas,
        dañoReal: datosLote.dañoReal,
        dañoPactado: datosLote.dañoPactado,
        muestrasIds: datosLote.muestrasIds,
        operacionId: operacionId,
        fecha: new Date().toISOString(),
        tipoFenologico: fenologicoSeleccionado, // El value
        tipoFenologicoLabel: fenologicoLabel, // El label
      };

      const lotesData = await AsyncStorage.getItem(`lotes_${operacionId}`);
      const lotes = lotesData ? JSON.parse(lotesData) : [];
      const nuevosLotes = [...lotes, nuevoLote];
      await AsyncStorage.setItem(`lotes_${operacionId}`, JSON.stringify(nuevosLotes));

      const muestrasActualizadas = muestras.map(muestra => {
        if (datosLote.muestrasIds.includes(muestra.id)) {
          return { ...muestra, loteId: nuevoLote.id };
        }
        return muestra;
      });

      await guardarMuestras(muestrasActualizadas);
      setMuestrasSeleccionadas(new Set());
      
      Alert.alert(
        '✅ Lote Creado',
        `Lote "${datosLote.nombreLote}" creado con ${datosLote.muestrasIds.length} muestras`,
        [
          { text: 'Ver Lotes', onPress: () => navigation.navigate('Lotes', { operacionId, roney_op }) },
          { text: 'Continuar Aquí', style: 'cancel' }
        ]
      );

    } catch (e) {
      Alert.alert('Error', 'No se pudo crear el lote');
    }
  };

  const tipoActual = mapSeleccionToTipo(fenologicoSeleccionado);
  
  // Filtrar muestras por tipo mapeado y que no estén en lotes
  const muestrasFiltradas = muestras.filter(m => m.tipo === tipoActual && !m.loteId);

  // Obtener muestras seleccionadas para el modal (se calculan antes del render)
  const muestrasSeleccionadasArray = React.useMemo(() => {
    return muestras.filter(m => 
      muestrasSeleccionadas.has(m.id) && 
      m.tipo === tipoActual &&
      !m.loteId
    );
  }, [muestras, muestrasSeleccionadas, tipoActual]);

  const renderMuestra = ({ item }) => (
    <MuestraItem 
      item={item} 
      isSelected={muestrasSeleccionadas.has(item.id)}
      onOpenModal={abrirModalEdicion}
      onToggleSelect={toggleSeleccionMuestra}
      onDelete={() => borrarMuestra(item.id)}
      isInLote={!!item.loteId}
    />
  );

  const obtenerSiguienteNumeroMuestra = async (operacionId, tipo) => {
    try {
      const key = `contador_muestras_${operacionId}_${tipo}`;
      const contadorStr = await AsyncStorage.getItem(key);
      const contador = contadorStr ? parseInt(contadorStr, 10) : 0;
      const siguiente = contador + 1;
      await AsyncStorage.setItem(key, siguiente.toString());
      return siguiente;
    } catch (e) {
      console.error('Error obteniendo contador:', e);
      return Date.now() % 10000; // Fallback: usar timestamp
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      
    
        <Picker
          selectedValue={fenologicoSeleccionado}
          style={styles.picker}
          onValueChange={(value) => handleCambioFenologico(value)}
        >
          {estadosFenologicos.map((estado) => (
            <Picker.Item 
              key={estado.value} 
              label={estado.label} 
              value={estado.value} 
              style={styles.pickerItem}
            />
          ))}
        </Picker>
        <TouchableOpacity
          style={styles.lotesBtn}
          onPress={() => navigation.navigate('Lotes', { operacionId, roney_op })}
        >
          <Text style={styles.btnText}>Lotes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.agrega} onPress={abrirModalSegunTipo}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>+</Text>
        </TouchableOpacity>
   
      </View>

      <FlatList
        data={muestrasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderMuestra}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay muestras cargadas correspondientes al estado fenológico seleccionado</Text>
        }
      />

      <ModalesSegunTipo
        tipo={modalTipo}
        cultivo={cultivo}
        visible={!!modalTipo}
        onCerrar={cerrarModal}
        onGuardar={agregarMuestraDesdeModal}
        valoresIniciales={muestraEnEdicion?.datos || { 
          dato_1: '', 
          dato_2: '', 
          dato_3: '', 
          dato_4: '',
          coordenada: ''
        }}
        esEdicion={!!muestraEnEdicion}
      />

      <CerrarLoteModal
        visible={cerrarLoteModalVisible}
        onClose={() => setCerrarLoteModalVisible(false)}
        onConfirmar={handleCerrarLote}
        muestrasSeleccionadas={muestrasSeleccionadasArray}
        tipoFenologicoSeleccionado={fenologicoSeleccionado}
        tipoFenologicoLabel={tipoFenologicoLabel}
      />

      <View style={styles.footer}>
        <View style={styles.muestrasFooter}>
          <Text style={styles.footerText}>
            Seleccionadas: {muestrasSeleccionadas.size}
          </Text>
          <Text style={styles.footerText}>% {calcularPromedioSeleccionadas()}</Text>
        </View>
        <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={styles.limpiarSeleccionBtn}
            onPress={() => setMuestrasSeleccionadas(new Set())}
          >
            <Text style={styles.limpiarSeleccionText}>Limpiar Selección</Text>
          </TouchableOpacity>
        <TouchableOpacity
          style={styles.cerrarBtn}
          onPress={abrirCerrarLoteModal}
        >
          <Text style={styles.btnText}>Crear Lote</Text>
        </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Componente para manejar los diferentes modales
function ModalesSegunTipo({ tipo, cultivo, visible, onCerrar, onGuardar, valoresIniciales, esEdicion }) {
  if (!visible || !tipo) return null;

  const props = {
    visible: true,
    onClose: onCerrar,
    onGuardar: (datosCompletos) => { 
      onGuardar(tipo, datosCompletos); 
    },
    valoresIniciales: valoresIniciales || { 
      dato_1: '', 
      dato_2: '', 
      coordenada: '' 
    },
    esEdicion: esEdicion
  };

  // Routing de modales según cultivo y tipo
  switch (cultivo) {
    case 'soja':
      switch (tipo) {
        case '1': return <MuestraTipo1Modal {...props} />;
        case '2': return <MuestraTipo2Modal {...props} />;
        case '3': return <MuestraTipo3Modal {...props} />; 
        case '4': return <MuestraTipo4Modal {...props} />; 
        default: return null;
      }
    
    case 'trigo':
      return <MuestraTrigoModal {...props} />;
    
    case 'maiz':
      // TODO: Crear los 2 modales de maíz
      switch (tipo) {
        case '1': 
        case '2': 
          return <MuestraMaizModal {...props} tipoModal={tipo} />;
        default: return null;
      }
    
    case 'girasol':
      // TODO: Crear el modal de girasol
      return <MuestraGirasolModal {...props} />;
    
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 50,
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  agrega: {
    backgroundColor: '#28a745', 
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotesBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  cerrarBtn: {
    backgroundColor: '#d9534f',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  subPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recalculandoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recalculandoText: {
    fontSize: 12,
    color: '#007bff',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  picker: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    flex: 1,
    minWidth: 140,
    color: '#000',
  },
  pickerItem: {
    color: '#000'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#999',
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  muestrasFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  limpiarSeleccionBtn: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    alignItems: 'center',
  },
  limpiarSeleccionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});