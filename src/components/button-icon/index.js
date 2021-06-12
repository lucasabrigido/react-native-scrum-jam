import React from 'react';
import {Image, TouchableOpacity } from 'react-native';

const ButtonIcon = ({icon, onPress = ()=>{}, ...rest}) => {
    return (
        <TouchableOpacity
            // style={{backgroundColor: 'red'}}
            accessibilityLabel='icon'
            onPress={onPress}
        >
            <Image style={{resizeMode: 'contain', ...rest}} source={icon} />
        </TouchableOpacity>
    )
};
export default ButtonIcon;