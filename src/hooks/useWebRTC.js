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
  const isOfferCreatedRef = useRef(false);

  const [muted, setMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);

  const cleanupPeer = useCallback(() => {
    console.log('[WebRTC] Cleaning up peer');
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    isOfferCreatedRef.current = false;
    setIsRemoteConnected(false);
  }, []);

  const createPeerConnection = useCallback((targetSocketId) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    console.log('[WebRTC] Peer connection created with:', targetSocketId);

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log('[WebRTC] Sending ICE candidate:', candidate);
        socketRef.current.emit('send-ice-candidate', {
          candidate,
          to: targetSocketId,
        });
      }
    };

    peer.ontrack = (event) => {
      console.log('[WebRTC] Track received:', event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsRemoteConnected(true);
      }
    };

    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState;
      console.log('[WebRTC] ICE connection state changed:', state);
      if (['disconnected', 'failed', 'closed'].includes(state)) {
        cleanupPeer();
      }
    };

    return peer;
  }, [cleanupPeer]);

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
      console.error('[WebRTC] Error sharing screen:', err);
    }
  }, [setIsScreenSharing]);

  useEffect(() => {
    const start = async () => {
      try {
        socketRef.current = io(SIGNALING_SERVER_URL, { transports: ['websocket'] });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        console.log('[WebRTC] Local media stream set.');

        socketRef.current.emit('join-room', { roomId });
        console.log('[WebRTC] Emitted join-room');

        socketRef.current.on('user-joined', ({ socketId, shouldCreateOffer }) => {
          console.log('[WebRTC] User joined:', socketId, 'Create offer?', shouldCreateOffer);

          if (peerRef.current) {
            console.log('[WebRTC] Peer already exists. Skipping duplicate setup.');
            return;
          }

          peerRef.current = createPeerConnection(socketId);
          stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));

          if (shouldCreateOffer && !isOfferCreatedRef.current) {
            isOfferCreatedRef.current = true;
            console.log('[WebRTC] Creating offer...');
            peerRef.current.createOffer()
              .then(offer => {
                console.log('[WebRTC] Offer created.');
                return peerRef.current.setLocalDescription(offer);
              })
              .then(() => {
                socketRef.current.emit('send-offer', {
                  offer: peerRef.current.localDescription,
                  to: socketId,
                });
                console.log('[WebRTC] Offer sent.');
              })
              .catch(err => console.error('[WebRTC] Error creating offer:', err));
          }
        });

        socketRef.current.on('receive-offer', async ({ offer, from }) => {
          console.log('[WebRTC] Received offer from:', from);

          if (peerRef.current) {
            console.warn('[WebRTC] Peer already exists. Ignoring new offer.');
            return;
          }

          peerRef.current = createPeerConnection(from);
          stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));

          try {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('[WebRTC] Offer set as remote description.');

            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);
            console.log('[WebRTC] Answer created and set.');

            socketRef.current.emit('send-answer', {
              answer: peerRef.current.localDescription,
              to: from,
            });
            console.log('[WebRTC] Answer sent.');
          } catch (err) {
            console.error('[WebRTC] Error handling received offer:', err);
          }
        });

        socketRef.current.on('receive-answer', async ({ answer }) => {
          console.log('[WebRTC] Received answer.');

          if (peerRef.current) {
            try {
              await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
              console.log('[WebRTC] Answer set as remote description.');
            } catch (err) {
              console.error('[WebRTC] Error setting remote answer:', err);
            }
          }
        });

        socketRef.current.on('receive-ice-candidate', async ({ candidate }) => {
          console.log('[WebRTC] Received ICE candidate:', candidate);
          if (peerRef.current) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('[WebRTC] ICE candidate added.');
            } catch (err) {
              console.error('[WebRTC] Failed to add ICE candidate:', err);
            }
          }
        });

        socketRef.current.on('user-left', () => {
          console.log('[WebRTC] User left. Cleaning up.');
          cleanupPeer();
        });

      } catch (err) {
        console.error('[WebRTC] Setup error:', err);
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