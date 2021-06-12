import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { routes } from '../utils/constants';

import MyRouter from './router';
import HomeScreen from '../pages/Home';
import RoomScren from '../pages/Room';


const Stack = createStackNavigator();

function Routes() {

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name={routes.Home} children={(props) => <MyRouter {...props} component={HomeScreen} />} />
                <Stack.Screen name={routes.Room} children={(props) => <MyRouter noScroll {...props} component={RoomScren} />} />
            </Stack.Navigator>
        </NavigationContainer>
    );
  }
  
export default Routes;