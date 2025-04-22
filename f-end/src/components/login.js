import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; // Import global styles
import "../AUTH.CSS"; // Import auth-specific styles

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://127.0.0.1:8000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data.token);
                navigate("/dashboard");
            } else {
                setError(data.message || "Login failed");
            }
        } catch (error) {
            setError("Server error");
        }
    };

    return (
        <div className="login-container">
            <div className="auth-card">
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Log in to your account</p>
                
                {error && <div className="auth-error">{error}</div>}
                
                <form className="auth-form" onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="auth-input"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="auth-input"
                    />
                    
                    <div className="d-flex justify-content-between">
                        <div className="login-remember">
                            <input type="checkbox" id="remember" />
                            <label htmlFor="remember">Remember me</label>
                        </div>
                        <div className="login-forgot">
                            <a href="#" className="auth-link">Forgot password?</a>
                        </div>
                    </div>
                    
                    <button type="submit" className="auth-button">
                        Login
                    </button>
                </form>
                
                <div className="auth-divider">or</div>
                
                <button
                    onClick={() => navigate("/register")}
                    className="auth-button auth-button-secondary"
                >
                    Create New Account
                </button>
            </div>
        </div>
    );
};

export default Login;