import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MuestraItem from '../components/MuestraItem';
import MuestraTipo1Modal from '../components/modals/MuestraTipo1Modal';
import MuestraTipo2Modal from '../components/modals/MuestraTipo2Modal';
import MuestraTipo3Modal from '../components/modals/MuestraTipo3Modal';
import MuestraTipo4Modal from '../components/modals/MuestraTipo4Modal';
import CerrarLoteModal from '../components/modals/CerrarLoteModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  calculoDeDaño, 
  getSubFenologicosPorTipo, 
  existeSubFenologico, 
  getPrimerSubFenologico 
} from '../utils/calculoDeDaño';

export default function MuestrasScreen({ route, navigation }) {
  const { roney_op, operacionId } = route.params || {};
  const [muestras, setMuestras] = useState([]);
  const [fenologicoSeleccionado, setFenologicoSeleccionado] = useState('1');
  const [subFenologicoSeleccionado, setSubFenologicoSeleccionado] = useState('sub1');
  const [subFenologicosPorTipo, setSubFenologicosPorTipo] = useState({});
  
  const [modalTipo, setModalTipo] = useState(null);
  const [muestrasSeleccionadas, setMuestrasSeleccionadas] = useState(new Set());
  const [cerrarLoteModalVisible, setCerrarLoteModalVisible] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

  useEffect(() => {
    if (!roney_op || !operacionId) {
      Alert.alert('Error', 'No se recibieron los datos de la operación');
      navigation.goBack();
      return;
    }
    inicializarDatos();
  }, [operacionId, roney_op]);

  // Recargar muestras cuando se regrese de otras pantallas
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarMuestras();
    });
    return unsubscribe;
  }, [navigation]);

  const inicializarDatos = async () => {
    await cargarMuestras();
    await cargarSubFenologicosGuardados();
  };

  const cargarMuestras = async () => {
    try {
      const data = await AsyncStorage.getItem(`muestras_${operacionId}`);
      if (data) {
        setMuestras(JSON.parse(data));
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar las muestras');
    }
  };

  const cargarSubFenologicosGuardados = async () => {
    try {
      const data = await AsyncStorage.getItem(`subFenologicos_${operacionId}`);
      const savedSubs = data ? JSON.parse(data) : {};
      
      // Inicializar con valores por defecto si no existen
      const subsPorTipo = {
        '1': savedSubs['1'] || 'sub1',
        '2': savedSubs['2'] || 'sub1',
        '3': savedSubs['3'] || 'sub1',
        '4': savedSubs['4'] || 'sub2'
      };

      setSubFenologicosPorTipo(subsPorTipo);
      
      // Establecer el subFenológico actual
      setSubFenologicoSeleccionado(subsPorTipo[fenologicoSeleccionado]);
      
    } catch (e) {
      console.warn('Error cargando subFenológicos:', e);
      // Valores por defecto
      const defaultSubs = {
        '1': 'sub1',
        '2': 'sub1', 
        '3': 'sub1',
        '4': 'sub2'
      };
      setSubFenologicosPorTipo(defaultSubs);
      setSubFenologicoSeleccionado(defaultSubs[fenologicoSeleccionado]);
    }
  };

  const guardarSubFenologicos = async (nuevosSubFenologicos) => {
    try {
      await AsyncStorage.setItem(`subFenologicos_${operacionId}`, JSON.stringify(nuevosSubFenologicos));
      setSubFenologicosPorTipo(nuevosSubFenologicos);
    } catch (e) {
      console.warn('Error guardando subFenológicos:', e);
    }
  };

  const guardarMuestras = async (nuevasMuestras) => {
    try {
      await AsyncStorage.setItem(`muestras_${operacionId}`, JSON.stringify(nuevasMuestras));
      setMuestras(nuevasMuestras);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron guardar las muestras');
    }
  };

  const abrirModalSegunTipo = () => {
    setModalTipo(fenologicoSeleccionado);
  };

  const cerrarModal = () => {
    setModalTipo(null);
  };

  const agregarMuestraDesdeModal = (tipo, datos) => {
    // Calcular porcentaje de daño usando la nueva función
    const porcentajeDaño = calculoDeDaño(datos, tipo, subFenologicosPorTipo[tipo]);

    const datosConDaño = {
      ...datos,
      porcentajeDaño
    };

    const muestrasDelTipo = muestras.filter(m => m.tipo === tipo && !m.loteId);
    const nuevaMuestra = {
      id: Date.now().toString(),
      tipo,
      datos: datosConDaño,
      nombre: `Muestra Tipo ${tipo} - ${muestrasDelTipo.length + 1}`,
      fecha: new Date().toLocaleDateString(),
      operacionId: operacionId,
      loteId: null,
    };
    const nuevasMuestras = [...muestras, nuevaMuestra];
    guardarMuestras(nuevasMuestras);
    cerrarModal();
  };

  const recalcularDañoMuestrasActuales = async () => {
    setRecalculando(true);
    
    try {
      const muestrasActualizadas = muestras.map(muestra => {
        // Solo recalcular muestras del tipo fenológico actual y que no estén en lotes
        if (muestra.tipo === fenologicoSeleccionado && !muestra.loteId) {
          const nuevoPorcentajeDaño = calculoDeDaño(
            muestra.datos, 
            muestra.tipo, 
            subFenologicoSeleccionado
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

  const handleCambioFenologico = async (nuevoFenologico) => {
    setFenologicoSeleccionado(nuevoFenologico);
    setMuestrasSeleccionadas(new Set()); // Limpiar selección
    
    // Establecer el subFenológico guardado para este tipo
    const subFenologicoParaEste = subFenologicosPorTipo[nuevoFenologico] || getPrimerSubFenologico(nuevoFenologico);
    
    // Verificar que el subFenológico existe para este tipo
    if (!existeSubFenologico(nuevoFenologico, subFenologicoParaEste)) {
      const primerSub = getPrimerSubFenologico(nuevoFenologico);
      setSubFenologicoSeleccionado(primerSub);
      
      // Actualizar en la persistencia
      const nuevosSubFenologicos = {
        ...subFenologicosPorTipo,
        [nuevoFenologico]: primerSub
      };
      await guardarSubFenologicos(nuevosSubFenologicos);
    } else {
      setSubFenologicoSeleccionado(subFenologicoParaEste);
    }
    
    // Recalcular después de cambiar
    setTimeout(recalcularDañoMuestrasActuales, 100);
  };

  const handleCambioSubFenologico = async (nuevoSubFenologico) => {
    setSubFenologicoSeleccionado(nuevoSubFenologico);
    
    // Guardar la selección para este tipo fenológico
    const nuevosSubFenologicos = {
      ...subFenologicosPorTipo,
      [fenologicoSeleccionado]: nuevoSubFenologico
    };
    await guardarSubFenologicos(nuevosSubFenologicos);
    
    // Recalcular daño de muestras actuales
    setTimeout(recalcularDañoMuestrasActuales, 100);
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
    const muestrasSeleccionadasArray = muestras.filter(m => 
      muestrasSeleccionadas.has(m.id) && 
      m.tipo === fenologicoSeleccionado &&
      !m.loteId
    );
    
    if (muestrasSeleccionadasArray.length === 0) {
      Alert.alert('Error', 'Debe seleccionar al menos una muestra para crear un lote');
      return;
    }

    setCerrarLoteModalVisible(true);
  };

  const handleCerrarLote = async (datosLote) => {
    try {
      const nuevoLote = {
        id: Date.now().toString(),
        nombreLote: datosLote.nombreLote,
        hectareas: datosLote.hectareas,
        dañoReal: datosLote.dañoReal,
        dañoPactado: datosLote.dañoPactado,
        muestrasIds: datosLote.muestrasIds,
        operacionId: operacionId,
        fecha: new Date().toISOString(),
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

  // Filtrar muestras por tipo fenológico seleccionado Y que no estén en lotes
  const muestrasFiltradas = muestras.filter(m => 
    m.tipo === fenologicoSeleccionado && !m.loteId
  );

  // Obtener muestras seleccionadas para el modal
  const muestrasSeleccionadasArray = muestras.filter(m => 
    muestrasSeleccionadas.has(m.id) && 
    m.tipo === fenologicoSeleccionado &&
    !m.loteId
  );

  // Obtener subFenológicos disponibles para el tipo actual
  const subFenologicosDisponibles = getSubFenologicosPorTipo(fenologicoSeleccionado);

  const renderMuestra = ({ item }) => (
    <MuestraItem 
      item={item} 
      isSelected={muestrasSeleccionadas.has(item.id)}
      onPress={() => toggleSeleccionMuestra(item.id)}
      onDelete={() => borrarMuestra(item.id)}
      isInLote={!!item.loteId}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.agrega} onPress={abrirModalSegunTipo}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.lotesBtn}
          onPress={() => navigation.navigate('Lotes', { operacionId, roney_op })}
        >
          <Text style={styles.btnText}>Lotes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.cerrarBtn,
            muestrasSeleccionadas.size === 0 && styles.cerrarBtnDisabled
          ]}
          onPress={abrirCerrarLoteModal}
          disabled={muestrasSeleccionadas.size === 0}
        >
          <Text style={styles.btnText}>Cerrar Lote</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Tipo Fenológico:</Text>
        <Picker
          selectedValue={fenologicoSeleccionado}
          style={styles.picker}
          onValueChange={handleCambioFenologico}
        >
          <Picker.Item label="Tipo 1" value="1" />
          <Picker.Item label="Tipo 2" value="2" />
          <Picker.Item label="Tipo 3" value="3" />
          <Picker.Item label="Tipo 4" value="4" />
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <View style={styles.subPickerHeader}>
          <Text style={styles.pickerLabel}>Sub categoría fenológico:</Text>
          {recalculando && (
            <View style={styles.recalculandoContainer}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.recalculandoText}>Recalculando...</Text>
            </View>
          )}
        </View>
        <Picker
          selectedValue={subFenologicoSeleccionado}
          style={styles.picker}
          onValueChange={handleCambioSubFenologico}
          enabled={!recalculando}
        >
          {subFenologicosDisponibles.map(sub => (
            <Picker.Item key={sub.value} label={sub.label} value={sub.value} />
          ))}
        </Picker>
      </View>

      <FlatList
        data={muestrasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderMuestra}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No hay muestras disponibles del Tipo {fenologicoSeleccionado}
          </Text>
        }
      />

      <ModalesSegunTipo
        tipo={modalTipo}
        visible={!!modalTipo}
        onCerrar={cerrarModal}
        onGuardar={agregarMuestraDesdeModal}
      />

      <CerrarLoteModal
        visible={cerrarLoteModalVisible}
        onClose={() => setCerrarLoteModalVisible(false)}
        onConfirmar={handleCerrarLote}
        muestrasSeleccionadas={muestrasSeleccionadasArray}
      />

      <View style={styles.footer}>
        <View style={styles.muestrasFooter}>
          <Text style={styles.footerText}>
            Disponibles {fenologicoSeleccionado}: {muestrasFiltradas.length}
          </Text>
          <Text style={styles.footerText}>
            Seleccionadas: {muestrasSeleccionadas.size}
          </Text>
        </View>
        {muestrasSeleccionadas.size > 0 && (
          <TouchableOpacity 
            style={styles.limpiarSeleccionBtn}
            onPress={() => setMuestrasSeleccionadas(new Set())}
          >
            <Text style={styles.limpiarSeleccionText}>Limpiar Selección</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Componente para manejar los diferentes modales
function ModalesSegunTipo({ tipo, visible, onCerrar, onGuardar }) {
  if (!visible || !tipo) return null;

  const props = {
    visible: true,
    onClose: onCerrar,
    onGuardar: (d1, d2, d3, d4) => onGuardar(tipo, { dato_1: d1, dato_2: d2, dato_3: d3, dato_4: d4 }),
    valoresIniciales: { dato_1: '', dato_2: '', dato_3: '', dato_4: '' }
  };

  switch (tipo) {
    case '1': return <MuestraTipo1Modal {...props} />;
    case '2': return <MuestraTipo2Modal {...props} />;
    case '3': return <MuestraTipo3Modal {...props} />;
    case '4': return <MuestraTipo4Modal {...props} />;
    default: return null;
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
  cerrarBtnDisabled: {
    backgroundColor: '#ccc',
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
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
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
});