import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

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
                    navigate("/");
                } else {
                    setError(data.message || "Login failed");
                }
        } catch (error) {
            setError("Server error");
        }
    };

    return (
        <div className="login-container d-flex justify-content-center align-items-center vh-100">
            <div className="login-card shadow-lg p-5 rounded bg-white" style={{ maxWidth: "400px", width: "100%" }}>
                <h2 className="text-center mb-4 text-primary fw-bold">Klick Login</h2>
                <p className="text-center text-muted mb-4">Log in to your account</p>

                {error && (
                    <div className="alert alert-danger text-center" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label htmlFor="email" className="form-label fw-semibold">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-control"
                            aria-label="Email Address"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="form-label fw-semibold">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-control"
                            aria-label="Password"
                        />
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                id="remember"
                                className="form-check-input"
                            />
                            <label
                                htmlFor="remember"
                                className="form-check-label"
                            >
                                Remember me
                            </label>
                        </div>
                        <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none text-primary fw-semibold"
                            onClick={() =>
                                alert("Forgot password functionality not implemented yet")
                            }
                        >
                            Forgot password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-2 fw-semibold"
                    >
                        Login
                    </button>
                </form>

                <div className="text-center text-muted my-4">
                    <span>or</span>
                </div>

                <button
                    onClick={() => navigate("/register")}
                    className="btn btn-outline-secondary w-100 py-2 fw-semibold"
                >
                    Create New Account
                </button>
            </div>
        </div>
    );
};

export default Login;