import { useEffect, useRef  } from 'react';
import io from 'socket.io-client';
import WebMWriter from 'webm-writer';

const socket = io('http://localhost:5000');
function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function startVideoCapture() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoElement = document.getElementById('videoElement');
        videoElement.srcObject = stream;
        videoElement.play();

        // 每隔一段时间发送一帧视频
        setInterval(() => {
          const canvas = document.createElement('canvas');
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          canvas.getContext('2d').drawImage(videoElement, 0, 0);

          // 将canvas转换为Blob或ArrayBuffer
          canvas.toBlob((blob) => {
            socket.emit('video_frame', blob);
          }, 'image/jpeg');
        }, 100);
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    }

    // 开始捕获视频并将其发送到服务器
    startVideoCapture();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const drawImage = (imageUrl) => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const image = new Image();
      image.src = imageUrl;

      image.onload = () => {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
    };

    socket.on('result_data', (imageArrayBuffer) => {
      const arrayBufferToBlob = (buffer, type) => {
        return new Blob([buffer], { type: type });
      };
      
      const imageBlob = arrayBufferToBlob(imageArrayBuffer, 'image/jpeg');
      const imageUrl = URL.createObjectURL(imageBlob);
      drawImage(imageUrl);
    });

    return () => {
      socket.disconnect();
    };
  }, []);


  return (
    <div>
      <div>
        <video id="videoElement" autoPlay />
      </div>
      <div>
        <h1>Real-time Video Streaming</h1>
        <canvas ref={canvasRef} width="640" height="480" />
      </div>
    </div>
    
  );
}

export default Home;