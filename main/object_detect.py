import tensorflow as tf
from PIL import Image
import numpy as np
import cv2
import io
from flask import Flask, request, jsonify
import kagglehub
from flask_cors import CORS
import base64

app = Flask(__name__)
CORS(app)

def load_image_into_numpy_array(image):
    (im_width, im_height) = image.size
    return np.array(image).reshape((im_height, im_width, 3)).astype(np.uint8)

# Ensure that the model is loaded here
model_dir = kagglehub.model_download("tensorflow/ssd-mobilenet-v2/tensorFlow2/fpnlite-320x320")
model = tf.saved_model.load(str(model_dir))

# Load the label map
label_map_path = "../pretrained/label_map.pbtxt"
category_index = {}
with open(label_map_path, 'r') as f:
    id = None
    display_name = None
    for line in f.readlines():
        if "id" in line:
            id = int(line.split(':')[-1])
        if "display_name" in line:
            display_name = line.split(':')[-1].strip().strip("'")
        if id and display_name:
            category_index[id] = display_name
            id = None
            display_name = None

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        image = Image.open(file.stream).convert('RGB')
        image_np = load_image_into_numpy_array(image)
        
        # Convert to tensor and add batch dimension
        input_tensor = tf.convert_to_tensor(image_np)
        input_tensor = input_tensor[tf.newaxis, ...]

        try:
            # Perform object detection
            output_dict = model(input_tensor)

            # Extract detection results
            num_detections = int(output_dict['num_detections'].numpy()[0])
            boxes = output_dict['detection_boxes'].numpy()[0]
            classes = output_dict['detection_classes'].numpy()[0].astype(int)
            scores = output_dict['detection_scores'].numpy()[0]

            # Dictionary to hold counts of detected objects
            detected_objects = {}

            # Draw bounding boxes and labels on the image
            height, width, _ = image_np.shape
            for i in range(num_detections):
                if scores[i] > 0.3:  # Confidence threshold
                    box = boxes[i] * [height, width, height, width]
                    ymin, xmin, ymax, xmax = box.astype(int)
                    cv2.rectangle(image_np, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
                    
                    # Prepare text and background
                    label_id = int(classes[i])
                    label = category_index.get(label_id, 'Unknown')
                    confidence_percentage = int(scores[i] * 100)  # Convert to percentage
                    text = f"{label}: {confidence_percentage}%"
                    
                    # Measure text size
                    (text_width, text_height), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
                    
                    # Draw background rectangle
                    background_xmin = xmin
                    background_ymin = ymin - text_height - 10
                    background_xmax = xmin + text_width
                    background_ymax = ymin
                    cv2.rectangle(image_np, (background_xmin, background_ymin), (background_xmax, background_ymax), (255, 255, 255), -1)
                    
                    # Add label with black font
                    cv2.putText(image_np, text, (xmin, ymin - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

                    # Update detected objects count
                    if label in detected_objects:
                        detected_objects[label] += 1
                    else:
                        detected_objects[label] = 1

            # Convert image array to a PIL image and save to a bytes buffer
            output_image = Image.fromarray(image_np)
            img_byte_arr = io.BytesIO()
            output_image.save(img_byte_arr, format='PNG')
            img_byte_arr = io.BytesIO(img_byte_arr.getvalue())
            img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')

            # Prepare response data
            response_data = {
                'detected_objects': detected_objects,
                'image': img_base64
            }

            # Send the image with detected objects as a response
            return jsonify(response_data)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
