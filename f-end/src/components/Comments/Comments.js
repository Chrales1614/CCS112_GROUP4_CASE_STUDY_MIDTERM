import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axiosConfig';
import { useAuth } from '../../contexts/AuthContext';
import './CommentSection.css';

const API_BASE_URL = 'http://localhost:8000/api';

const CommentSection = ({ taskId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchComments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}/comments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setError('Failed to load comments');
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        let mounted = true;
        
        const loadComments = async () => {
            if (mounted) {
                await fetchComments();
            }
        };
        
        loadComments();
        
        return () => {
            mounted = false;
        };
    }, [fetchComments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            if (!user) {
                throw new Error('You must be logged in to post comments');
            }

            const response = await axios.post(
                `${API_BASE_URL}/tasks/${taskId}/comments`,
                {
                    content: newComment,
                    parent_id: replyTo,
                    user_id: user.id // Explicitly include user_id
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (replyTo) {
                try {
                    setComments(prevComments => prevComments.map(comment =>
                        comment.id === replyTo
                            ? { ...comment, replies: Array.isArray(comment.replies) ? [...comment.replies, response.data] : [response.data] }
                            : comment
                    ));
                } catch (e) {
                    console.error('Error updating replies state:', e);
                    setError('Failed to update comment replies');
                }
            } else {
                setComments(prevComments => [response.data, ...prevComments]);
            }

            setNewComment('');
            setReplyTo(null);
        } catch (error) {
            console.error('Error posting comment:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Failed to post comment');
            }
        }
    };

    const handleDelete = async (commentId, isReply = false) => {
        try {
            setError(null);
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (isReply) {
                setComments(comments.map(comment => ({
                    ...comment,
                    replies: comment.replies.filter(reply => reply.id !== commentId)
                })));
            } else {
                setComments(comments.filter(comment => comment.id !== commentId));
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            setError('Failed to delete comment');
        }
    };

    const handleReply = (commentId) => {
        setReplyTo(commentId);
    };

    const handleCancelReply = () => {
        setReplyTo(null);
    };

    const renderComment = (comment, isReply = false) => (
        <div key={comment.id} className={`comment ${isReply ? 'reply' : ''}`}>
            <div className="comment-header">
                <span className="comment-author">{comment.user.name}</span>
                <span className="comment-date">
                    {new Date(comment.created_at).toLocaleString()}
                </span>
            </div>
            <div className="comment-content">{comment.content}</div>
            <div className="comment-actions">
                {!isReply && (
                    <button
                        onClick={() => handleReply(comment.id)}
                        className="reply-button"
                    >
                        Reply
                    </button>
                )}
                <button
                    onClick={() => handleDelete(comment.id, isReply)}
                    className="delete-button"
                >
                    Delete
                </button>
            </div>
            {comment.replies && comment.replies.length > 0 && (
                <div className="replies">
                    {comment.replies.map(reply => renderComment(reply, true))}
                </div>
            )}
        </div>
    );

    return (
        <div className="comment-section">
            <h3>Comments</h3>
            {error && <div className="comment-error">{error}</div>}
            
            <form onSubmit={handleSubmit} className="comment-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                    className="comment-input"
                />
                <div className="comment-form-actions">
                    {replyTo && (
                        <button
                            type="button"
                            onClick={handleCancelReply}
                            className="cancel-button"
                        >
                            Cancel Reply
                        </button>
                    )}
                    <button type="submit" className="submit-button">
                        {replyTo ? 'Post Reply' : 'Post Comment'}
                    </button>
                </div>
            </form>

            <div className="comments-list">
                {loading ? (
                    <p className="loading">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="no-comments">No comments yet</p>
                ) : (
                    comments.map(comment => renderComment(comment))
                )}
            </div>
        </div>
    );
};

export default CommentSection; 