import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; // Import the styles


const Dashboard = ({ onLogout }) => {
    const navigate = useNavigate();


    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://127.0.0.1:8000/api/logout", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });


            if (response.ok) {
                onLogout();
                navigate("/");
            }
        } catch (error) {
            console.error("Logout failed", error);
        }
    };


    return (
        <div className="dashboard-container">
            <div className="dashboard-card">
                <h2 className="heading">Dashboard</h2>
                <p className="paragraph">Welcome! You are logged in.</p>
                <button className="button" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </div>
    );
};


export default Dashboard;
