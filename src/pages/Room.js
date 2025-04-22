// import React from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import useWebRTC from '../hooks/useWebRTC';
// import VideoPlayer from '../components/VideoPlayer';

// export default function Room() {
//   const { roomId } = useParams();
//   const navigate = useNavigate();
//   const { localVideoRef, remoteVideoRef, toggleAudio, shareScreen, muted, screenVideoRef } = useWebRTC(roomId);

//   return (
//     <div className="h-screen flex flex-col">
//       <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
//         <span className="text-lg font-bold">Room: {roomId}</span>
//         <div className="space-x-4">
//           <button onClick={toggleAudio} className="px-3 py-1 bg-yellow-500 rounded">
//             {muted ? 'Unmute' : 'Mute'}
//           </button>
//           <button onClick={shareScreen} className="px-3 py-1 bg-indigo-500 rounded">
//             Share Screen
//           </button>
//           <button onClick={() => navigate('/')} className="px-3 py-1 bg-red-600 rounded">
//             End Call
//           </button>
//         </div>
//       </div>
//       <VideoPlayer
//         localVideoRef={localVideoRef}
//         remoteVideoRef={remoteVideoRef}
//         screenVideoRef={screenVideoRef}
//       />
//       <div className="bg-gray-100 p-2 text-center text-sm text-gray-600">Participants: You & 1 peer</div>
//     </div>
//   );
// }


import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWebRTC from '../hooks/useWebRTC';
import VideoPlayer from '../components/VideoPlayer';
import { FaSlideshare,FaPhoneSlash,FaVolumeUp,FaVolumeMute } from 'react-icons/fa';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { localVideoRef, remoteVideoRef, toggleAudio, shareScreen, muted, screenVideoRef } = useWebRTC(roomId);
  
  // State for fullscreen toggle
  const [isScreenFull, setIsScreenFull] = useState(false);

  const toggleFullScreen = () => {
    setIsScreenFull(!isScreenFull);
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      <div className="bg-black text-white px-6 py-3 flex justify-between items-center shadow-xl">
        <span className="text-2xl font-semibold">Room: {roomId}</span>
      </div>

      {/* Video Player */}
      <VideoPlayer 
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        screenVideoRef={screenVideoRef} 
        isScreenFull={isScreenFull}
        toggleFullScreen={toggleFullScreen}
      />

      {/* Control Buttons - Fixed at the bottom center */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center gap-6 z-index-10">
        <button 
          onClick={toggleAudio} 
          className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-full shadow-lg hover:bg-yellow-600 transition-all duration-300"
        >
          {muted ? <FaVolumeUp/> : <FaVolumeMute/>}
        </button>
        <button 
          onClick={shareScreen} 
          className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-300"
        >
          <FaSlideshare/>
        </button>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 transition-all duration-300"
        >
          <FaPhoneSlash/>
        </button>
      </div>

      {/* Participants Label */}
      {/* <div className="bg-black text-white text-center py-4 text-lg">
        Participants: You & 1 peer
      </div> */}
    </div>
  );
}
