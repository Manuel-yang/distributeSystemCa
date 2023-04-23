# make sure to give name of sample in line 7
import glob

import cv2, sys, numpy, os
import numpy as np

current_dir = os.getcwd()

def fileNumber(path):
    count = len(os.listdir(path))
    return  count

def preprocessing(frame):

    size = 2
    classifier = 'Haarcascades/haarcascade_frontalface_default.xml'
    image_dir = 'service/images'
    try:
        name_class = "YanAemons"  # name of person for recognition
    except:
        print("You must provide a name")
        sys.exit(0)
    path = os.path.join(current_dir, image_dir, name_class)

    imageNumber = fileNumber(path)+1
    print(path)
    if imageNumber >= 40:
        return

    if not os.path.isdir(path):
        os.mkdir(path)
    (im_width, im_height) = (112, 92)
    haar_cascade = cv2.CascadeClassifier(classifier)



    # The program loops until it has 20 images of the face.
    count = 0
    pause = 0
    count_max = 40  # desired number of sample per class

    cv2.imwrite('%s/%s.png' % (path, count), frame)
    # Get image shape
    height, width, channels = frame.shape  # 640 , 480 ,3

    # Flip frame
    frame = cv2.flip(frame, 1)

    # Convert to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Scale down for speed
    mini = cv2.resize(gray, (int(gray.shape[1] / size), int(gray.shape[0] / size)))

    # Detect faces
    faces = haar_cascade.detectMultiScale(mini)

    # We only consider largest face
    faces = sorted(faces, key=lambda x: x[3])
    if faces:
        face_i = faces[0]
        (x, y, w, h) = [v * size for v in face_i]

        face = gray[y:y + h, x:x + w]
        face_resize = cv2.resize(face, (im_width, im_height))

        # Draw rectangle and write name
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 3)
        cv2.putText(frame, name_class, (x - 10, y - 10), cv2.FONT_HERSHEY_PLAIN,
                    1, (0, 255, 255), 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        # 将编码后的二进制数据保存到本地文件
        with open(os.path.join(path, '{}.jpg'.format(imageNumber)), 'wb') as f:
            f.write(buffer.tobytes())
        return frame
