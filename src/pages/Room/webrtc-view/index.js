import React from 'react';
import {StyleSheet} from 'react-native';
import {RTCView} from 'react-native-webrtc';

const styles = StyleSheet.create({
    viewer: {
      flex: 1,
      width: 160,
      height: 210,
      margin: 18,
      borderWidth: 2,
      backgroundColor: '#2A2C3F',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

const WebrtcView = ({stream}) => {
    return <RTCView streamURL={stream?.toURL()} style={styles.viewer} />;
};

export default WebrtcView;