import os
import io
import base64
from PIL import Image
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# Load YOLOv8 models
cleaf_model = YOLO('cleaf.pt')
cdisease_model = YOLO('cdisease.pt')

cleaf_colors = {
    0: (0, 255, 0),    # Green for 'arabica'
    1: (0, 255, 255),  # Yellow for 'liberica'
    2: (255, 0, 0)     # Blue for 'robusta'
}
cdisease_colors = {
    0: (255, 165, 0),  # Orange for 'brown_eye_spot'
    1: (255, 0, 255),  # Magenta for 'leaf_miner'
    2: (0, 0, 255),    # Red for 'leaf_rust'
    3: (128, 0, 128)   # Purple for 'red_spider_mite'
}

def put_label_on_image(img, label, x, y, color, screen_width):
    font_scale = 0.5
    font_thickness = 1
    (label_width, label_height), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness)

    if x + label_width > screen_width:
        x = screen_width - label_width - 10

    cv2.rectangle(
        img,
        (x, y - label_height - baseline),
        (x + label_width, y),
        color=color,
        thickness=cv2.FILLED
    )
    cv2.putText(
        img,
        label,
        (x, y - baseline),
        cv2.FONT_HERSHEY_SIMPLEX,
        font_scale,
        (0, 0, 0),
        thickness=font_thickness,
        lineType=cv2.LINE_AA
    )

def detect_and_classify_coffee_disease(image, conf_threshold=0.25, iou_threshold=0.45, screen_width=1920, screen_height=1080, max_detections=10):
    img = np.array(image)
    detections = []

    # Stage 1: Detect the coffee leaf
    leaf_results = cleaf_model(img, conf=conf_threshold, iou=iou_threshold, verbose=False)[0]
    
    for box in leaf_results.boxes[:max_detections]:  # Limit to max_detections
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
        confidence = box.conf[0].cpu().numpy()
        class_id = int(box.cls[0].cpu().numpy())
        class_name = cleaf_model.names[class_id]
        color = cleaf_colors.get(class_id, (255, 255, 255))

        cv2.rectangle(img, (x1, y1), (x2, y2), color=color, thickness=2)
        label = f"{class_name} {confidence:.2f}"
        put_label_on_image(img, label, x1, y1, color, screen_width)

        # Stage 2: Detect the disease within the leaf region
        leaf_roi = img[y1:y2, x1:x2]
        disease_results = cdisease_model(leaf_roi, conf=conf_threshold, iou=iou_threshold, verbose=False)[0]
        
        for dbox in disease_results.boxes[:1]:  # Only take the most confident disease detection
            dx1, dy1, dx2, dy2 = dbox.xyxy[0].cpu().numpy().astype(int)
            dconfidence = dbox.conf[0].cpu().numpy()
            dclass_id = int(dbox.cls[0].cpu().numpy())
            dclass_name = cdisease_model.names[dclass_id]
            dcolor = cdisease_colors.get(dclass_id, (255, 255, 255))

            # Adjust disease box coordinates to match the original image
            dx1, dy1, dx2, dy2 = dx1+x1, dy1+y1, dx2+x1, dy2+y1

            cv2.rectangle(img, (dx1, dy1), (dx2, dy2), color=dcolor, thickness=2)
            dlabel = f"{dclass_name} {dconfidence:.2f}"
            put_label_on_image(img, dlabel, dx1, dy1, dcolor, screen_width)

            detections.append({
                'leaf_class': class_name,
                'leaf_confidence': float(confidence),
                'disease_class': dclass_name,
                'disease_confidence': float(dconfidence),
                'bbox': [float(dx1), float(dy1), float(dx2), float(dy2)]
            })

        if len(detections) >= max_detections:
            break

    # Resize the image to fit the screen if needed
    img_height, img_width = img.shape[:2]
    scaling_factor = min(screen_width / img_width, screen_height / img_height)
    if scaling_factor < 1.0:
        img = cv2.resize(img, (int(img_width * scaling_factor), int(img_height * scaling_factor)))

    return img, detections

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
        _, img_encoded = cv2.imencode('.jpg', processed_image)
        img_base64 = base64.b64encode(img_encoded).decode('utf-8')
    
        # Return the results as JSON
        return jsonify({
            'detections': detections,
            'image': img_base64
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)