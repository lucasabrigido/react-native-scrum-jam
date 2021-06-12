import React from 'react';
import {KeyboardAvoidingView} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';


const Router = ({component, noScroll, ...props}) => {
    const Component = component;
    const Keyboard = noScroll ? KeyboardAvoidingView : KeyboardAwareScrollView;
    return (
        <Keyboard style={{backgroundColor: '#212032'}} >
            <Component {...props}/>
        </Keyboard>
    )
};

export default Router;