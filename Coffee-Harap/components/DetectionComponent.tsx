import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DetectionComponent.css'; // Add CSS for modal and styling

interface Detection {
  leaf_class: string;
  leaf_confidence: number;
  disease_class: string;
  disease_confidence: number;
  bbox: [number, number, number, number];
}

interface DetectionComponentProps {
  imageFile: File | null;
}

const DetectionComponent: React.FC<DetectionComponentProps> = ({ imageFile }) => {
  const [result, setResult] = useState<Detection[] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const detectAndClassify = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.detections);
      setImageUrl(`data:image/jpeg;base64,${response.data.image}`); // Load base64 image
      setError(null);
      setIsModalOpen(true); // Open modal on detection success
    } catch (error) {
      console.error('Error during detection:', error);
      setError('Error during detection');
      setResult(null);
      setImageUrl(null);
    }
  };

  useEffect(() => {
    if (imageFile) {
      detectAndClassify(imageFile);
    }
  }, [imageFile]);

  return (
    <div className="detection-component">
      {error && <p className="error">{error}</p>}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-button" onClick={() => setIsModalOpen(false)}>&times;</span>
            <h2>Detection Results:</h2>
            {imageUrl && (
              <div className="image-container">
                <img src={imageUrl} alt="Processed" className="detected-image" />
              </div>
            )}
            {result && (
              <div className="results-container">
                <ul>
                  {result.map((detection, index) => (
                    <li key={index}>
                      <p>Leaf: {detection.leaf_class} (Confidence: {(detection.leaf_confidence * 100).toFixed(2)}%)</p>
                      <p>Disease: {detection.disease_class} (Confidence: {(detection.disease_confidence * 100).toFixed(2)}%)</p>
                      <p>Bounding Box: ({detection.bbox.map(coord => coord.toFixed(2)).join(', ')})</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionComponent;
