import React, {useState} from 'react';
import {Animated, View, TouchableOpacity, Image, Text, TextInput} from 'react-native';
import {TabView, SceneMap} from 'react-native-tab-view';

import AppLogo from '../../assets/images/SCRUMJAM-BRAND.png';
import { routes } from '../../utils/constants';

import {styles} from './styles';


let tab = {
    routes: [
      { key: 'enter', title: 'Entrar' },
      { key: 'create', title: 'Criar' },
    ]
  }

const Home = ({navigation}) => {
    const [index, setIndex] = useState(0);
    const [room, setRoom] = useState('');
    const [name, setName] = useState('');
    const [size, setSize] = useState(2);

    const RenderTabBar = (props) => {
        const inputRange = props.navigationState.routes.map((x, i) => i);
    
        return (
            <View style={styles.tabBar}>
                {props.navigationState.routes.map((route, i) => {
                    const opacity = props.position.interpolate({
                        inputRange,
                        outputRange: inputRange.map((inputIndex) =>
                            inputIndex === i ? 1 : 0.5
                        ),
                    });
                    return (
                        <TouchableOpacity
                            key={route.title}
                            style={styles.tabItem}
                            onPress={() => setIndex(i)}>
                            <Animated.Text style={{ opacity, color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{route.title}</Animated.Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const pushScreen = () => {
        navigation.navigate(routes.Room, {
            name, size, room, isCreated: index === 1,
        });
    };

    return (
        <View style={styles.Container} >
            <Image style={styles.Logo} source={AppLogo}/>
            <View style={styles.Tab} >
                <TabView
                    navigationState={{...tab, index}}
                    onIndexChange={setIndex}
                    renderTabBar={RenderTabBar}
                    renderScene={SceneMap({
                        enter: MyTest,
                        create: MyTest,
                    })}
                />
                
                <View style={styles.MiniContainer} >
                    <TextInput
                        style={styles.TextEnterInput}
                        placeholder='Sala'
                        value={room}
                        onChangeText={setRoom}
                        placeholderTextColor='#808080'
                    />
                    { index ===1 
                        && <TextInput
                            style={styles.TextEnterInput}
                            placeholder='Tamanho da Sala'
                            keyboardType='decimal-pad'
                            value={size.toString()}
                            maxLength={2}
                            onChangeText={setSize}
                            placeholderTextColor='#808080'
                        />
                    }
                    <TextInput
                        style={styles.TextEnterInput}
                        placeholder='Apelido'
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor='#808080'
                    />
                    <TouchableOpacity
                        style={styles.ButtonEnterInput}
                        accessibilityLabel='botão azul'
                        onPress={pushScreen}
                    >
                        <Text style={styles.ButtonTextEnter} >{index === 0 ? 'Entrar' : 'Criar'}</Text>
                    </TouchableOpacity>

                </View>
                
            </View>
        </View>
    )
};

const MyTest = () => {
    return null;
};

export default Home;