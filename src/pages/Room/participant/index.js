import React, { useState } from 'react';
import {View, Dimensions, TouchableHighlight, Text, StyleSheet} from 'react-native';
import ParticipantInfo from '../participant-info';

// import styles from './styles';

const formatName = (name) => {
    const spliteed = name.split(' ');
    return spliteed.map(e => e[0].toUpperCase()).join('');
}

const ParticipantStyles = StyleSheet.create({
    circleText: {
        fontSize: 18,
        color: '#000',
        fontWeight: 'bold',
    }
});

const initialInfo = {
    ping: '90ms',
    mute: false,
    name: 'Nome',
    role: 'Master',
}

const Participant = ({name, active = false}) => {
    const [info, setInfo] = useState(initialInfo);
    const [isOpen, setIsOpen] = useState(false);

    const changeIsOpen = () => {
        setIsOpen(state => !state);
    }
    return (
        <View style={{
            width: 160,
            height: 210,
            margin: 18,
            borderColor:  active ? 'green' :  isOpen ? '#000' :'transparent',
            borderWidth: 2,
            backgroundColor: '#2A2C3F',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            { !isOpen ? (
                <TouchableHighlight
                    style={{
                        borderRadius: Math.round(Dimensions.get('window').width + Dimensions.get('window').height) / 2,
                        width: Dimensions.get('window').width * 0.3,
                        height: Dimensions.get('window').width * 0.3,
                        backgroundColor: '#0082FF',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    underlayColor='#ccc'
                    onPress={changeIsOpen}
                >
                    <Text style={ParticipantStyles.circleText} >{formatName(name)}</Text>
                </TouchableHighlight>
                ): (
                    <ParticipantInfo onPress={changeIsOpen} {...info}/>
                )
            }
        </View>
    )
};

export default Participant;