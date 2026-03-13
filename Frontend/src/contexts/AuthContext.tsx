import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: any;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // SIGNUP
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch("https://interview-backend-vww6.onrender.com/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password
        })
      });

      const data = await res.json();
      alert(data.message);

      if (data.message === "Signup successful") {
        navigate("/auth"); // go to auth page
      }

    } catch (err) {
      console.log(err);
    }
  };

  // LOGIN
  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch("https://interview-backend-vww6.onrender.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await res.json();
      alert(data.message);

      if (data.message === "Login successful") {
        setUser(data.user);
        navigate("/dashboard"); // change if your dashboard route different
      }

    } catch (err) {
      console.log(err);
    }
  };

  // LOGOUT
  const signOut = () => {
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}