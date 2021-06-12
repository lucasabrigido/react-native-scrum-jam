import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
    Tab: {
        width: '90%',
        height: 340,
        backgroundColor: '#2A2C3F', //#606074
    },
    Logo: {
        width: 300,
        height: 100,
        marginTop: 40,
        marginBottom: 40,
        resizeMode: 'contain',
    },
    Container: {
        flexGrow: 1,
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#212032',
        // height: 700,
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomColor: '#FFF',
        borderBottomWidth: 2,
        height: 50,
    },
    tabItem: {
        flexGrow: 1,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#0082FF',
    },
    MiniContainer: {
        flexGrow: 1,
        height: 240,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    TextEnterInput: {
        borderWidth: 0.5,
        width: '90%',
        borderRadius: 10,
        padding: 10,
        borderColor: '#0082FF',
        backgroundColor: '#fff'
    },
    ButtonEnterInput: {
        width: '90%',
        backgroundColor: '#0082FF',
        padding: 10,
        alignItems: 'center'
    },
    ButtonTextEnter: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    }
});