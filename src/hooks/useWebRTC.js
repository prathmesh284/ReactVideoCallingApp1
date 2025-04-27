// import { useEffect, useRef, useState } from 'react';
// import { io } from 'socket.io-client';

// const socket = io('http://localhost:5000'); // your signaling server

// export default function useWebRTC(roomId) {
//   const localVideoRef = useRef();
//   const remoteVideoRef = useRef();
//   const screenVideoRef = useRef();

//   const [muted, setMuted] = useState(false);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [isRemoteConnected, setIsRemoteConnected] = useState(false);

//   const peerRef = useRef();
//   const localStreamRef = useRef();
//   const screenStreamRef = useRef();

//   useEffect(() => {
//     const init = async () => {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//       localStreamRef.current = stream;
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }

//       socket.emit('join', roomId);

//       socket.on('ready', handleReady);
//       socket.on('offer', handleOffer);
//       socket.on('answer', handleAnswer);
//       socket.on('ice-candidate', handleNewICECandidate);
//       socket.on('leave', handleRemoteLeave);
//       socket.on('screen-sharing', handleScreenSharing);
//     };

//     const handleReady = async () => {
//       createPeer(true);
//       addLocalTracks();
//     };

//     const handleOffer = async (offer) => {
//       createPeer(false);
//       await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
//       const answer = await peerRef.current.createAnswer();
//       await peerRef.current.setLocalDescription(answer);
//       socket.emit('answer', { answer, roomId });
//     };

//     const handleAnswer = async ({ answer }) => {
//       if (peerRef.current) {
//         await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
//       }
//     };

//     const handleNewICECandidate = async ({ candidate }) => {
//       try {
//         if (peerRef.current) {
//           await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
//         }
//       } catch (err) {
//         console.error('Error adding received ice candidate', err);
//       }
//     };

//     const handleRemoteLeave = () => {
//       cleanupPeer();
//     };

//     const handleScreenSharing = (screenStream) => {
//       if (screenVideoRef.current) {
//         screenVideoRef.current.srcObject = screenStream;
//       }
//     };

//     const createPeer = (initiator) => {
//       peerRef.current = new RTCPeerConnection();

//       peerRef.current.onicecandidate = (e) => {
//         if (e.candidate) {
//           socket.emit('ice-candidate', { candidate: e.candidate, roomId });
//         }
//       };

//       peerRef.current.ontrack = (e) => {
//         if (remoteVideoRef.current && e.streams[0]) {
//           remoteVideoRef.current.srcObject = e.streams[0];
//           setIsRemoteConnected(true);
//         }
//       };

//       peerRef.current.oniceconnectionstatechange = () => {
//         console.log('ICE state:', peerRef.current.iceConnectionState);
//         if (peerRef.current.iceConnectionState === 'disconnected' || peerRef.current.iceConnectionState === 'failed') {
//           cleanupPeer();
//         }
//       };

//       if (initiator) {
//         peerRef.current.onnegotiationneeded = async () => {
//           const offer = await peerRef.current.createOffer();
//           await peerRef.current.setLocalDescription(offer);
//           socket.emit('offer', { offer, roomId });
//         };
//       }
//     };

//     const addLocalTracks = () => {
//       localStreamRef.current?.getTracks().forEach(track => {
//         peerRef.current.addTrack(track, localStreamRef.current);
//       });
//     };

//     const cleanupPeer = () => {
//       if (peerRef.current) {
//         peerRef.current.close();
//         peerRef.current = null;
//       }
//       setIsRemoteConnected(false);
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = null;
//       }
//     };

//     init();

//     return () => {
//       cleanupPeer();
//       socket.disconnect();
//       localStreamRef.current?.getTracks().forEach(track => track.stop());
//       screenStreamRef.current?.getTracks().forEach(track => track.stop());
//     };
//   }, [roomId]);

//   const toggleAudio = () => {
//     const track = localStreamRef.current?.getAudioTracks()[0];
//     if (track) {
//       track.enabled = !track.enabled;
//       setMuted(!track.enabled);
//     }
//   };

//   const shareScreen = async () => {
//     try {
//       const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//       screenStreamRef.current = screenStream;
  
//       const videoTrack = screenStream.getVideoTracks()[0];
//       if (peerRef.current) {
//         const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
//         if (sender) {
//           sender.replaceTrack(videoTrack);
//         }
//       } else {
//         console.error('peerRef.current is not defined');
//       }
  
//       socket.emit('screen-sharing', screenStream, roomId);
  
//       if (screenVideoRef.current) {
//         screenVideoRef.current.srcObject = screenStream;
//       }
//       setIsScreenSharing(true);
  
//       videoTrack.onended = async () => {
//         const originalTrack = localStreamRef.current.getVideoTracks()[0];
//         if (peerRef.current) {
//           const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
//           if (sender) {
//             sender.replaceTrack(originalTrack);
//           }
//         }
//         if (screenVideoRef.current) {
//           screenVideoRef.current.srcObject = null;
//         }
//         setIsScreenSharing(false);
//       };
//     } catch (err) {
//       console.error('Screen share error:', err);
//     }
//   };  

//   return {
//     localVideoRef,
//     remoteVideoRef,
//     screenVideoRef,
//     toggleAudio,
//     shareScreen,
//     muted,
//     isScreenSharing,
//     isRemoteConnected,
//   };
// }


// import { useEffect, useRef, useState } from 'react';
// import { io } from 'socket.io-client';

// // 👇 Replace with your Railway backend URL
// const socket = io('https://reactvideocallingapp1-backend-production.up.railway.app'); 

