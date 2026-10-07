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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import LoteItem from '../components/LoteItem';
import EditarLoteModal from '../components/modals/EditarLoteModal';
import ComentariosModal from '../components/modals/ComentariosModal';
import { ErrorHandler } from '../utils/ErrorHandler';
import { getUserSession, getDeviceInfo } from '../services/AuthService';
import { MODO_TEST_ENVIO, DEV } from '../utils/modoConfig';

// ✅ Constantes fuera del componente
const LOTE_ITEM_HEIGHT = 200; // Ajusta según tu LoteItem real
const ENDPOINT_RECIBE_LOTE = 'https://fersystest.com/roney/recibelote.php';

// ✅ MODO_TEST_ENVIO vive en src/utils/modoConfig.js (true = libre / false = producción)

const esEnviado = (l) => Boolean(l.enviado) && !MODO_TEST_ENVIO;

export default function LotesScreen({ route, navigation }) {
  const { operacionId, roney_op } = route.params || {};
  const [lotes, setLotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [cultivo, setCultivo] = useState('soja');
  const [campoNombre, setCampoNombre] = useState('');
  const [web, setWeb] = useState('N');
  const [coaseguros, setCoaseguros] = useState('');
  const [lotesSeleccionados, setLotesSeleccionados] = useState(new Set());
  const [comentarios, setComentarios] = useState('');
  const [modalComentariosVisible, setModalComentariosVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // ✅ Modo consulta: producción + al menos un lote enviado de esta operación
  const modoConsulta = useMemo(
    () => !MODO_TEST_ENVIO && lotes.some(l => l && l.enviado),
    [lotes]
  );

  const alertaConsulta = useCallback(() => {
    Alert.alert(
      'Modo consulta',
      'Esta operación ya fue enviada. Solo podés ver los lotes: no se pueden modificar, agregar, eliminar ni enviar.'
    );
  }, []);

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
          setCampoNombre(operacionActual.campo || '');
          setWeb(operacionActual.web || 'N');
          setCoaseguros(operacionActual.coaseguros || '');
          setComentarios(operacionActual.comentarios || '');
        }
      }
    } catch (e) {
      if (isMountedRef.current) {
        console.error('Error cargando datos de operación:', e);
      }
    }
  }, [operacionId]);

  // ✅ Cargar lotes con verificación de montaje y migración de schema
  const cargarLotes = useCallback(async () => {
    try {
      const data = await ErrorHandler.getStorageData(`lotes_${operacionId}`);
      const lotesCargados = ErrorHandler.safeJsonParse(data, []);

      if (!Array.isArray(lotesCargados)) {
        if (isMountedRef.current) setLotes([]);
        return;
      }

      // Migrar lotes con schema viejo o parcialmente corrupto
      const migratedLotes = lotesCargados
        .filter(l => l && l.id && l.nombreLote && Array.isArray(l.muestrasIds))
        .map(l => {
          // Si tiene hasSembradas ya está en el nuevo schema
          if (typeof l.hasSembradas === 'number') return l;
          // Si tiene hectareas (schema viejo) → migrar
          if (typeof l.hectareas === 'number') {
            return { ...l, hasSembradas: l.hectareas, hasDañadas: l.hasDañadas ?? 0 };
          }
          // Schema corrupto: asignar 0 para que no crashee
          return { ...l, hasSembradas: 0, hasDañadas: 0 };
        });

      // Guardar los lotes migrados de vuelta si hubo cambios
      const needsSave = lotesCargados.some(
        (l, i) => migratedLotes[i] && l !== migratedLotes[i]
      );
      if (needsSave) {
        await AsyncStorage.setItem(`lotes_${operacionId}`, JSON.stringify(migratedLotes));
      }

      const lotesOrdenados = [...migratedLotes].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

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
    if (modoConsulta) {
      alertaConsulta();
      return;
    }
    setLoteSeleccionado(lote);
    setModalVisible(true);
  }, [modoConsulta, alertaConsulta]);

  const cerrarModal = useCallback(() => {
    setModalVisible(false);
    setLoteSeleccionado(null);
  }, []);

  // ✅ Abrir modal de comentarios (con el valor guardado)
  const abrirModalComentarios = useCallback(() => {
    setModalComentariosVisible(true);
  }, []);

  // ✅ Cerrar modal de comentarios
  const cerrarModalComentarios = useCallback(() => {
    setModalComentariosVisible(false);
  }, []);

  // ✅ Guardar comentarios en la operación (AsyncStorage)
  const guardarComentarios = useCallback(async (textoGuardado) => {
    const texto = (textoGuardado ?? '').trim();
    try {
      const data = await AsyncStorage.getItem('operaciones');
      const operaciones = ErrorHandler.safeJsonParse(data, []);
      if (Array.isArray(operaciones)) {
        const idx = operaciones.findIndex(op => op && op.id === operacionId);
        if (idx >= 0) {
          operaciones[idx] = { ...operaciones[idx], comentarios: texto };
          await AsyncStorage.setItem('operaciones', JSON.stringify(operaciones));
        }
      }
      setComentarios(texto);
      setModalComentariosVisible(false);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron guardar los comentarios');
    }
  }, [operacionId]);

  const actualizarLote = useCallback(async (loteActualizado) => {
    if (modoConsulta) {
      alertaConsulta();
      return;
    }
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
  }, [lotes, operacionId, cerrarModal, modoConsulta, alertaConsulta]);

  const eliminarLote = useCallback(async (loteId) => {
    if (modoConsulta) {
      alertaConsulta();
      return;
    }
    try {
      const loteAEliminar = lotes.find(l => l.id === loteId);
      if (!loteAEliminar) return;

      // ✅ Los lotes enviados no se pueden eliminar
      if (loteAEliminar.enviado) {
        Alert.alert('Lote Enviado', 'Este lote ya fue enviado al servidor y no puede eliminarse.');
        return;
      }

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
  }, [lotes, operacionId, modoConsulta, alertaConsulta]);

  const liberarMuestra = useCallback(async (loteId, muestraId) => {
    // ✅ Modo consulta: no modificar la composición de los lotes
    if (modoConsulta) {
      alertaConsulta();
      return false;
    }
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
  }, [lotes, operacionId, modoConsulta, alertaConsulta]);

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

  // ✅ Toggle selección de lote (los enviados no se pueden seleccionar)
  const toggleSeleccionLote = useCallback((loteId) => {
    // ✅ Modo consulta: no se selecciona nada (no hay envío posible)
    if (modoConsulta) {
      alertaConsulta();
      return;
    }
    setLotesSeleccionados(prev => {
      const nuevas = new Set(prev);
      if (nuevas.has(loteId)) {
        nuevas.delete(loteId);
      } else {
        nuevas.add(loteId);
      }
      return nuevas;
    });
  }, [modoConsulta, alertaConsulta]);

  // ✅ Convertir fotos (URIs) de un lote a base64
  const convertirFotosABase64 = useCallback(async (muestrasDelLote) => {
    const muestrasConFotos = [];

    for (const muestra of muestrasDelLote) {
      const datos = muestra.datos || {};
      const uris = Array.isArray(datos.fotos) && datos.fotos.length > 0
        ? datos.fotos
        : (datos.fotoUri ? [datos.fotoUri] : []);

      const fotosBase64 = [];
      for (const uri of uris) {
        try {
          if (typeof uri === 'string' && uri.startsWith('data:image')) {
            // Ya es data URI → extraer solo la parte base64
            fotosBase64.push(uri.split(',')[1]);
          } else if (uri) {
            const b64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            fotosBase64.push(b64);
          }
        } catch (e) {
          console.warn('⚠️ No se pudo convertir foto a base64:', uri, e.message);
        }
      }

      muestrasConFotos.push({
        ...muestra,
        datos: {
          ...datos,
          fotos: fotosBase64,
          fotoUri: fotosBase64[0] || null,
        },
      });
    }

    return muestrasConFotos;
  }, []);

  // ✅ Construir el objeto de un lote con sus muestras y fotos en base64
  const construirDatosLote = useCallback(async (lote) => {
    const muestrasData = await ErrorHandler.getStorageData(`muestras_${operacionId}`);
    const todasMuestras = ErrorHandler.safeJsonParse(muestrasData, []);
    const listaMuestras = Array.isArray(todasMuestras) ? todasMuestras : [];

    const muestrasDelLote = listaMuestras.filter(
      m => m && lote.muestrasIds.includes(m.id)
    );

    const muestrasConFotos = await convertirFotosABase64(muestrasDelLote);

    return {
      lote: {
        id: lote.id,
        nombreLote: lote.nombreLote,
        hasSembradas: lote.hasSembradas ?? lote.hectareas ?? 0,
        hasDañadas: lote.hasDañadas ?? 0,
        danReal: lote.dañoReal ?? 0,
        danPactado: lote.dañoFinal ?? lote.dañoReal ?? 0,
        tipoFenologico: lote.tipoFenologico ?? '',
        tipoFenologicoLabel: lote.tipoFenologicoLabel || '',
        conMuestras: lote.conMuestras || '',
        fecha: lote.fecha || '',
      },
      muestras: muestrasConFotos.map(m => ({
        id: m.id,
        nombre: m.nombre || '',
        fecha: m.fecha || '',
        tipo: m.tipo || '',
        datos: m.datos || {},
      })),
    };
  }, [operacionId, convertirFotosABase64]);

  // ✅ Construir el JSON único con TODOS los lotes seleccionados
  const construirJsonEnvio = useCallback(async (seleccionados) => {
    // ✅ Datos del usuario y dispositivo (los mismos del modal "Mi Perfil")
    const sesion = await getUserSession();
    const info = await getDeviceInfo();

    const lotes = [];
    for (const lote of seleccionados) {
      const datosLote = await construirDatosLote(lote);
      lotes.push(datosLote);
    }

    return {
      tipo: 'lotes',
      usuario: {
        nombre: sesion?.nombre || '',
        email: sesion?.email || '',
        iddispositivo: sesion?.iddispositivo || info.iddispositivo || '',
        sistema: sesion?.sistema || info.sistema || '',
      },
      operacion: {
        operacionId,
        roney_op: roney_op || '',
        campo: campoNombre || '',
        asegunom: campoNombre || '',
        cultivo: cultivo || '',
        web: web || 'N',
        coaseguros: coaseguros || '',
        comentarios: comentarios || '',
      },
      lotes,
    };
  }, [operacionId, roney_op, campoNombre, cultivo, web, coaseguros, comentarios, construirDatosLote]);

  // ✅ Marcar los lotes seleccionados como fallidos cuando el envío no llega
  const marcarFalloEnvio = useCallback(async () => {
    const nuevosLotes = lotes.map(l =>
      lotesSeleccionados.has(l.id) && !l.enviado
        ? { ...l, envioFallido: true }
        : l
    );
    await AsyncStorage.setItem(`lotes_${operacionId}`, JSON.stringify(nuevosLotes));
    if (isMountedRef.current) setLotes(nuevosLotes);
  }, [lotes, lotesSeleccionados, operacionId]);

  // ✅ Registrar en forma persistente qué se envió (sin fotos) — lo usa el sync para no re-importar
  const registrarEnvio = useCallback(async (lotesEnviados) => {
    try {
      const clave = (roney_op || '').trim().toLowerCase();
      if (!clave) return;
      const data = await AsyncStorage.getItem('envios_registrados');
      const registros = ErrorHandler.safeJsonParse(data, []);
      const lista = Array.isArray(registros) ? registros : [];
      const idx = lista.findIndex(r => r && String(r.roney_op || '').trim().toLowerCase() === clave);
      const previo = idx >= 0 ? lista[idx] : {};
      const lotesPrevios = Array.isArray(previo.lotes) ? previo.lotes : [];
      const lotesNuevos = lotesPrevios.slice();
      (Array.isArray(lotesEnviados) ? lotesEnviados : []).forEach(l => {
        if (l && !lotesNuevos.some(x => x && x.id === l.id)) {
          lotesNuevos.push({ id: l.id, nombreLote: l.nombreLote || '' });
        }
      });
      const registro = {
        roney_op: roney_op || '',
        operacionId,
        asegunom: campoNombre || '',
        cultivo: cultivo || '',
        fechaEnvio: new Date().toISOString(),
        lotes: lotesNuevos,
      };
      if (idx >= 0) lista[idx] = registro;
      else lista.push(registro);
      await AsyncStorage.setItem('envios_registrados', JSON.stringify(lista));
    } catch (e) {
      console.warn('No se pudo registrar el envío:', e && e.message);
    }
  }, [roney_op, operacionId, campoNombre, cultivo]);

  // ✅ DEV=false: al quedar la operación totalmente enviada, borrar sus datos del dispositivo
  const borrarDatosOperacion = useCallback(async () => {
    try {
      // 1) Recolectar las fotos de las muestras (archivos en documentDirectory)
      const muestrasData = await ErrorHandler.getStorageData(`muestras_${operacionId}`);
      const muestras = ErrorHandler.safeJsonParse(muestrasData, []);
      const uris = [];
      if (Array.isArray(muestras)) {
        muestras.forEach(m => {
          if (!m) return;
          const listas = [m.datos?.fotos, m.fotos];
          listas.forEach(lista => {
            if (Array.isArray(lista)) {
              lista.forEach(u => { if (typeof u === 'string' && u) uris.push(u); });
            }
          });
          const simples = [m.datos?.fotoUri, m.fotoUri];
          simples.forEach(u => { if (typeof u === 'string' && u) uris.push(u); });
        });
      }

      // 2) Borrar los archivos de disco (idempotente por si ya no existen)
      const unicas = [];
      uris.forEach(u => { if (unicas.indexOf(u) === -1) unicas.push(u); });
      await Promise.all(
        unicas.map(u => FileSystem.deleteAsync(u, { idempotent: true }).catch(() => {}))
      );

      // 3) Quitar las claves de la operación
      await AsyncStorage.removeItem(`lotes_${operacionId}`);
      await AsyncStorage.removeItem(`muestras_${operacionId}`);

      // 4) Quitar la operación de la lista general
      const opsData = await AsyncStorage.getItem('operaciones');
      const operaciones = ErrorHandler.safeJsonParse(opsData, []);
      if (Array.isArray(operaciones)) {
        const restantes = operaciones.filter(op => !(op && String(op.id) === String(operacionId)));
        await AsyncStorage.setItem('operaciones', JSON.stringify(restantes));
      }

      // 5) Limpiar el estado local
      if (isMountedRef.current) {
        setLotes([]);
        setLotesSeleccionados(new Set());
      }
      return true;
    } catch (e) {
      console.warn('No se pudieron borrar los datos de la operación:', e && e.message);
      return false;
    }
  }, [operacionId]);

  // ✅ Enviar TODOS los lotes seleccionados en un solo JSON
  const enviarLotes = useCallback(async () => {
    // ✅ Modo consulta: nunca enviar
    if (modoConsulta) {
      alertaConsulta();
      return;
    }
    const seleccionados = lotes.filter(
      l => lotesSeleccionados.has(l.id) && !esEnviado(l)
    );
    if (seleccionados.length === 0) return;

    if (enviando) return;
    setEnviando(true);

    let borradoOk = false;

    try {
      const jsonEnvio = await construirJsonEnvio(seleccionados);

      // ✅ Ver el JSON por consola antes de enviar
      console.log(`📤 JSON a enviar (${seleccionados.length} lote(s)):`, JSON.stringify(jsonEnvio, null, 2));

      const response = await fetch(ENDPOINT_RECIBE_LOTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonEnvio),
      });

      // ✅ Leer la respuesta del servidor
      let resp = null;
      try {
        resp = await response.json();
      } catch (_) {
        resp = null;
      }
      console.log('📥 Respuesta del servidor:', resp || response.status);

      const ok = response.ok && resp && resp.ok === true;

      if (ok) {
        // ✅ Marcar todos los lotes enviados
        const nuevosLotes = lotes.map(l =>
          lotesSeleccionados.has(l.id) && !l.enviado
            ? { ...l, enviado: true, fechaEnvio: new Date().toISOString(), envioFallido: false }
            : l
        );
        await AsyncStorage.setItem(`lotes_${operacionId}`, JSON.stringify(nuevosLotes));
        if (isMountedRef.current) {
          setLotes(nuevosLotes);
          setLotesSeleccionados(new Set());
        }

        await registrarEnvio(seleccionados);

        // ✅ Operación 100% enviada → borrar sus datos del dispositivo (salvo en DEV)
        const todosEnviados = nuevosLotes.every(l => l && l.enviado);
        if (todosEnviados && !DEV) {
          borradoOk = await borrarDatosOperacion();
        }
      } else {
        console.warn(
          '⚠️ Servidor rechazó el envío',
          resp ? (resp.message || resp.error || 'desconocido') : `HTTP ${response.status}`
        );
        try { await marcarFalloEnvio(); } catch (_) {}
      }

      if (isMountedRef.current) {
        if (ok) {
          const mensajeOk = `Se enviaron ${seleccionados.length} lote(s) correctamente.`
            + (borradoOk ? '\n\nLos datos de la operación se borraron del dispositivo.' : '');
          if (navigation.canGoBack()) {
            Alert.alert('✔ Lotes Enviados', mensajeOk, [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } else {
            Alert.alert('✔ Lotes Enviados', mensajeOk);
          }
        } else {
          // ✅ Mostrar el mensaje del servidor si lo envía (ej: cuenta inactiva)
          const mensajeServidor = resp ? (resp.message || resp.error) : null;
          Alert.alert(
            'No se pudieron enviar los lotes',
            mensajeServidor
              ? String(mensajeServidor)
              : 'Revisá la conexión e intentá nuevamente.'
          );
        }
      }
    } catch (err) {
      console.warn('⚠️ Error en el envío:', err.message);
      try { await marcarFalloEnvio(); } catch (_) {}
      if (isMountedRef.current) {
        Alert.alert('Error al enviar', 'No se pudieron enviar los lotes.\n\nRevisá la conexión e intentá nuevamente.');
      }
    } finally {
      if (isMountedRef.current) {
        setEnviando(false);
      }
    }
  }, [lotes, lotesSeleccionados, enviando, construirJsonEnvio, operacionId, modoConsulta, alertaConsulta, marcarFalloEnvio, registrarEnvio, borrarDatosOperacion, navigation]);

  // ✅ Confirmar envío con alerta que enumera los lotes
  const confirmarEnvio = useCallback(() => {
    // ✅ Modo consulta: nunca enviar
    if (modoConsulta) {
      alertaConsulta();
      return;
    }
    const seleccionados = lotes.filter(
      l => lotesSeleccionados.has(l.id) && !esEnviado(l)
    );
    if (seleccionados.length === 0) return;

    const lista = seleccionados
      .map((l, i) => `${i + 1}. ${l.nombreLote}`)
      .join('\n');

    Alert.alert(
      '⚠️ Enviar Lotes',
      `Vas a enviar ${seleccionados.length} lote(s) al servidor:\n\n${lista}\n\n¿Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', style: 'default', onPress: enviarLotes },
      ],
      {cancelable: true }
    );
  }, [lotes, lotesSeleccionados, enviarLotes, modoConsulta, alertaConsulta]);

  // ✅ Memoizar totalHectareas (sembradas/aseg.)
  const totalHasSembradas = useMemo(() => {
    return lotes.reduce((sum, lote) => sum + (lote.hasSembradas ?? lote.hectareas ?? 0), 0);
  }, [lotes]);

  // ✅ Memoizar totalHasDañadas
  const totalHasDañadas = useMemo(() => {
    return lotes.reduce((sum, lote) => sum + (lote.hasDañadas ?? 0), 0);
  }, [lotes]);

  // ✅ Memoizar renderLote
  const renderLote = useCallback(({ item }) => (
    <LoteItem
      lote={item}
      onPress={() => abrirModalEdicion(item)}
      onDelete={eliminarLote}
      isSelected={lotesSeleccionados.has(item.id)}
      onToggleSelect={toggleSeleccionLote}
      enviado={esEnviado(item)}
    />
  ), [abrirModalEdicion, eliminarLote, lotesSeleccionados, toggleSeleccionLote]);

  // ✅ Lotes seleccionados y aún no enviados
  const seleccionadosPendientes = useMemo(() => {
    return lotes.filter(l => lotesSeleccionados.has(l.id) && !esEnviado(l));
  }, [lotes, lotesSeleccionados]);

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
          <Text style={styles.statsFieldName}>{campoNombre || 'Nombre de asegurado'}</Text>
          <Text style={styles.statLine}>
            Total Has. Sembradas/Aseg.: <Text style={styles.statValueInline}>{totalHasSembradas.toFixed(1)} ha</Text>
          </Text>
          <Text style={styles.statLine}>
            Total Has. Dañadas: <Text style={[styles.statValueInline, styles.statValueDamage]}>{totalHasDañadas.toFixed(1)} ha</Text>
          </Text>
          {!modoConsulta && (
            <TouchableOpacity
              style={styles.comentariosBtn}
              onPress={abrirModalComentarios}
              activeOpacity={0.7}
            >
              <Text style={styles.comentariosBtnText}>
                Comentarios{comentarios ? ' ✓' : ''}
              </Text>
            </TouchableOpacity>
          )}
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

      {/* 📤 Botón inferior: Enviar Lotes (oculto en modo consulta) */}
      {!modoConsulta && seleccionadosPendientes.length > 0 && (
        <View style={styles.footerEnviar}>
          <TouchableOpacity
            style={[styles.enviarBtn, enviando && styles.enviarBtnDisabled]}
            onPress={confirmarEnvio}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.enviarBtnText}>
                📤 Enviar Lotes ({seleccionadosPendientes.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

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

      <ComentariosModal
        visible={modalComentariosVisible}
        valor={comentarios}
        onClose={cerrarModalComentarios}
        onGuardar={guardarComentarios}
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
  statsFieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLine: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
    lineHeight: 24,
  },
  statValueInline: {
    fontWeight: 'bold',
    color: '#333',
  },
  statValueDamage: {
    color: '#dc3545',
  },
  comentariosBtn: {
    marginTop: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  comentariosBtnText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
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
  // 📤 Footer enviar lotes
  footerEnviar: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  enviarBtn: {
    backgroundColor: '#17a2b8',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarBtnDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.8,
  },
  enviarBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});