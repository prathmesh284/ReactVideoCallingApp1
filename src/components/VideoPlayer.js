import React from "react";

export default function VideoPlayer({
  localVideoRef,
  remoteVideoRef,
  screenVideoRef,
  isScreenFull,
  toggleFullScreen,
  isScreenSharing,
  isRemoteConnected,
}) {
  // Determine which video to display based on the connection and screen-sharing state
  const onlyLocal = !isRemoteConnected && !isScreenSharing;
  const bothConnected = isRemoteConnected && !isScreenSharing;
  const screenShareActive = isScreenSharing;

  return (
    <div className="relative flex-1 bg-black w-full h-full overflow-hidden">
      {/* Screen Share */}
      <video
        ref={screenVideoRef}
        autoPlay
        playsInline
        muted
        onClick={toggleFullScreen}
        className={`absolute z-20 object-cover transition-all duration-300 rounded-lg ${
          screenShareActive
            ? "inset-0 w-full h-full opacity-100"
            : "w-0 h-0 opacity-0 pointer-events-none"
        }`}
      />

      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`object-cover transition-all duration-300 rounded-lg ${
          bothConnected
            ? "absolute inset-0 w-full h-full z-10"
            : screenShareActive
            ? "absolute bottom-4 right-4 w-40 h-28 z-20"
            : "w-0 h-0 opacity-0 pointer-events-none"
        }`}
      />

      {/* Local Video */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={`object-cover rounded-lg border-2 border-white shadow-md transition-all duration-300 ${
          screenShareActive
            ? "w-0 h-0 opacity-0 pointer-events-none"
            : onlyLocal
            ? "absolute inset-0 w-full h-full z-10"
            : bothConnected
            ? "absolute bottom-4 right-4 w-40 h-28 z-20"
            : "w-0 h-0 opacity-0 pointer-events-none"
        }`}
      />
    </div>
  );
}
