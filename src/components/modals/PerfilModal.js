import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';

export default function PerfilModal({
  visible,
  onClose,
  userSession,
  onLogout,
  onDeleteAccount,
}) {
  if (!visible) return null;

  const handleConfirmDelete = () => {
    Alert.alert(
      '⚠️ ¿Eliminar cuenta?',
      'Esta acción desactivará tu cuenta en el servidor y borrará TODOS los datos guardados en tu celular. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Cuenta',
          style: 'destructive',
          onPress: () => {
            onDeleteAccount();
          },
        },
      ]
    );
  };

  const handleConfirmLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que querés cerrar la sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          onPress: () => {
            onLogout();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBg}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Mi Perfil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>👤</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{userSession?.nombre || 'Usuario'}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userSession?.email || 'Sin email'}</Text>
            </View>

            {userSession?.iddispositivo ? (
              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>ID Dispositivo</Text>
                <Text style={styles.infoValueSmall}>{userSession.iddispositivo}</Text>
              </View>
            ) : null}

            {userSession?.sistema ? (
              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>Sistema Operativo</Text>
                <Text style={styles.infoValue}>{userSession.sistema.toUpperCase()}</Text>
              </View>
            ) : null}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.logoutBtnText}>🚪 Cerrar Sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteBtnText}>🗑️ Borrar mi cuenta</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#08428b',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#eef4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 36,
  },
  infoGroup: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  infoValueSmall: {
    fontSize: 12,
    color: '#555',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionButtons: {
    width: '100%',
    marginTop: 10,
    gap: 12,
  },
  logoutBtn: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#dc3545',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
