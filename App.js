import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import OperacionesScreen from './src/screens/OperacionesScreen';
import MuestrasScreen from './src/screens/MuestrasScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Operaciones">
          <Stack.Screen 
            name="Operaciones" 
            component={OperacionesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Muestras" 
            component={MuestrasScreen}
            options={({ route }) => ({ 
              title: route.params?.roney_op || 'Muestras'
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});