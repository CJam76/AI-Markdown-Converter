// frontend/src/App.jsx (or App.tsx)
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './App.css'; // You can add some basic styles here

function App() {
  const [convertedFiles, setConvertedFiles] = useState({});
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    setIsConverting(true);
    setError(null);
    setConvertedFiles({}); // Clear previous results

    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file); // 'files' must match the FastAPI endpoint parameter name
    });

    try {
      const response = await fetch('http://localhost:8000/convert-to-markdown/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Something went wrong during conversion.');
      }

      const data = await response.json();
      setConvertedFiles(data);
    } catch (err) {
      console.error("Conversion error:", err);
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const downloadFile = (filename, content) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`; // Suggest downloading as .md
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <h1>AI Markdown Converter</h1>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      {isConverting && <p>Converting notes to Markdown... Please wait.</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {Object.keys(convertedFiles).length > 0 && (
        <div className="converted-files">
          <h2>Converted Files:</h2>
          <ul>
            {Object.entries(convertedFiles).map(([filename, content]) => (
              <li key={filename}>
                <span>{filename}</span>
                {content.startsWith("Error:") ? (
                  <span style={{ color: 'red', marginLeft: '10px' }}>{content}</span>
                ) : (
                  <button onClick={() => downloadFile(filename.replace(/\.[^/.]+$/, ""), content)}>
                    Download {filename.replace(/\.[^/.]+$/, "")}.md
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;