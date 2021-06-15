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
    const [initsPeerConnections, setInitPeerConnection] = useState([]);
    const [initsPeerConnectionsOffer, setInitPeerConnectionOffer] = useState([]);
    const [initsPeerConnectionsCandidate, setInitPeerConnectionCandidate] = useState([]);

    useEffect(()=> {
        getLocalStream(initSocket);
        // initSocket();

        return () => {
            sendMessage({uniqueId, message: {type: 'close'}});
            disconnect();
        }
    }, []);

    useEffect(()=>{
        if(localStream) {
            for (const peer of initsPeerConnections) {
                let pc = peerConnections.current.get(peer);
                if(!pc) {
                    console.warn('create offer')
                    initPeerConnection({id: peer, callback: () => createOffer(peer)});
                    // createOffer(peer);
                }
            }
        }
    },[localStream, initsPeerConnections]);

    useEffect(()=>{
        if(localStream) {
            for (const peer of initsPeerConnectionsOffer) {
                let pc = peerConnections.current.get(peer.id);
                if(!pc) {
                    console.warn('recebi offer')
                    initPeerConnection({id: peer.id, callback: () => messageOffer(peer.message, peer.id)});
                } else {
                    messageOffer(peer.message, peer.id);
                }
            }
        }
    },[localStream, initsPeerConnectionsOffer])

    useEffect(()=>{
        if(localStream) {
            for (const peer of initsPeerConnectionsOffer) {
                let pc = peerConnections.current.get(peer.id);
                if(!pc) {
                    console.warn('recebi candidate')
                    initPeerConnection({id: peer.id, callback: () => messageCandidate(peer.message, peer.id)});
                    // messageOffer(peer.message, peer.id);
                } else {
                    messageCandidate(peer.message, peer.id);
                }
            }
        }
    },[localStream, initsPeerConnectionsCandidate])

    const getLocalStream = (callback) => {
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
                console.warn('teste')
                callback && callback();
            });
        });
    };

    const initSocket = () => {
        if(!socket.connected) {
            socket.connect();
        }
        const room = params.room || 'foo';
        if (room !== '') {
            socket.emit('create or join', {room, uniqueId});
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
        
        socket.on('join', function({room, uniqueId: id}) {
            console.warn("join");
            // initPeerConnection({id});
            setInitPeerConnection(state => [...state, id]);
            // createOffer(id);
        });
        
        socket.on('joined', function(room) {
            console.warn('joined: ' + room);
        });

        socket.on('message', function(fullMesage) {
            const {uniqueId: messageId, message, received_by} = fullMesage;
            if(messageId !== uniqueId) {
                switch(message.type) {
                    case messageTypes.offer:
                        if(!peerConnections.current.get(messageId)){
                            console.warn('vou criar outra connexão', !peerConnections.current.get(messageId))
                            // initPeerConnection({id: messageId});
                            setInitPeerConnectionOffer(state => [{ id: messageId, message }]);
                        } else {
                            messageOffer(message, messageId);
                        }
                        break;
                    case messageTypes.answer:
                        if(uniqueId === received_by) {
                            messageAnswer(message, messageId);
                        }
                        break;
                    case messageTypes.candidate:
                        if(uniqueId === received_by) {
                            if(!peerConnections.current.get(messageId)) {
                                setInitPeerConnectionCandidate(state => [{ id: messageId, message }]);
                            } else {
                                messageCandidate(message, messageId);
                            }
                        }
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
        if(messageId) {
            let connectionBuffer = peerConnections.current.get(messageId);
            if(connectionBuffer) {
                const [remoteStream] = connectionBuffer.getRemoteStreams();
                const id = remoteStream.id;
                setRemoteStreams(state => state.filter(e => e.id !== id));
                connectionBuffer.close();
                peerConnections.current.delete(messageId);
            }
        }
        if(socket.connected && !messageId){
            socket.close();
        }
    }

    const checkPeerConnection = () => {
        let connectionBuffer = peerConnections.current.get(uniqueId);
        console.warn('Boolean(connectionBuffer);', Boolean(connectionBuffer));
        return Boolean(connectionBuffer);
    }

    const initPeerConnection = ({id, callback}) => {
        const connectionBuffer = new RTCPeerConnection(config);
        connectionBuffer.addStream(localStream);
        connectionBuffer.onicecandidate = (event) => {
            if (event.candidate) {
                sendMessage({
                    uniqueId,
                    received_by: id,
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
        peerConnections.current.set(id, connectionBuffer);
        console.warn('Created RTCPeerConnnection');
        callback && callback()
    }

    const messageCandidate = (message, id) => {
        peerConnections.current
            .get(id)
            .addIceCandidate(message.candidate)
            .then(e => console.warn(e));
    }

    const messageAnswer = (message, id) => {
        peerConnections.current
            .get(id)
            .setRemoteDescription(new RTCSessionDescription(message));
    }

    const messageOffer = (message, id) => {
        const pc = peerConnections.current.get(id);
        pc.setRemoteDescription(new RTCSessionDescription(message))
            .then(()=> createAnswer(id))
            .then((e) => setDescription(e, id))
            .then(() => sendDescription(id))
            .catch(handleError);
    }

    const createAnswer = (id) => {
        const pc = peerConnections.current.get(id);
        return pc.createAnswer();
    }

    const setDescription = (offer, id) => {
        const pc = peerConnections.current.get(id);
        return pc.setLocalDescription(offer);
    }

    const sendDescription = (id) => {
        const pc = peerConnections.current.get(id);
        sendMessage({ uniqueId, received_by: id, message: pc.localDescription});
    }

    const createOffer = (id) => {
        const pc = peerConnections.current.get(id);
        pc.createOffer()
            .then((e)=>setDescription(e, id))
            .then((e)=> sendDescription(id))
            .catch(handleError);
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