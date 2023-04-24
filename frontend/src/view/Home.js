import { useState, useEffect, useRef  } from 'react';
import io from 'socket.io-client';
const initSocket = io('http://localhost:5000');


function Home() {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [socket, setSocket] = useState()
  const [mode, setMode] = useState(0)
  const [inputValue, setInputValue] = useState()

  useEffect(() => {
    if (initSocket) {
      setSocket(initSocket, mode)
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
            if (mode == 0) {
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
            }
                        // 绑定关闭事件处理函数
            socket.on('disconnect', () => {
              console.log('Socket.IO disconnected:');
            });
          };
        } catch (err) {
          console.error("Error accessing media devices.", err);
        }
      }

     if (socket) {
       // // 开始捕获视频并将其发送到服务器
        startVideoCapture()
     }

  }, [socket, isVideoReady, mode]);

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
      socket.on('resDetect', (imageArrayBuffer) => {
        console.log(imageArrayBuffer)
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
  }, [socket, mode]);

  const changeMode = () => {
    if (mode == 0) {
      const newSocket = io('http://localhost:5000');
      socket.close()
      setMode(1)
      setSocket(newSocket)
    }
    else {
      const newSocket = io('http://localhost:5000');
      socket.close()
      setMode(0)
      setSocket(newSocket)
    }
  }


  const preprocessing = () => {
    console.log(socket)
    setInputValue(inputRef.current.value);
    if (inputValue) {
      // 每隔一段时间发送一帧视频
      if (mode == 1) {
        const videoElement = document.getElementById("videoElement");
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
              socket.emit("preprocessing", {"blob": blob, "name": inputValue});
            },
            "image/jpeg"
          );
        }, 1000);
      }

    }

    
  }


  return (
    <div>
      <div>
        <h1>Raw video </h1>
        <video id="videoElement" autoPlay />
      </div>
      <div>
        <button className="button-19 m-3" role="button" onClick={changeMode}>Changne Mode</button>
        { mode == 1 ? 
          <div className="input-group mb-3">
            <input ref={inputRef} type="text" className="form-control" placeholder="Input your name" aria-label="Recipient's username" aria-describedby="button-addon2" />
            <button className="btn btn-outline-secondary" type="button" id="button-addon2" onClick={preprocessing}>Start</button>
          </div>
        : ""}
      </div>
      <div>
        { mode == 0 ? <h1>Current Mode: Face detect</h1>: <h1>Current Mode: preprocessing</h1>}
        
        <canvas ref={canvasRef} width="640" height="480" />
      </div>
    </div>
    
  );
}



export default Home;