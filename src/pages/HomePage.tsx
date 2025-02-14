import { useState, useEffect, useCallback } from "react";
import "./HomePage.css";

interface Message {
    id: number;
    message: string;
    date_save: string;
    likes: number;
}

export default function HomePage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [page, setPage] = useState(1);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState(""); // 🔹 Pour l'inscription
    const [isRegistering, setIsRegistering] = useState(false); // 🔹 Pour alterner entre login et inscription

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);

    const fetchMessages = useCallback(async () => {
        try {
            const response = await fetch(`https://backend-cupidon-express.decian.ddnsfree.com:7565/messages?limit=10&page=${page}`);
            const data = await response.json();
            
            if (!data.messages.length) {
                console.warn("Aucun nouveau message à charger.");
                return;
            }
    
            setMessages((prev) => [...prev, ...data.messages]);
        } catch (error) {
            console.error("Erreur lors de la récupération des messages :", error);
        }
    }, [page]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // 🔹 Inscription utilisateur
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("https://backend-cupidon-express.decian.ddnsfree.com:7565/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            if (data.id) {
                alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
                setIsRegistering(false); // 🔹 Passe à l'écran de connexion
            } else {
                alert("Erreur lors de l'inscription.");
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription :", error);
        }
    };

    // 🔹 Connexion utilisateur
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("https://backend-cupidon-express.decian.ddnsfree.com:7565/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.token) {
                localStorage.setItem("token", data.token);
                setIsAuthenticated(true);
            } else {
                alert("Email ou mot de passe incorrect.");
            }
        } catch (error) {
            console.error("Erreur lors de la connexion :", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
    };

    const handleLike = async (id: number) => {
        if (!isAuthenticated) return;
        try {
            await fetch(`https://backend-cupidon-express.decian.ddnsfree.com:7565/like/${id}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });
            setMessages(messages.map(msg => msg.id === id ? { ...msg, likes: msg.likes + 1 } : msg));
        } catch (error) {
            console.error("Erreur lors du like :", error);
        }
    };

    const handlePostMessage = async () => {
        if (!isAuthenticated || !newMessage.trim()) return;
        try {
            const response = await fetch("https://backend-cupidon-express.decian.ddnsfree.com:7565/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ message: newMessage })
            });
            const data = await response.json();
            setMessages([{ id: data.messageId, message: newMessage, date_save: new Date().toISOString(), likes: 0 }, ...messages]);
            setNewMessage("");
        } catch (error) {
            console.error("Erreur lors de l'envoi du message :", error);
        }
    };

    return (
        <div className="home-container">
            <h1 className="title">Mur des Déclarations 💌</h1>

            {!isAuthenticated ? (
                <div className="auth-container">
                    {isRegistering ? (
                        <form className="auth-box" onSubmit={handleRegister}>
                            <h2>Inscription</h2>
                            <input 
                                type="text" 
                                placeholder="Nom" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input 
                                type="password" 
                                placeholder="Mot de passe" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="auth-button">S'inscrire</button>
                            <p onClick={() => setIsRegistering(false)}>Déjà un compte ? Se connecter</p>
                        </form>
                    ) : (
                        <form className="auth-box" onSubmit={handleLogin}>
                            <h2>Connexion</h2>
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input 
                                type="password" 
                                placeholder="Mot de passe" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="auth-button">Se connecter</button>
                            <p onClick={() => setIsRegistering(true)}>Pas encore inscrit ? Créer un compte</p>
                        </form>
                    )}
                </div>
            ) : (
                <button onClick={handleLogout} className="logout-button">Se déconnecter</button>
            )}

            {isAuthenticated && (
                <div className="message-box">
                    <textarea 
                        className="message-input" 
                        placeholder="Écrivez votre message..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button onClick={handlePostMessage} className="send-button">Envoyer</button>
                </div>
            )}

            <div className="messages-list">
                {messages.map((msg) => (
                    <div key={msg.id} className="message-card">
                        <p className="message-text">{msg.message}</p>
                        <div className="message-footer">
                            <span className="message-date">{new Date(msg.date_save).toLocaleString()}</span>
                            <button onClick={() => handleLike(msg.id)} className={`like-button ${!isAuthenticated ? 'disabled' : ''}`}>
                                ❤️ {msg.likes}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={() => setPage(page + 1)} className="load-more">Voir plus</button>
        </div>
    );
}
