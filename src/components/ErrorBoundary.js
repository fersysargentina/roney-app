import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { CrashHandler } from '../utils/CrashHandler';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 ErrorBoundary ha capturado un error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Registrar el crash en el sistema de almacenamiento
    CrashHandler.logCrash(error, true).catch(err => {
      console.error('Error registrando crash en ErrorBoundary:', err);
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>¡Ups! Ocurrió un error inesperado</Text>
            <Text style={styles.subtitle}>
              La aplicación ha evitado un cierre fortuito. Tus datos guardados están a salvo.
            </Text>

            <ScrollView style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error && this.state.error.toString()}
              </Text>
              {this.state.errorInfo?.componentStack && (
                <Text style={styles.stackText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.button} 
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>🔄 Recargar Pantalla</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorBox: {
    maxHeight: 160,
    width: '100%',
    backgroundColor: '#fff0f0',
    borderColor: '#ffcdd2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  stackText: {
    color: '#666',
    fontSize: 11,
    marginTop: 6,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    elevation: 2,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ErrorBoundary;
