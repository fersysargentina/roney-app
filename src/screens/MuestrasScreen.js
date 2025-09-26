import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MuestraItem from '../components/MuestraItem';
import MuestraTipo1Modal from '../components/modals/MuestraTipo1Modal';
import MuestraTipo2Modal from '../components/modals/MuestraTipo2Modal';
import MuestraTipo3Modal from '../components/modals/MuestraTipo3Modal';
import MuestraTipo4Modal from '../components/modals/MuestraTipo4Modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MuestrasScreen({ route, navigation }) {
  const { roney_op, operacionId } = route.params || {};
  const [muestras, setMuestras] = useState([]);
  const [fenologicoSeleccionado, setFenologicoSeleccionado] = useState('1');
  const [modalTipo, setModalTipo] = useState(null);
  const [muestrasSeleccionadas, setMuestrasSeleccionadas] = useState(new Set());

  useEffect(() => {
    if (!roney_op || !operacionId) {
      Alert.alert('Error', 'No se recibieron los datos de la operación');
      navigation.goBack();
      return;
    }
    cargarMuestras();
  }, [operacionId, roney_op]);

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
    const muestrasDelTipo = muestras.filter(m => m.tipo === tipo);
    const nuevaMuestra = {
      id: Date.now().toString(),
      tipo,
      datos,
      nombre: `Muestra Tipo ${tipo} - ${muestrasDelTipo.length + 1}`,
      fecha: new Date().toLocaleDateString(),
      operacionId: operacionId,
    };
    const nuevasMuestras = [...muestras, nuevaMuestra];
    guardarMuestras(nuevasMuestras);
    cerrarModal();
  };

  const borrarMuestra = (id) => {
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
            // Remover de seleccionadas si estaba seleccionada
            const nuevasSeleccionadas = new Set(muestrasSeleccionadas);
            nuevasSeleccionadas.delete(id);
            setMuestrasSeleccionadas(nuevasSeleccionadas);
          }
        }
      ]
    );
  };

  const toggleSeleccionMuestra = (id) => {
    const nuevasSeleccionadas = new Set(muestrasSeleccionadas);
    if (nuevasSeleccionadas.has(id)) {
      nuevasSeleccionadas.delete(id);
    } else {
      nuevasSeleccionadas.add(id);
    }
    setMuestrasSeleccionadas(nuevasSeleccionadas);
  };

  const cerrarLote = () => {
    const muestrasSeleccionadasArray = muestras.filter(m => 
      muestrasSeleccionadas.has(m.id) && m.tipo === fenologicoSeleccionado
    );
    
    Alert.alert(
      'Cerrar Lote', 
      `¿Seguro que deseas cerrar el lote con ${muestrasSeleccionadasArray.length} muestras seleccionadas?`, 
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Lote', 
          style: 'destructive', 
          onPress: () => {
            // Aquí implementarás la lógica para cerrar el lote
            console.log('Lote cerrado con muestras:', muestrasSeleccionadasArray);
            // Por ejemplo, podrías marcar las muestras como "cerradas" o moverlas a otro estado
            // También podrías navegar a otra pantalla o mostrar un resumen
            setMuestrasSeleccionadas(new Set()); // Limpiar selección
          } 
        }
      ]
    );
  };

  // Filtrar muestras por tipo fenológico seleccionado
  const muestrasFiltradas = muestras.filter(m => m.tipo === fenologicoSeleccionado);

  const renderMuestra = ({ item }) => (
    <MuestraItem 
      item={item} 
      isSelected={muestrasSeleccionadas.has(item.id)}
      onPress={() => toggleSeleccionMuestra(item.id)}
      onDelete={() => borrarMuestra(item.id)}
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
          onPress={() => navigation.navigate('Lotes')}
        >
          <Text style={styles.btnText}>Lotes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cerrarBtn}
          onPress={cerrarLote}
        >
          <Text style={styles.btnText}>Cerrar Lote</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Tipo Fenológico:</Text>
        <Picker
          selectedValue={fenologicoSeleccionado}
          style={styles.picker}
          onValueChange={(itemValue) => {
            setFenologicoSeleccionado(itemValue);
            setMuestrasSeleccionadas(new Set()); // Limpiar selección al cambiar tipo
          }}
        >
          <Picker.Item label="Tipo 1" value="1" />
          <Picker.Item label="Tipo 2" value="2" />
          <Picker.Item label="Tipo 3" value="3" />
          <Picker.Item label="Tipo 4" value="4" />
        </Picker>
      </View>

      <FlatList
        data={muestrasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderMuestra}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No hay muestras del Tipo {fenologicoSeleccionado}
          </Text>
        }
      />

      <ModalesSegunTipo
        tipo={modalTipo}
        visible={!!modalTipo}
        onCerrar={cerrarModal}
        onGuardar={agregarMuestraDesdeModal}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Muestras Tipo {fenologicoSeleccionado}: {muestrasFiltradas.length}
        </Text>
        <Text style={styles.footerText}>
          Seleccionadas: {muestrasSeleccionadas.size}
        </Text>
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
    valoresIniciales: { dato_1: '', dato_2: '', dato_3: '', dato_4: '' } // Siempre valores vacíos para nueva muestra
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
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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