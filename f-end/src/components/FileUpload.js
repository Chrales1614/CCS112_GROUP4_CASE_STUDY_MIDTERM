import React, { useState } from 'react';
import axios from '../../api/axiosConfig';
import './FileUpload.css';

const FileUpload = ({ taskId, projectId, onUploadComplete }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
            setSelectedFile(file);
            setError(null);
        } else {
            setError('File size must be less than 10MB');
            setSelectedFile(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);
        if (taskId) formData.append('task_id', taskId);
        if (projectId) formData.append('project_id', projectId);

        try {
            const response = await axios.post('/api/files', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSelectedFile(null);
            if (onUploadComplete) {
                onUploadComplete(response.data);
            }
        } catch (error) {
            setError('Error uploading file. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-upload">
            <div className="file-input-container">
                <input
                    type="file"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="file-input"
                />
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="upload-button"
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>
            {selectedFile && (
                <div className="file-info">
                    <span>{selectedFile.name}</span>
                    <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
            )}
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default FileUpload; 