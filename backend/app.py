import concurrent
import os
from concurrent.futures.thread import ThreadPoolExecutor

from gevent import monkey
from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
monkey.patch_all()
import cv2
import numpy as np
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from service.preprocessing import preprocessing
from service.face_recog import faceRecog

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='gevent')
global_executor = ThreadPoolExecutor(max_workers=6)
futures = []

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def test_connect():
    print('someone connected to websocket')


@socketio.on('preprocessing')
def processFace(data):
    name = data["name"]
    pic = data["blob"]
    frame = buffer2frame(pic)
    resData = preprocessing(frame, name)
    emit('result_data', resData)

@socketio.on('video_frame')
def handle_video_frame(data):
    # 处理接收到的视频帧数据
    frame = buffer2frame(data)
    future = global_executor.submit(faceRecog, frame)
    futures.append(future)
    # resData = faceRecog(frame)
    futures_copy = futures.copy()
    # for future in futures:
    for future in futures_copy:
        print(future)
        emit('resDetect', future.result())
        futures.remove(future)



def buffer2frame(data):
    compressed_image_data = np.frombuffer(data, dtype=np.uint8)
    frame = cv2.imdecode(compressed_image_data, cv2.IMREAD_COLOR)
    return frame



# def gen_frames(frame):
#         detector=cv2.CascadeClassifier('Haarcascades/haarcascade_frontalface_default.xml')
#         eye_cascade = cv2.CascadeClassifier('Haarcascades/haarcascade_eye.xml')
#         faces=detector.detectMultiScale(frame,1.1,7)
#         gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
#          #Draw the rectangle around each face
#         for (x, y, w, h) in faces:
#             cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
#             roi_gray = gray[y:y+h, x:x+w]
#             roi_color = frame[y:y+h, x:x+w]
#             eyes = eye_cascade.detectMultiScale(roi_gray, 1.1, 3)
#
#         ret, buffer = cv2.imencode('.jpg', frame)
#         frame = buffer.tobytes()
#         return frame

if __name__ == "__main__":
    http_server = WSGIServer(('0.0.0.0', 5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()

global_executor.shutdown()