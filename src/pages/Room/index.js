import React, {useState, useEffect, useMemo, useRef} from 'react';
import {View, FlatList} from 'react-native';
// import Socket from 'socket.io-client';
import { io } from "socket.io-client";
import {
    RTCPeerConnection,
    mediaDevices,
    RTCSessionDescription,
} from 'react-native-webrtc';
import { v4 as uuid } from 'uuid';

import Participant from './participant';
import WebrtcView from './webrtc-view';

import {styles} from './styles';

const config = {
    iceServers: [
        {
            urls: ['stun:stun.l.google.com:19302'],
        },
    ],
};


const host = true ? 'https://webrtc-google-demo.herokuapp.com' : 'http://localhost:4000';

const mySocket = io(host, {
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: Infinity, 
    transports: ['websocket'],

});

const messageTypes = {
    offer: 'offer',
    answer: 'answer',
    candidate: 'candidate',
    close: 'close',
};

const handleError = (e) => {
    console.warn(e);
}

const Room = ({route: { params = {}} = {}}) => {
    const [socket] = useState(mySocket);
    const [uniqueId] = useState(uuid());
    const [localStream, setLocalStream] = useState(null);
    const [remotesStreams, setRemoteStreams] = useState([]);
    const peerConnections = useRef(new Map());
    const [isInitPeerConnection, setInitPeerConnection] = useState(false);

    useEffect(()=> {
        getLocalStream();
        initSocket();

        return () => {
            sendMessage({uniqueId, message: {type: 'close'}});
            disconnect();
        }
    }, []);

    useEffect(()=>{
        if(localStream && !isInitPeerConnection) {
            initPeerConnection();
            setInitPeerConnection(true);
        }
    },[localStream])

    const getLocalStream = () => {
        mediaDevices.enumerateDevices().then(availableDevices => {
            const {deviceId: sourceId} = availableDevices.find(
              device => device.kind === 'videoinput' && device.facing === 'front',
            );
            mediaDevices.getUserMedia({
              audio: true,
              video: {
                mandatory: {
                  minWidth: 500,
                  minHeight: 300,
                  minFrameRate: 30,
                },
                facingMode: 'user',
                optional: [{sourceId}],
              },
            }).then(streamBuffer => {
                setLocalStream(streamBuffer);
            });
        });
    };

    const initSocket = () => {
        if(!socket.connected) {
            socket.connect();
        }
        const room = params.room || 'foo';
        if (room !== '') {
            socket.emit('create or join', room);
            console.warn('Attempted to create or  join room', room);
        }

        socket.on("connect_error", (err) => {
            console.warn('teste', err)
        });
          
        socket.on('created', function(room) {
            console.warn('Created room ' + room);
        });
        
        socket.on('full', function(room) {
            console.warn('Room ' + room + ' is full');
        });
        
        socket.on('join', function(room) {
            console.warn("join");
            createOffer();
        });
        
        socket.on('joined', function(room) {
            console.warn('joined: ' + room);
        });

        socket.on('message', function(fullMesage) {
            const {uniqueId: messageId, message} = fullMesage;
            if(messageId !== uniqueId) {
                switch(message.type) {
                    case messageTypes.offer:
                        messageOffer(message);
                        break;
                    case messageTypes.answer:
                        messageAnswer(message);
                        break;
                    case messageTypes.candidate:
                        messageCandidate(message);
                        break;
                    case messageTypes.close:
                        console.warn('close');
                        disconnect(messageId);
                        break;
                    default:
                        console.warn('messagem desconhecida', message.type);
                }
            }
        });
    }

    const disconnect = (messageId = null) => {
        let connectionBuffer = peerConnections.current.get(uniqueId);
        if(connectionBuffer && messageId) {
            const [remoteStream] = connectionBuffer.getRemoteStreams();
            const id = remoteStream.id;
            setRemoteStreams(state => state.filter(e => e.id !== id));
        }
        connectionBuffer.close();
        peerConnections.current.delete(uniqueId);
        if(socket.connected && !messageId){
            socket.close();
        }
    }

    const checkPeerConnection = () => {
        let connectionBuffer = peerConnections.current.get(uniqueId);
        console.warn('Boolean(connectionBuffer);', Boolean(connectionBuffer));
        return Boolean(connectionBuffer);
    }

    const initPeerConnection = (callback) => {
        const connectionBuffer = new RTCPeerConnection(config);
        connectionBuffer.addStream(localStream);
        connectionBuffer.onicecandidate = (event) => {
            if (event.candidate) {
                sendMessage({
                    uniqueId,
                    message: {
                        type: messageTypes.candidate,
                        candidate: event.candidate,
                    }
                });
            }
        };
        connectionBuffer.onaddstream = (event) => {
            setRemoteStreams(state => [...state, event.stream]);
        };
        connectionBuffer.onremovestream = (event) => {
            const id = event.stream.id;
            setRemoteStreams(state => state.filter(e => e.id !== id));
        };
        peerConnections.current.set(uniqueId, connectionBuffer);
        console.warn('Created RTCPeerConnnection');
        callback && callback()
    }

    const messageCandidate = (message) => {
        peerConnections.current
            .get(uniqueId)
            .addIceCandidate(message.candidate)
            .then(e => console.warn(e));
    }

    const messageAnswer = (message) => {
        peerConnections.current
            .get(uniqueId)
            .setRemoteDescription(new RTCSessionDescription(message));
    }

    const messageOffer = (message) => {
        const pc = peerConnections.current.get(uniqueId);
        pc.setRemoteDescription(new RTCSessionDescription(message))
            .then(createAnswer)
            .then(setDescription)
            .then(sendDescription)
            .catch(handleError);
    }

    const createAnswer = () => {
        const pc = peerConnections.current.get(uniqueId);
        return pc.createAnswer();
    }

    const setDescription = (offer) => {
        const pc = peerConnections.current.get(uniqueId);
        return pc.setLocalDescription(offer);
    }

    const sendDescription = () => {
        const pc = peerConnections.current.get(uniqueId);
        sendMessage({ uniqueId, message: pc.localDescription});
    }

    const createOffer = () => {
        if(params.isCreated) {
            const pc = peerConnections.current.get(uniqueId);
            pc.createOffer()
                .then(setDescription)
                .then(sendDescription)
                .catch(handleError);
        }
    }

    const sendMessage = (message) => {
        console.warn('Client sending message: ', message);
        socket.emit('message', message);
    }

    const users = useMemo(()=> {
        return [
            {name: 'L A B', active: true, stream: localStream},
            ...remotesStreams.map(e => ({name: 'd', stream: e})),
            {name: 'L B'},
            {name: 'L M'},
            {name: 'D D D'},
            {name: 'X X X'},
            {name: 'T G'},
        ];
    },[localStream, remotesStreams]);

    const renderItems = ({item}) => {
        if(item.stream) {
            return <WebrtcView {...item}/>
        }
        return <Participant {...item}/>
    }

    return (
        <View style={styles.Container} >
            <FlatList
                data={users}
                numColumns={2}
                keyExtractor={(item)=> item.name}
                renderItem={renderItems}
            />
        </View>
    );
};

export default Room;