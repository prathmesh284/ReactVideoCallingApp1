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

  const createPeerConnection = useCallback((targetSocketId) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketRef.current.emit('send-ice-candidate', {
          candidate,
          to: targetSocketId,
        });
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsRemoteConnected(true);
      }
    };

    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState;
      if (['disconnected', 'failed', 'closed'].includes(state)) {
        cleanupPeer();
      }
    };

    return peer;
  }, []);

  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsRemoteConnected(false);
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
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');

      if (sender) sender.replaceTrack(screenTrack);
      screenVideoRef.current.srcObject = screenStream;
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        const originalTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(originalTrack);
        screenVideoRef.current.srcObject = null;
        setIsScreenSharing(false);
      };
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  }, []);

  useEffect(() => {
    const start = async () => {
      try {
        socketRef.current = io(SIGNALING_SERVER_URL, { transports: ['websocket'] });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        socketRef.current.emit('join-room', { roomId });

        socketRef.current.on('user-joined', ({ socketId, shouldCreateOffer }) => {
          peerRef.current = createPeerConnection(socketId);
          stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));

          if (shouldCreateOffer) {
            peerRef.current.createOffer()
              .then(offer => peerRef.current.setLocalDescription(offer))
              .then(() => {
                socketRef.current.emit('send-offer', {
                  offer: peerRef.current.localDescription,
                  to: socketId,
                });
              });
          }
        });

        socketRef.current.on('receive-offer', async ({ offer, from }) => {
          peerRef.current = createPeerConnection(from);
          stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));

          await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);

          socketRef.current.emit('send-answer', {
            answer: peerRef.current.localDescription,
            to: from,
          });
        });

        socketRef.current.on('receive-answer', async ({ answer }) => {
          if (peerRef.current) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socketRef.current.on('receive-ice-candidate', async ({ candidate }) => {
          if (peerRef.current) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error('Failed to add ICE candidate:', err);
            }
          }
        });

        socketRef.current.on('user-left', () => {
          cleanupPeer();
        });

      } catch (err) {
        console.error('WebRTC setup error:', err);
      }
    };

    start();

    return () => {
      socketRef.current?.disconnect();
      cleanupPeer();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [roomId, createPeerConnection, cleanupPeer]);

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
