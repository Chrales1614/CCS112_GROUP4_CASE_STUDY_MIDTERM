import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './CommentSection.css';

const CommentSection = ({ taskId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchComments();
    }, [taskId]);

    const fetchComments = async () => {
        try {
            const response = await axios.get(`/api/tasks/${taskId}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`/api/tasks/${taskId}/comments`, {
                content: newComment,
                parent_id: replyTo
            });
            setComments([...comments, response.data]);
            setNewComment('');
            setReplyTo(null);
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    const handleReply = (commentId) => {
        setReplyTo(commentId);
    };

    const handleDelete = async (commentId) => {
        try {
            await axios.delete(`/api/comments/${commentId}`);
            setComments(comments.filter(comment => comment.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const renderComment = (comment) => (
        <div key={comment.id} className="comment">
            <div className="comment-header">
                <span className="comment-author">{comment.user.name}</span>
                <span className="comment-date">
                    {new Date(comment.created_at).toLocaleDateString()}
                </span>
            </div>
            <div className="comment-content">{comment.content}</div>
            <div className="comment-actions">
                <button onClick={() => handleReply(comment.id)}>Reply</button>
                {(user.id === comment.user_id || user.isAdmin) && (
                    <button onClick={() => handleDelete(comment.id)}>Delete</button>
                )}
            </div>
            {comment.replies && comment.replies.length > 0 && (
                <div className="replies">
                    {comment.replies.map(reply => renderComment(reply))}
                </div>
            )}
        </div>
    );

    return (
        <div className="comment-section">
            <h3>Comments</h3>
            <form onSubmit={handleSubmit} className="comment-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                    required
                />
                {replyTo && (
                    <button type="button" onClick={() => setReplyTo(null)}>
                        Cancel Reply
                    </button>
                )}
                <button type="submit">Post</button>
            </form>
            <div className="comments-list">
                {comments.map(comment => renderComment(comment))}
            </div>
        </div>
    );
};

export default CommentSection; 