import { useState, useEffect, useRef  } from 'react';
import io from 'socket.io-client';
const initSocket = io('http://localhost:5000');

function Home() {
  const canvasRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [socket, setSocket] = useState()
  
  useEffect(() => {
    console.log(socket)
    if (initSocket) {
      setSocket(initSocket)
    }
  
  }, [isVideoReady]);

  useEffect(() => {
      async function startVideoCapture() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          const videoElement = document.getElementById("videoElement");
          videoElement.srcObject = stream;
          videoElement.play();

          videoElement.onloadedmetadata = () => {
            console.log(isVideoReady);
            setIsVideoReady(true);
            // 每隔一段时间发送一帧视频
            setInterval(() => {
              if (!isVideoReady) return;
              const canvas = document.createElement("canvas");
              canvas.width = videoElement.videoWidth;
              canvas.height = videoElement.videoHeight;
              canvas.getContext("2d").drawImage(videoElement, 0, 0);

              // 将canvas转换为Blob或ArrayBuffer
              canvas.toBlob(
                (blob) => {
                  // console.log(blob);
                  socket.emit("video_frame", blob);
                },
                "image/jpeg"
              );
            }, 300);
          };
        } catch (err) {
          console.error("Error accessing media devices.", err);
        }
      }

     if (socket) {
       // // 开始捕获视频并将其发送到服务器
        startVideoCapture()
     }

  }, [socket, isVideoReady]);

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

    if (socket) {
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
    }
  }, [socket]);


  return (
    <div>
      <div>
        <h1>Raw video </h1>
        <video id="videoElement" autoPlay />
      </div>
      <div>
        <h1>Face detect</h1>
        <canvas ref={canvasRef} width="640" height="480" />
      </div>
    </div>
    
  );
}

export default Home;