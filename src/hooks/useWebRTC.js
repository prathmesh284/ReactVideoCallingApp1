// import { useEffect, useRef, useState } from 'react';
// import io from 'socket.io-client';

// const SIGNALING_SERVER_URL = 'http://localhost:5000';
// const ICE_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// export default function useWebRTC(roomId) {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const socketRef = useRef();
//   const pcRef = useRef();
//   const localStreamRef = useRef();
//   const [muted, setMuted] = useState(false);
//   const screenVideoRef = useRef(null);

//   useEffect(() => {
//     socketRef.current = io(SIGNALING_SERVER_URL);
//     pcRef.current = new RTCPeerConnection(ICE_CONFIG);

//     const setupMedia = async () => {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }      
//       localStreamRef.current = stream;
//       stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));
//       socketRef.current.emit('join', roomId);
//     };

//     setupMedia();

//     socketRef.current.on('user-joined', async () => {
//       const offer = await pcRef.current.createOffer();
//       await pcRef.current.setLocalDescription(offer);
//       socketRef.current.emit('offer', { offer, room: roomId });
//     });

//     socketRef.current.on('offer', async ({ offer }) => {
//       await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
//       const answer = await pcRef.current.createAnswer();
//       await pcRef.current.setLocalDescription(answer);
//       socketRef.current.emit('answer', { answer, room: roomId });
//     });

//     socketRef.current.on('answer', async ({ answer }) => {
//       await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
//     });

//     pcRef.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         socketRef.current.emit('ice-candidate', { candidate: event.candidate, room: roomId });
//       }
//     };

//     socketRef.current.on('ice-candidate', ({ candidate }) => {
//       pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
//     });

//     pcRef.current.ontrack = (event) => {
//       remoteVideoRef.current.srcObject = event.streams[0];
//     };

//     return () => {
//       socketRef.current.disconnect();
//       pcRef.current.close();
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach(track => track.stop());
//       }      
//     };
//   }, [roomId]);

//   const toggleAudio = () => {
//     const audioTrack = localStreamRef.current.getAudioTracks()[0];
//     if (audioTrack) {
//       audioTrack.enabled = !audioTrack.enabled;
//       setMuted(!audioTrack.enabled);
//     }
//   };

//   const shareScreen = async () => {
//     try {
//       const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//       const screenTrack = screenStream.getTracks()[0];
//       const sender = pcRef.current.getSenders().find(s => s.track.kind === 'video');
  
//       if (sender) {
//         sender.replaceTrack(screenTrack);
//       }
  
//       if (screenVideoRef.current) {
//         screenVideoRef.current.srcObject = screenStream;
//       }
  
//       // When user stops sharing screen
//       screenTrack.onended = () => {
//         const videoTrack = localStreamRef.current.getVideoTracks()[0];
//         sender.replaceTrack(videoTrack);
//         if (screenVideoRef.current) {
//           screenVideoRef.current.srcObject = null;
//         }
//       };
//     } catch (err) {
//       console.error('Screen share failed', err);
//     }
//   };  

//   return {
//     localVideoRef,
//     remoteVideoRef,
//     screenVideoRef,
//     toggleAudio,
//     shareScreen,
//     muted,
//   };
// }


import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SIGNALING_SERVER_URL = 'http://localhost:5000';
const ICE_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function useWebRTC(roomId) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef();
  const pcRef = useRef();
  const localStreamRef = useRef();
  const [muted, setMuted] = useState(false);
  const screenVideoRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SIGNALING_SERVER_URL);
    pcRef.current = new RTCPeerConnection(ICE_CONFIG);

    const setupMedia = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      localStreamRef.current = stream;
      stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));
      socketRef.current.emit('join', roomId);
    };

    setupMedia();

    socketRef.current.on('user-joined', async () => {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socketRef.current.emit('offer', { offer, room: roomId });
    });

    socketRef.current.on('offer', async ({ offer }) => {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socketRef.current.emit('answer', { answer, room: roomId });
    });

    socketRef.current.on('answer', async ({ answer }) => {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { candidate: event.candidate, room: roomId });
      }
    };

    socketRef.current.on('ice-candidate', ({ candidate }) => {
      pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    pcRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    return () => {
      socketRef.current.disconnect();
      pcRef.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId]);

  const toggleAudio = () => {
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track.kind === 'video');
  
      if (sender) {
        sender.replaceTrack(screenTrack);
      }
  
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
      }
  
      // When user stops sharing screen
      screenTrack.onended = () => {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        sender.replaceTrack(videoTrack);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = null;
        }
      };
    } catch (err) {
      console.error('Error sharing screen: ', err);
    }
  };

  return {
    localVideoRef,
    remoteVideoRef,
    screenVideoRef,
    toggleAudio,
    shareScreen,
    muted
  };
}