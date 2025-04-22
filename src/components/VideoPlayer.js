// import React from 'react';

// export default function VideoPlayer({ localVideoRef, remoteVideoRef, screenVideoRef }) {
//   return (
//     <div className="flex justify-center gap-4 items-center h-full w-full bg-black p-4">
//       <video ref={localVideoRef} autoPlay playsInline muted className="w-1/3 rounded-lg border-4 border-blue-500" />
//       <video ref={remoteVideoRef} autoPlay playsInline className="w-1/3 rounded-lg border-4 border-green-500" />
//       {screenVideoRef && (
//         <video ref={screenVideoRef} autoPlay playsInline muted className="w-1/3 rounded-lg border-4 border-purple-500" />
//       )}
//     </div>
//   );
// }


// import React from 'react';
// export default function VideoPlayer({ 
//   localVideoRef, 
//   remoteVideoRef, 
//   screenVideoRef, 
//   isScreenFull, 
//   toggleFullScreen 
// }) {
//   return (
//     <div className="relative flex justify-center items-center bg-black">
//       {/* Local Video */}
//       <video
//         ref={localVideoRef}
//         autoPlay
//         playsInline
//         muted
//         className={`w-1/1 h-1/1 rounded-lg ${isScreenFull ? 'opacity-50' : ''}`}
//       />
//       {/* <div className="absolute top-2 left-2 text-white bg-blue-500 px-2 py-1 rounded-lg">You</div> */}

//       {/* Remote Video */}
//       <video
//         ref={remoteVideoRef}
//         autoPlay
//         playsInline
//         className={`w-1/1 h-1/1 rounded-lg  ${isScreenFull ? 'opacity-50' : ''}`}
//       />
//       {/* <div className="absolute top-2 left-2 text-white bg-green-500 px-2 py-1 rounded-lg">Peer</div> */}

//       {/* Shared Screen (Hidden by default) */}
//       {screenVideoRef && (
//         <div 
//           onClick={toggleFullScreen}
//           className={`absolute ${isScreenFull ? 'w-full h-full' : 'w-1/3 h-1/3'} top-0 left-0`}
//         >
//           <video
//             ref={screenVideoRef}
//             autoPlay
//             playsInline
//             muted
//             className={`w-full h-full rounded-lg  ${isScreenFull ? 'opacity-100' : 'opacity-0'}`}
//           />
//           {/* <div className="absolute top-2 left-2 text-white bg-purple-500 px-2 py-1 rounded-lg">Screen Share</div> */}
//         </div>
//       )}
//     </div>
//   );
// }


import React from 'react';

export default function VideoPlayer({
  localVideoRef,
  remoteVideoRef,
  screenVideoRef,
  isScreenFull,
  toggleFullScreen,
  isScreenSharing,
}) {
  return (
    <div className="relative flex-1 bg-black w-full h-full overflow-hidden">

      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Shared Screen Video */}
      <video
        ref={screenVideoRef}
        autoPlay
        playsInline
        muted
        onClick={toggleFullScreen}
        className={`absolute z-10 object-cover transition-all duration-300 rounded-lg ${
          isScreenSharing ? 'inset-0 w-full h-full opacity-100' : 'w-0 h-0 opacity-0 pointer-events-none'
        }`}
      />

      {/* Local Video */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={`rounded-md border-2 border-white shadow-md object-cover transition-all duration-300 ${
          isScreenSharing
            ? 'absolute bottom-4 right-4 w-40 h-28 z-20'
            : 'absolute bottom-4 right-4 w-80 h-56 z-20'
        }`}
      />
    </div>
  );
}
