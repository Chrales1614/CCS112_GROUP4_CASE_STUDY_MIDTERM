import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; // Import global styles
import "../AUTH.CSS"; // Import auth-specific styles

const Registration = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("team_member");
    const [error, setError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState("");
    const navigate = useNavigate();

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        
        // Evaluate password strength
        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters long");
            setPasswordStrength("weak");
        } else if (newPassword.length >= 8 && 
                 (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /[0-9]/.test(newPassword))) {
            setPasswordError("");
            setPasswordStrength("strong");
        } else if (newPassword.length >= 8) {
            setPasswordError("");
            setPasswordStrength("medium");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    password, 
                    password_confirmation: confirmPassword, 
                    role 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                navigate("/");
            } else {
                setError(data.message || "Registration failed");
            }
        } catch (error) {
            setError("Registration failed. Please try again.");
        }
    };

    return (
        <div className="registration-container">
            <div className="auth-card">
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Join our team management platform</p>
                
                {error && <div className="auth-error">{error}</div>}
                
                <form className="auth-form" onSubmit={handleRegister}>
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="auth-input"
                    />
                    
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="auth-input"
                    />
                    
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            className="auth-input"
                        />
                        
                        {passwordStrength && (
                            <div className="password-strength">
                                <div className={`password-strength-meter strength-${passwordStrength}`}></div>
                            </div>
                        )}
                        
                        {passwordError && <div className="auth-error">{passwordError}</div>}
                        
                        <p className="password-requirements">
                            Password must be at least 8 characters
                        </p>
                    </div>
                    
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="auth-input"
                    />
                    
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="auth-select"
                    >
                        <option value="admin">Admin</option>
                        <option value="project_manager">Project Manager</option>
                        <option value="team_member">Team Member</option>
                        <option value="client">Client</option>
                    </select>
                    
                    <div className="registration-terms">
                        <input type="checkbox" id="terms" required />
                        <label htmlFor="terms">
                            I agree to the Terms of Service and Privacy Policy
                        </label>
                    </div>
                    
                    <button type="submit" className="auth-button">
                        Create Account
                    </button>
                </form>
                
                <div className="auth-divider">or</div>
                
                <button 
                    onClick={() => navigate("/")} 
                    className="auth-button auth-button-secondary"
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
};

export default Registration;