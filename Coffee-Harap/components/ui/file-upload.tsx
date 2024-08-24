import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IconUpload, IconCamera, IconX, IconScan } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

interface ScanResult {
  prediction : string[],
  confidences: string[],
}

export const FileUpload = ({
  onChange,
}: {
  onChange?: (files: File[]) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, []);

  const handleFileChange = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const selectedFile = newFiles[0];
      setFile(selectedFile);
      onChange && onChange(newFiles);
    }
  };

  const handleClick = () => {
    if (!file) {
      fileInputRef.current?.click();
    }
  };

  const handleCancel = () => {
    setFile(null);
    fileInputRef.current!.value = ""; // Reset input value
  };

  const handleTakePhoto = () => {
    if (!file && isMobile) {
      // Implement functionality for taking a photo using the device camera
      // Example: Use getUserMedia API to open camera and take a photo
    } else if (!isMobile) {
      alert("Taking a photo is only supported on mobile devices.");
    }
  };

  const [scanResult, setScanResult] = useState<ScanResult>();

  const handleScan = () => {
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
  
      fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            setScanResult(data.result); // Update state with the scan result
          } else {
            alert("Error scanning the image: " + data.error);
          }
        })
        .catch((error) => {
          console.error('Error:', error);
          alert('An error occurred while scanning the image.');
        });
    }
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
  <div className="w-full" {...getRootProps()}>
    <motion.div
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
    >
      <input
        ref={fileInputRef}
        id="file-upload-handle"
        type="file"
        accept="image/jpeg, image/png"
        onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
        className="hidden"
      />
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
        <GridPattern />
      </div>
      <div className="flex flex-col items-center justify-center">
        {file ? (
          <div className="relative z-10 w-full mt-4">
            <img
              src={URL.createObjectURL(file)}
              alt="Uploaded File"
              className="w-full h-auto max-w-xs mx-auto rounded-md"
            />
            <p className="text-center text-sm mt-2 text-neutral-700 dark:text-neutral-300">
              {file.name}
            </p>
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-400">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={handleCancel}
                className="text-red-500 flex items-center gap-2"
              >
                <IconX /> Cancel
              </button>
              <button
                onClick={handleScan}
                className="text-blue-500 flex items-center gap-2"
              >
                <IconScan /> Scan
              </button>
            </div>
            {scanResult && scanResult.prediction.map((prediction, index) => (
          <li key={index}>
            {prediction}: {scanResult.confidences[index]}
          </li>
        ))}
          </div>
        ) : (
          <>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center justify-center"
            >
              <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
                Upload file
              </p>
              <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
                Drag or drop your image file here or click to upload
              </p>
              <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300 mt-4" />
            </motion.div>
            {isMobile && (
              <button
                onClick={handleTakePhoto}
                className="mt-4 text-green-500 flex items-center gap-2"
              >
                <IconCamera /> Take a Photo
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  </div>
);

function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 flex-shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex flex-shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}
}
