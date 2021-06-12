import React from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback } from 'react-native';

import IconButton from '../../../components/button-icon';
import IconMute from '../../../assets/images/mute.png';
import IconSound from '../../../assets/images/sound.png';

const ParticipantInfo = ({ping, mute, name, role, onPress}) => {
    return (
        <TouchableWithoutFeedback onPress={onPress}>
            <View style={styles.Container}>
                <Text style={styles.text}>Ping: <Text style={{color: 'green'}} >{ping}</Text></Text>
                <Text style={styles.text}>Nome: <Text style={styles.textSecundary} >{name}</Text></Text>
                <Text style={styles.text}>Role: <Text style={styles.textSecundary} >{role}</Text></Text>
                <View style={styles.TextIcon} >
                    <Text style={styles.text}>Mutar:</Text>
                    <IconButton onPress={console.warm} marginLeft={10} width={20} height={20} icon={ mute ? IconMute: IconSound} />
                </View>
            </View>
        </TouchableWithoutFeedback>
    )
};

const styles = StyleSheet.create({
    Container: {
        width: '100%',
        flexGrow: 1,
        padding: 10,
    },
    text: {
        fontSize: 18,
        color: '#000',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        textAlign: 'left',
        fontWeight: 'bold',
    },
    textSecundary: {
        fontSize: 18,
        fontWeight: 'normal',
    },
    TextIcon: {
        flexGrow: 1,
        flexDirection: 'row',
    },
});

export default ParticipantInfo;