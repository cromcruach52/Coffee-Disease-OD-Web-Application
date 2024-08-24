# app.py

import os
import uuid
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import base64
import io

app = Flask(__name__)
CORS(app)

# Ensure the 'static' directory exists
if not os.path.exists('static'):
    os.makedirs('static')

# Load YOLOv8 models
cleaf_model = YOLO('cleaf.pt')
cdisease_model = YOLO('cdisease.pt')

cleaf_classes = cleaf_model.names
cdisease_classes = cdisease_model.names

cleaf_colors = {
    0: (0, 255, 0),    # Green for 'arabica'
    1: (0, 255, 255),  # Yellow for 'liberica'
    2: (255, 0, 0)     # Red for 'robusta'
}
cdisease_colors = {
    0: (255, 165, 0),  # Orange for 'brown_eye_spot'
    1: (255, 0, 255),  # Magenta for 'leaf_miner'
    2: (0, 0, 255),    # Blue for 'leaf_rust'
    3: (128, 0, 128)   # Purple for 'red_spider_mite'
}

def detect_and_classify_coffee_disease(image, conf_threshold=0.15, iou_threshold=0.45):
    # Convert PIL Image to numpy array
    img_array = np.array(image)

    # Detect leaves
    leaf_results = cleaf_model(img_array)[0]

    # Create a drawing context
    draw = ImageDraw.Draw(image)
    # Load a truetype font
    font_size = 20  # Adjust this size as needed
    font = ImageFont.truetype("arial.ttf", font_size)

    detections = []

    for leaf in leaf_results.boxes.data:
        x1, y1, x2, y2, leaf_conf, leaf_class = leaf
        if leaf_conf > conf_threshold:
            leaf_class = int(leaf_class)
            leaf_name = cleaf_classes[leaf_class]

            # Convert Tensor coordinates to integers
            x1, y1, x2, y2 = map(int, [x1.item(), y1.item(), x2.item(), y2.item()])

            # Draw leaf bounding box
            draw.rectangle([x1, y1, x2, y2], outline=cleaf_colors[leaf_class], width=2)
            draw.text((x1, y1 - font_size - 5), f"{leaf_name} {leaf_conf:.2f}", fill=cleaf_colors[leaf_class], font=font)

            # Crop the leaf region
            leaf_img = image.crop((x1, y1, x2, y2))
            leaf_array = np.array(leaf_img)

            # Detect diseases
            disease_results = cdisease_model(leaf_array)[0]

            for disease in disease_results.boxes.data:
                dx1, dy1, dx2, dy2, disease_conf, disease_class = disease
                if disease_conf > conf_threshold:
                    disease_class = int(disease_class)
                    disease_name = cdisease_classes[disease_class]

                    # Convert Tensor coordinates to integers and adjust them to the original image
                    dx1, dy1, dx2, dy2 = map(int, [dx1.item() + x1, dy1.item() + y1, dx2.item() + x1, dy2.item() + y1])

                    # Draw disease bounding box
                    draw.rectangle([dx1, dy1, dx2, dy2], outline=cdisease_colors[disease_class], width=2)
                    draw.text((dx1, dy1 - font_size - 5), f"{disease_name} {disease_conf:.2f}", fill=cdisease_colors[disease_class], font=font)

                    detections.append({
                        'leaf_class': leaf_name,
                        'leaf_confidence': float(leaf_conf),
                        'disease_class': disease_name,
                        'disease_confidence': float(disease_conf),
                        'bbox': [float(dx1), float(dy1), float(dx2), float(dy2)]
                    })

    return image, detections


@app.route('/detect', methods=['POST'])
def detect_disease():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400
    
    if file:
        # Read the image file
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        
        # Process the image
        processed_image, detections = detect_and_classify_coffee_disease(image)
        
        # Convert the processed image to base64
        img_io = io.BytesIO()
        processed_image.save(img_io, 'JPEG', quality=70)
        img_io.seek(0)
        img_base64 = base64.b64encode(img_io.getvalue()).decode('utf-8')
        Ang 
        # Return the results as JSON
        return jsonify({
            'detections': detections,
            'image': img_base64  # This is the base64 encoded image
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
