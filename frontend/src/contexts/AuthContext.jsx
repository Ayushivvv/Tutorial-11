import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Backend URL
const BACKEND_URL = "https://backend-production-d4d93.up.railway.app" || "http://localhost:8080";

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            return;
        }

        // GET /user/me
        const fetchUser = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/user/me`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    localStorage.removeItem("token");
                    setUser(null);
                    return;
                }

                const data = await res.json();
                setUser(data.user);
            } catch (err) {
                localStorage.removeItem("token");
                setUser(null);
            }
        };

        fetchUser();
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    const login = async (username, password) => {
        try {
            // debug
            console.log("login called");

            const res = await fetch(`${BACKEND_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            // debug 
            console.log("login fetching");

            if (!res.ok) {
                const error = await res.json();
                return error.message;
            }

            // debug 
            console.log("login success");

            const data = await res.json();

            // debug 
            console.log("token storing");

            localStorage.setItem("token", data.token);

            // debug 
            console.log("fetching user");

            // fetch updated user
            const me = await fetch(`${BACKEND_URL}/user/me`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${data.token}`
                }
            });

            const meData = await me.json();
            setUser(meData.user);

            navigate("/profile");
            return "";
        } catch (err) {
            return "Network error.";
        }
    };

    const register = async (userData) => {
        try {
            const res = await fetch(`${BACKEND_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            if (!res.ok) {
                const error = await res.json();
                return error.message;
            }

            navigate("/success");
            return "";
        } catch (err) {
            return "Network error.";
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
