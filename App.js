import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';

import Routes from './src/routes';

const App = () => {

  return (
    <SafeAreaView style={styles.App}>
        <Routes/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  App: {
    flexGrow: 1,
    backgroundColor: '#212032',
  }
});

export default App;
