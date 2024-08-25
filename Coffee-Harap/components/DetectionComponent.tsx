import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const detectAndClassify = async (
  file: File, 
  setResult: React.Dispatch<React.SetStateAction<Detection[] | null>>,
  setImageUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsLoading(true);
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await axios.post<ApiResponse>('http://localhost:5000/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    if (response.data && response.data.detections && Array.isArray(response.data.detections)) {
      setResult(response.data.detections);
      if (response.data.image) {
        setImageUrl(`data:image/jpeg;base64,${response.data.image}`);
      }
      setError(null);
      setIsModalOpen(true);  // Open the modal
    } else {
      setError('Unexpected response from server');
    }
  } catch (error) {
    setError('Error during detection');
  } finally {
    setIsLoading(false);
  }
};

const DetectionComponent: React.FC<DetectionComponentProps> = ({ imageFile }) => {
  const [result, setResult] = useState<Detection[] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const processedFileRef = useRef<File | null>(null);

  const detectAndClassify = useCallback(async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post<ApiResponse>('http://localhost:5000/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data && response.data.detections && Array.isArray(response.data.detections)) {
        setResult(response.data.detections);
        if (response.data.image) {
          setImageUrl(`data:image/jpeg;base64,${response.data.image}`);
        }
        setError(null);
        setIsModalOpen(true);  // Open the modal after detection is successful
      } else {
        setError('Unexpected response from server');
      }
    } catch (error) {
      setError('Error during detection');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (imageFile && imageFile !== processedFileRef.current && !isLoading) {
      processedFileRef.current = imageFile;
      detectAndClassify(imageFile);
    }
  }, [imageFile, detectAndClassify, isLoading]);

  return (
    <div className="detection-component">
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-button" onClick={() => setIsModalOpen(false)}>&times;</span>
            {error ? (
              <p className="error">{error}</p>
            ) : (
              <>
                <h2>Detection Results:</h2>
                <div className="image-container">
                  {/* Use undefined instead of null for the img src */}
                  <img src={imageUrl || undefined} alt="Detected" className="detected-image" />
                </div>
                <div className="results-container">
                  {result && result.map((detection, index) => (
                    <div key={index}>
                      <p>Leaf: {detection.leaf_class} (Confidence: {(detection.leaf_confidence * 100).toFixed(2)}%)</p>
                      <p>Disease: {detection.disease_class} (Confidence: {(detection.disease_confidence * 100).toFixed(2)}%)</p>
                      <p>Bounding Box: ({detection.bbox.map(coord => coord.toFixed(2)).join(', ')})</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isLoading && <p>Loading...</p>}
    </div>
  );
};

export default DetectionComponent;
