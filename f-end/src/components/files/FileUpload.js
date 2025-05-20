//This is for file upload

import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axiosConfig';
import { useAuth } from '../../contexts/AuthContext';
import './FileUpload.css';

const API_BASE_URL = 'http://localhost:8000/api';

const FileUpload = ({ taskId, projectId }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            const response = await axios.get(`${API_BASE_URL}/files`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    task_id: taskId,
                    project_id: projectId
                }
            });
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
            setError('Failed to load files');
        } finally {
            setLoading(false);
        }
    }, [taskId, projectId]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleFileChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        // Validate file size
        const maxSize = 10 * 1024 * 1024; // 10MB
        const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            setError(`Some files exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            if (!user) {
                throw new Error('You must be logged in to upload files');
            }

            for (const file of selectedFiles) {
                const formData = new FormData();
                formData.append('file', file);
                if (taskId) formData.append('task_id', taskId);
                if (projectId) formData.append('project_id', projectId);

                const response = await axios.post(`${API_BASE_URL}/files`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                setFiles(prevFiles => [...prevFiles, response.data]);
            }
            e.target.value = ''; // Reset file input
        } catch (error) {
            console.error('Error uploading files:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Failed to upload files');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (fileId) => {
        try {
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(`${API_BASE_URL}/files/${fileId}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', files.find(f => f.id === fileId).name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Failed to download file');
            }
        }
    };

    const handleDelete = async (fileId) => {
        try {
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            await axios.delete(`${API_BASE_URL}/files/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
        } catch (error) {
            console.error('Error deleting file:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Failed to delete file');
            }
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="file-upload">
            <h3>Files</h3>
            {error && <div className="file-error">{error}</div>}

            <div className="upload-section">
                <label htmlFor="file-input" className="upload-button">
                    <i className="fas fa-upload"></i>
                    {uploading ? 'Uploading...' : 'Upload Files'}
                </label>
                <input
                    id="file-input"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    disabled={uploading}
                    style={{ display: 'none' }}
                />
            </div>

            <div className="files-list">
                {loading ? (
                    <p className="loading">Loading files...</p>
                ) : files.length === 0 ? (
                    <p className="no-files">No files uploaded yet</p>
                ) : (
                    files.map(file => (
                        <div key={file.id} className="file-item">
                            <div className="file-info">
                                <i className="fas fa-file"></i>
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                            <div className="file-actions">
                                <button
                                    onClick={() => handleDownload(file.id)}
                                    className="download-button"
                                    title="Download file"
                                >
                                    <i className="fas fa-download"></i>
                                </button>
                                <button
                                    onClick={() => handleDelete(file.id)}
                                    className="delete-button"
                                    title="Delete file"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FileUpload; 