// export default function useWebRTC(roomId) {
//   const localVideoRef = useRef();
//   const remoteVideoRef = useRef();

//   const peerRef = useRef();
//   const localStreamRef = useRef();

//   const [muted, setMuted] = useState(false);
//   const [isRemoteConnected, setIsRemoteConnected] = useState(false);

//   useEffect(() => {
//     const init = async () => {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//       localStreamRef.current = stream;
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }

//       socket.emit('join', roomId);

//       socket.on('offer', async (offer) => {
//         createPeer(false);
//         await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
//         const answer = await peerRef.current.createAnswer();
//         await peerRef.current.setLocalDescription(answer);
//         socket.emit('answer', { answer: peerRef.current.localDescription, roomId });
//       });

//       socket.on('answer', async (answer) => {
//         if (peerRef.current) {
//           await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
//         }
//       });

//       socket.on('ice-candidate', async ({ candidate }) => {
//         if (peerRef.current) {
//           await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
//         }
//       });
//     };

//     const createPeer = (initiator) => {
//       peerRef.current = new RTCPeerConnection();

//       peerRef.current.onicecandidate = (e) => {
//         if (e.candidate) {
//           socket.emit('ice-candidate', { candidate: e.candidate, roomId });
//         }
//       };

//       peerRef.current.ontrack = (e) => {
//         if (remoteVideoRef.current && e.streams[0]) {
//           remoteVideoRef.current.srcObject = e.streams[0];
//           setIsRemoteConnected(true);
//         }
//       };

//       if (initiator) {
//         peerRef.current.onnegotiationneeded = async () => {
//           const offer = await peerRef.current.createOffer();
//           await peerRef.current.setLocalDescription(offer);
//           socket.emit('offer', { offer: peerRef.current.localDescription, roomId });
//         };
//       }

//       localStreamRef.current.getTracks().forEach(track => {
//         peerRef.current.addTrack(track, localStreamRef.current);
//       });
//     };

//     init();

//     return () => {
//       if (peerRef.current) {
//         peerRef.current.close();
//         peerRef.current = null;
//       }
//       socket.disconnect();
//       localStreamRef.current?.getTracks().forEach(track => track.stop());
//     };
//   }, [roomId]);

//   const toggleAudio = () => {
//     const track = localStreamRef.current?.getAudioTracks()[0];
//     if (track) {
//       track.enabled = !track.enabled;
//       setMuted(!track.enabled);
//     }
//   };

//   return {
//     localVideoRef,
//     remoteVideoRef,
//     toggleAudio,
//     muted,
//     isRemoteConnected,
//   };
// }





import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SIGNALING_SERVER_URL = 'wss://reactvideocallingapp1-backend-production.up.railway.app/socket.io';
const ICE_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function useWebRTC(roomId) {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const screenVideoRef = useRef();

  const [muted, setMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);

  const peerRef = useRef(null);  // Ensure this is initialized to null
  const localStreamRef = useRef();
  const screenStreamRef = useRef();

  // Initialize socket connection
  const socket = useRef(io(SIGNALING_SERVER_URL)); // This creates a socket connection

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.current.emit('join', roomId);

      socket.current.on('ready', handleReady);
      socket.current.on('offer', handleOffer);
      socket.current.on('answer', handleAnswer);
      socket.current.on('ice-candidate', handleNewICECandidate);
      socket.current.on('leave', handleRemoteLeave);
      socket.current.on('screen-sharing', handleScreenSharing);
    };

    const handleReady = async () => {
      createPeer(true);
      addLocalTracks();
    };

    const handleOffer = async (offer) => {
      if (!peerRef.current) return; // Prevent accessing peerRef if not initialized
      createPeer(false);
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.current.emit('answer', { answer, roomId });
    };

    const handleAnswer = async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleNewICECandidate = async ({ candidate }) => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
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
      if (peerRef.current) return;  // Avoid re-creating the peer connection

      peerRef.current = new RTCPeerConnection(ICE_CONFIG);

      peerRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.current.emit('ice-candidate', { candidate: e.candidate, roomId });
        }
      };

      peerRef.current.ontrack = (e) => {
        console.log('Remote track received:', e.streams[0]);
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
          setIsRemoteConnected(true);
        }
      };
      

      peerRef.current.oniceconnectionstatechange = () => {
        if (peerRef.current.iceConnectionState === 'disconnected' || peerRef.current.iceConnectionState === 'failed') {
          cleanupPeer();
        }
      };

      if (initiator) {
        peerRef.current.onnegotiationneeded = async () => {
          const offer = await peerRef.current.createOffer();
          await peerRef.current.setLocalDescription(offer);
          socket.current.emit('offer', { offer, roomId });
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
        peerRef.current = null;  // Reset peerRef
      }
      setIsRemoteConnected(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    // Create a local variable for socket to prevent ref changes during cleanup
    const socketInstance = socket.current;

    init();

    return () => {
      cleanupPeer();
      // Use socketInstance in cleanup to avoid issues with socket.current being updated
      socketInstance.disconnect();
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
      // Ensure peerRef is initialized before attempting to share screen
      if (!peerRef.current) {
        console.error('Peer connection not established');
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;

      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
      
      if (sender) {
        sender.replaceTrack(videoTrack);
      } else {
        console.error('No video sender found');
        return;
      }

      socket.current.emit('screen-sharing', screenStream, roomId);

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);

      videoTrack.onended = async () => {
        const originalTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(originalTrack);
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
