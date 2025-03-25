import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; // Import the styles


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
            <div className="card">
                <h2 className="heading">Login</h2>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="input"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="input"
                    />
                    <button type="submit" className="button">
                        Login
                    </button>
                </form>
                <button
                    onClick={() => navigate("/register")}
                    className="button secondary"
                >
                    Go to Register
                </button>
            </div>
        </div>
    );
};


export default Login;
