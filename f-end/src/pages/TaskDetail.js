import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import CommentSection from '../components/CommentSection';
import FileUpload from '../components/FileUpload';
import './TaskDetail.css';

const TaskDetail = () => {
    const { id } = useParams();
    const [task, setTask] = useState(null);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTask();
        fetchFiles();
    }, [id]);

    const fetchTask = async () => {
        try {
            const response = await axios.get(`/api/tasks/${id}`);
            setTask(response.data);
        } catch (error) {
            setError('Error loading task');
            console.error('Error fetching task:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFiles = async () => {
        try {
            const response = await axios.get(`/api/files?task_id=${id}`);
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    const handleFileUpload = (newFile) => {
        setFiles([...files, newFile]);
    };

    const handleFileDelete = async (fileId) => {
        try {
            await axios.delete(`/api/files/${fileId}`);
            setFiles(files.filter(file => file.id !== fileId));
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!task) return <div>Task not found</div>;

    return (
        <div className="task-detail">
            <div className="task-header">
                <h1>{task.title}</h1>
                <div className="task-meta">
                    <span className="status">Status: {task.status}</span>
                    <span className="priority">Priority: {task.priority}</span>
                </div>
            </div>

            <div className="task-content">
                <div className="task-description">
                    <h2>Description</h2>
                    <p>{task.description}</p>
                </div>

                <div className="task-files">
                    <h2>Files</h2>
                    <FileUpload
                        taskId={task.id}
                        onUploadComplete={handleFileUpload}
                    />
                    <div className="files-list">
                        {files.map(file => (
                            <div key={file.id} className="file-item">
                                <div className="file-info">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-size">{file.formatted_size}</span>
                                </div>
                                <div className="file-actions">
                                    <a
                                        href={`/api/files/${file.id}/download`}
                                        className="download-button"
                                    >
                                        Download
                                    </a>
                                    <button
                                        onClick={() => handleFileDelete(file.id)}
                                        className="delete-button"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="task-comments">
                    <CommentSection taskId={task.id} />
                </div>
            </div>
        </div>
    );
};

export default TaskDetail; 