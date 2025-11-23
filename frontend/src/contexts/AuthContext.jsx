import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Backend URL (from Vite env)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            return;
        }

        // verify token → GET /user/me
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
            const res = await fetch(`${BACKEND_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                const error = await res.json();
                return error.message;
            }

            const data = await res.json();
            localStorage.setItem("token", data.token);

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
