import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ChatScreen from '../screens/ChatScreen';
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { userToken } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            presentation: 'card',
            animationTypeForReplace: 'push',
            title: 'Log In',
            headerTitleAlign: 'center',
            headerTitleStyle: {
              fontWeight: 'bold',
              color: '#0066CC',
            },
            headerStyle: {
              backgroundColor: 'white',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            }
          }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{
            presentation: 'card',
            animationTypeForReplace: 'push',
            title: 'Create Account',
            headerTitleAlign: 'center',
            headerTitleStyle: {
              fontWeight: 'bold',
              color: '#0066CC',
            },
            headerStyle: {
              backgroundColor: 'white',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            }
          }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            presentation: 'card',
            headerTitleAlign: 'center',
            headerTitleStyle: {
              fontWeight: 'bold',
              color: '#0066CC',
            },
            headerStyle: {
              backgroundColor: 'white',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
            }
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 