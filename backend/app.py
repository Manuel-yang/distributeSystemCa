import eventlet
eventlet.monkey_patch()
import cv2
import numpy as np
from flask import Flask, render_template
from flask_socketio import SocketIO, emit


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def test_connect():
    print('someone connected to websocket')
    emit('responseMessage', {'data': 'Connected! ayy'})

@socketio.on('video_frame')
def handle_video_frame(data):
    # 处理接收到的视频帧数据
    compressed_image_data = np.frombuffer(data, dtype=np.uint8)
    frame = cv2.imdecode(compressed_image_data, cv2.IMREAD_COLOR)
    resData = gen_frames(frame)

    emit('result_data', resData)
    # print("Received video frame")





def gen_frames(frame):
        detector=cv2.CascadeClassifier('Haarcascades/haarcascade_frontalface_default.xml')
        eye_cascade = cv2.CascadeClassifier('Haarcascades/haarcascade_eye.xml')
        faces=detector.detectMultiScale(frame,1.1,7)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
         #Draw the rectangle around each face
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            roi_gray = gray[y:y+h, x:x+w]
            roi_color = frame[y:y+h, x:x+w]
            eyes = eye_cascade.detectMultiScale(roi_gray, 1.1, 3)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        return frame

if __name__ == "__main__":
    import eventlet.wsgi
    eventlet.wsgi.server(eventlet.listen(('', 5000)), app)