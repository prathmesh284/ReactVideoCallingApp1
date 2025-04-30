import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SIGNALING_SERVER_URL = 'https://reactvideocallingapp1-backend-production.up.railway.app';
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function useWebRTC(roomId) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenVideoRef = useRef(null);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [muted, setMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);

  const hasJoinedRoom = useRef(false);

  const initializePeer = useCallback((targetSocketId) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = (event) => {
      if (event.candidate && targetSocketId) {
        socketRef.current.emit('send-ice-candidate', {
          candidate: event.candidate,
          to: targetSocketId,
        });
      }
    };

    peer.ontrack = (event) => {
      console.log('🎥 ontrack:', event.streams);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsRemoteConnected(true);
      }
    };

    peer.oniceconnectionstatechange = () => {
      if (['disconnected', 'failed'].includes(peer.iceConnectionState)) {
        peer.close();
        peerRef.current = null;
        setIsRemoteConnected(false);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
      }
    };

    return peer;
  }, []);

  const toggleAudio = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  }, []);

  const shareScreen = useCallback(async () => {
    if (!peerRef.current) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');

      if (sender) {
        sender.replaceTrack(screenTrack);
      }

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      screenTrack.onended = () => {
        const originalTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(originalTrack);
        }
        if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
        setIsScreenSharing(false);
      };
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  }, []);

  useEffect(() => {
    const remoteVideo = remoteVideoRef.current;
    const screenVideo = screenVideoRef.current;

    const start = async () => {
      try {
        socketRef.current = io(SIGNALING_SERVER_URL, {
          transports: ['websocket'],
        });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (!hasJoinedRoom.current) {
          console.log("📡 Emitted join-room for:", roomId);
          socketRef.current.emit('join-room', { roomId });
          hasJoinedRoom.current = true;
        }

        const handleUserJoined = (socketId) => {
          console.log("✅ Another user joined:", socketId);
          if (!peerRef.current) {
            peerRef.current = initializePeer(socketId);
            localStreamRef.current.getTracks().forEach(track => peerRef.current.addTrack(track, localStreamRef.current));
        
            // This user creates the offer (always the second to join)
            peerRef.current.createOffer()
              .then(offer => peerRef.current.setLocalDescription(offer))
              .then(() => {
                socketRef.current.emit('send-offer', {
                  offer: peerRef.current.localDescription,
                  to: socketId,
                });
              });
          }
        };        

        const handleReceiveOffer = async ({ offer, from }) => {
          console.log("📨 Received offer from", from);
          peerRef.current = initializePeer(from);
          stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));

          await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);

          socketRef.current.emit('send-answer', {
            answer: peerRef.current.localDescription,
            to: from,
          });
        };

        const handleReceiveAnswer = async ({ answer }) => {
          console.log("📨 Received answer");
          if (peerRef.current) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          }
        };

        const handleReceiveIceCandidate = async ({ candidate }) => {
          console.log("🧊 Received ICE candidate");
          if (peerRef.current && candidate) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error('Error adding ICE candidate:', err);
            }
          }
        };

        const handleUserLeft = () => {
          console.log("🏃‍♂️ User left");
          if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
          }
          setIsRemoteConnected(false);
          if (remoteVideo) remoteVideo.srcObject = null;
          if (screenVideo) screenVideo.srcObject = null;
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
          }
        };

        socketRef.current.on('user-joined', handleUserJoined);
        socketRef.current.on('receive-offer', handleReceiveOffer);
        socketRef.current.on('receive-answer', handleReceiveAnswer);
        socketRef.current.on('receive-ice-candidate', handleReceiveIceCandidate);
        socketRef.current.on('user-left', handleUserLeft);

      } catch (err) {
        console.error('WebRTC init failed:', err);
      }
    };

    start();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }

      if (remoteVideo) remoteVideo.srcObject = null;
      if (screenVideo) screenVideo.srcObject = null;
    };
  }, [roomId, initializePeer]);

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
