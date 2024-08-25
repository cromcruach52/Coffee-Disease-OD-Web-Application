import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './DetectionComponent.css';

interface Detection {
  leaf_class: string;
  leaf_confidence: number;
  disease_class: string;
  disease_confidence: number;
  bbox: number[];
}

interface ApiResponse {
  detections: Detection[];
  image: string;
}

interface DetectionComponentProps {
  imageFile: File | null;
}

const DetectionComponent: React.FC<DetectionComponentProps> = ({ imageFile }) => {
  const [result, setResult] = useState<Detection[] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = useCallback(() => {
    setResult(null);
    setImageUrl(null);
    setError(null);
    setIsModalOpen(false);
    setIsLoading(false);
  }, []);

  const detectAndClassify = useCallback(async (file: File) => {
    if (isLoading) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      console.log('Sending detection request...');
      const response = await axios.post<ApiResponse>('http://localhost:5000/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Raw API response:', response.data);

      if (response.data && response.data.detections && Array.isArray(response.data.detections)) {
        console.log(`Received ${response.data.detections.length} detections`);
        setResult(response.data.detections);
        if (response.data.image) {
          setImageUrl(`data:image/jpeg;base64,${response.data.image}`);
        }
        setError(null);
        setIsModalOpen(true);
      } else {
        console.error('Unexpected response structure:', response.data);
        setError('Unexpected response from server');
        resetState();
      }
    } catch (error) {
      console.error('Error during detection:', error);
      setError('Error during detection');
      resetState();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, resetState]);

  useEffect(() => {
    if (imageFile) {
      console.log('New image file detected, starting detection process');
      detectAndClassify(imageFile);
    } else {
      console.log('No image file, resetting state');
      resetState();
    }
  }, [imageFile, detectAndClassify, resetState]);

  return (
    <div className="detection-component">
      {error && <p className="error">{error}</p>}
      {isLoading && <p>Loading...</p>}

      {isModalOpen && result && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-button" onClick={resetState}>&times;</span>
            <h2>Detection Results:</h2>
            {imageUrl && (
              <div className="image-container">
                <img src={imageUrl} alt="Processed" className="detected-image" />
              </div>
            )}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionComponent;