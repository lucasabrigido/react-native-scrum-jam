import React, {useState, useEffect, useMemo, useRef} from 'react';
import {View, FlatList} from 'react-native';
// import Socket from 'socket.io-client';
import { io } from "socket.io-client";
import {
    RTCView,
    RTCPeerConnection,
    RTCIceCandidate,
    mediaDevices,
} from 'react-native-webrtc';
import { v4 as uuid } from 'uuid';

import Participant from './participant';
import WebrtcView from './webrtc-view';

import {styles} from './styles';

// const users = [
//     {name: 'D', active: true},
//     {name: 'L B'},
//     {name: 'L M'},
//     {name: 'D D D'},
//     {name: 'X X X'},
//     {name: 'T G'},
// ]

const config = {
    iceServers: [
        {
            urls: ['stun:stun.l.google.com:19302'],
        },
    ],
};

function handleCreateOfferError(event) {
    console.warn('createOffer() error: ', event);
}

function onCreateSessionDescriptionError(error) {
    console.warn('Failed to create session description: ' + error.toString());
}

async function getLocalStream (setStream, start) {
    const availableDevices = await mediaDevices.enumerateDevices();
    const {deviceId: sourceId} = availableDevices.find(
      device => device.kind === 'videoinput' && device.facing === 'front',
    );

    const streamBuffer = await mediaDevices.getUserMedia({
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
    });
    setStream(streamBuffer);
    start();
    return streamBuffer;
}

const host = true ? 'https://webrtc-google-demo.herokuapp.com' : 'http://localhost:4000';

const mySocket = io(host, {
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: Infinity, 
    transports: ['websocket'],

});

// mySocket.connect();

console.warn("socket", mySocket)

const Room = ({route: { params = {}} = {}}) => {
    // console.warn(props);
    const [socket] = useState(mySocket);
    const [uniqueId] = useState(uuid());
    const [localStream, setLocalStream] = useState(null);
    const [remotesStreams, setRemoteStreams] = useState([]);
    const peerConnections = useRef(new Map());

    useEffect(()=>{
        if(!socket.connected) {
            socket.connect();
        }
        getLocalStream(setLocalStream, maybeStart);
        const room = params.room || 'foo';
        console.warn("room", params.room )
        if (room !== '') {
            socket.emit('create or join', room);
            console.warn('Attempted to create or  join room', room);
        }

        socket.on("connect_error", (err) => {
            console.warn('teste', err)
        });
          
        socket.on('created', function(room) {
            console.warn('Created room ' + room);
        // isInitiator = true;
        });
        
        socket.on('full', function(room) {
            console.warn('Room ' + room + ' is full');
        });
        
        socket.on('join', function (room){
            console.warn('Another peer made a request to join room ' + room);
            console.warn('This peer is the initiator of room ' + room + '!');
            createdOffer();
            // isChannelReady = true;
        });
        
        socket.on('joined', function(room) {
            console.warn('joined: ' + room);
            // isChannelReady = true;
        });

        socket.on('message', function(fullMesage) {
            const {uniqueId: messageId, message} = fullMesage;
            if(!(uniqueId === messageId) && typeof message === 'object') {
                let connectionBuffer = peerConnections.current.get(uniqueId);
                console.warn('Client received message:', message);
                if (message.type === 'offer') {
                    if (!connectionBuffer) {
                        maybeStart();
                    }
                    connectionBuffer = peerConnections.current.get(uniqueId);
                    connectionBuffer.setRemoteDescription(new RTCSessionDescription(message));
                    connectionBuffer.createAnswer().then(
                        setLocalAndSendMessage,
                        onCreateSessionDescriptionError
                    );
                } else if (message.type === 'answer') {
                    connectionBuffer.setRemoteDescription(new RTCSessionDescription(message));
                } else if (message.type === 'candidate') {
                    var candidate = new RTCIceCandidate({
                        sdpMLineIndex: message.label,
                        candidate: message.candidate
                    });
                    connectionBuffer.addIceCandidate(candidate);
                } else if (message.type === 'close') {
                    console.warn('Session terminated.');
                    // isStarted = false;
                    connectionBuffer.close();
                    peerConnections.current.set(uniqueId, null);
                    // isInitiator = false;
                }
            }
        });

        return () => {
            let connectionBuffer = peerConnections.current.get(uniqueId);
            if(connectionBuffer) {
                connectionBuffer.close();
                peerConnections.current.set(uniqueId, null);
                sendMessage({uniqueId, message: {type: 'close'}});
            }
            socket.close();
        }
    },[]);


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

    const maybeStart = () => {
        if(localStream) {
            try {
                const connectionBuffer = new RTCPeerConnection(config);
                connectionBuffer.onicecandidate = handleIceCandidate;
                connectionBuffer.onaddstream = handleRemoteStreamAdded;
                connectionBuffer.onremovestream = handleRemoteStreamRemoved;
                peerConnections.current.set(uniqueId, connectionBuffer);
                console.warn('Created RTCPeerConnnection');
            } catch (e) {
                console.warn('Failed to create PeerConnection, exception: ' + e.message);
                alert('Cannot create RTCPeerConnection object.');
            }
            const connectionBuffer = peerConnections.current.get(uniqueId);
            connectionBuffer.addStream(localStream);
        }
    }

    const createdOffer = () => {
        let connectionBuffer = peerConnections.current.get(uniqueId);
        if(params.isCreated && connectionBuffer) { //se eu que criei a sala
            connectionBuffer.createOffer(setLocalAndSendMessage, handleCreateOfferError);
        }
    }

    function sendMessage(message) {
        console.warn('Client sending message: ', message);
        socket.emit('message', message);
    }

    const setLocalAndSendMessage = (sessionDescription) => {
        const connectionBuffer = peerConnections.current.get(uniqueId);
        connectionBuffer.setLocalDescription(sessionDescription);
        console.warn('setLocalAndSendMessage sending message', sessionDescription);
        sendMessage({message: sessionDescription, uniqueId});
    }
    const handleRemoteStreamAdded = (event) => {
        console.warn('Remote stream added.');
        remoteStream = event.stream;
        setRemoteStreams(state => [...state, remoteStream]); //verificar se já não ta
    }
      
    const handleRemoteStreamRemoved = (event) => {
        console.warn('Remote stream removed. Event: ', event); //remover do array de remotesStreams
    }

    const handleIceCandidate = (event) => {
        console.warn('icecandidate event: ', event);
        if (event.candidate) {
            sendMessage({ uniqueId, message: {
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            }});
        } else {
            console.warn('End of candidates.');
        }
    }

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