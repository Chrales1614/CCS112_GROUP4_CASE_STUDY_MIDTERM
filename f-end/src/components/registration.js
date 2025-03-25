import { useNavigate } from "react-router-dom";
import "../App.css"; // Or use "./Registration.css" if separate


const Registration = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("team_member");
    const [error, setError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const navigate = useNavigate();


    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
       
        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters long");
        } else {
            setPasswordError("");
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
                body: JSON.stringify({ name, email, password, password_confirmation: confirmPassword, role }),
            });


            const data = await response.json();


            if (response.ok) {
                navigate("/");
            } else {
                setError(data.message || "Registration failed");
            }
        } catch (error) {
            setError("Invalid email or password, already exists");
        }
    };


    return (
        <div className="registration-container">
            <div className="registration-card">
                <h2 className="registration-heading">Register</h2>
                {error && <p className="registration-paragraph" style={{ color: "red" }}>{error}</p>}
                {passwordError && <p className="registration-paragraph" style={{ color: "red" }}>{passwordError}</p>}
                <form onSubmit={handleRegister}>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="registration-input"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="registration-input"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        className="registration-input"
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="registration-input"
                    />
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="registration-select"
                    >
                        <option value="admin">Admin</option>
                        <option value="project_manager">Project Manager</option>
                        <option value="team_member">Team Member</option>
                        <option value="client">Client</option>
                    </select>
                    <button type="submit" className="registration-button">Register</button>
                </form>
                <button onClick={() => navigate("/")} className="registration-button registration-button-secondary">
                    Back to Login
                </button>
            </div>
        </div>
    );
};


export default Registration;