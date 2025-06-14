import { useEffect, useRef } from 'react'

const CANVAS_PADDING_PX = 80;

type LegacyHTMLVideoElement = Omit<HTMLVideoElement, 'srcObject'> | Omit<HTMLVideoElement, 'src'>;

function GameComponent() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const videoElement = videoRef.current;
    
    const setupWebcam = async () => {
      try {
        // Request access to webcam
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false 
        })

        // Set video source with fallback for older browsers
        if (videoElement) {
          const video = videoElement as LegacyHTMLVideoElement;
          
          if ("srcObject" in video) {
            video.srcObject = mediaStream;
          } else {
            video.src = URL.createObjectURL(mediaStream as unknown as Blob);
          }
        }
      } catch (error) {
        console.error('Error accessing webcam:', error)
      }
    }

    setupWebcam()

    // Cleanup function using captured video element
    return () => {
      if (videoElement) {
        const video = videoElement as unknown as LegacyHTMLVideoElement;
        
        if ("srcObject" in video && video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        } else if ("src" in video && video.src) {
          // Clean up object URL for older browsers
          URL.revokeObjectURL(video.src);
        }
      }
    }
  }, [])

  return (
    <div className="bg-orange-400 min-h-screen" style={{ padding: `${CANVAS_PADDING_PX}px` }}>
      <video 
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="rounded-4xl bg-white object-cover border-4 border-orange-800" 
        style={{
          width: `calc(100vw - ${CANVAS_PADDING_PX * 2}px)`,
          height: `calc(100vh - ${CANVAS_PADDING_PX * 2}px)`,
          transform: 'scaleX(-1)'
        }}
      />
    </div>
  )
}

export default GameComponent 