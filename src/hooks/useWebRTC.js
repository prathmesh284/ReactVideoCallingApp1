import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // your signaling server

export default function useWebRTC(roomId) {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const screenVideoRef = useRef();

  const [muted, setMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);

  const peerRef = useRef();
  const localStreamRef = useRef();
  const screenStreamRef = useRef();

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit('join', roomId);

      socket.on('ready', handleReady);
      socket.on('offer', handleOffer);
      socket.on('answer', handleAnswer);
      socket.on('ice-candidate', handleNewICECandidate);
      socket.on('leave', handleRemoteLeave);
      socket.on('screen-sharing', handleScreenSharing);
    };

    const handleReady = async () => {
      createPeer(true);
      addLocalTracks();
    };

    const handleOffer = async (offer) => {
      createPeer(false);
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit('answer', { answer, roomId });
    };

    const handleAnswer = async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleNewICECandidate = async ({ candidate }) => {
      try {
        if (peerRef.current) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding received ice candidate', err);
      }
    };

    const handleRemoteLeave = () => {
      cleanupPeer();
    };

    const handleScreenSharing = (screenStream) => {
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
      }
    };

    const createPeer = (initiator) => {
      peerRef.current = new RTCPeerConnection();

      peerRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { candidate: e.candidate, roomId });
        }
      };

      peerRef.current.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
          setIsRemoteConnected(true);
        }
      };

      peerRef.current.oniceconnectionstatechange = () => {
        console.log('ICE state:', peerRef.current.iceConnectionState);
        if (peerRef.current.iceConnectionState === 'disconnected' || peerRef.current.iceConnectionState === 'failed') {
          cleanupPeer();
        }
      };

      if (initiator) {
        peerRef.current.onnegotiationneeded = async () => {
          const offer = await peerRef.current.createOffer();
          await peerRef.current.setLocalDescription(offer);
          socket.emit('offer', { offer, roomId });
        };
      }
    };

    const addLocalTracks = () => {
      localStreamRef.current?.getTracks().forEach(track => {
        peerRef.current.addTrack(track, localStreamRef.current);
      });
    };

    const cleanupPeer = () => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      setIsRemoteConnected(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    init();

    return () => {
      cleanupPeer();
      socket.disconnect();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [roomId]);

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
  
      const videoTrack = screenStream.getVideoTracks()[0];
      if (peerRef.current) {
        const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      } else {
        console.error('peerRef.current is not defined');
      }
  
      socket.emit('screen-sharing', screenStream, roomId);
  
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);
  
      videoTrack.onended = async () => {
        const originalTrack = localStreamRef.current.getVideoTracks()[0];
        if (peerRef.current) {
          const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(originalTrack);
          }
        }
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = null;
        }
        setIsScreenSharing(false);
      };
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };  

  return {
    localVideoRef,
    remoteVideoRef,
    screenVideoRef,
    toggleAudio,
    shareScreen,
    muted,
    isScreenSharing,
    isRemoteConnected,
  };
}
