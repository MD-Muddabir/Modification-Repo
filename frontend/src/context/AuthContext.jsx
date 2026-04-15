import { createContext, useState, useEffect } from "react";
import { loginUser } from "../services/auth.service";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setIsInitializing(false);
        return;
      }
      try {
        const { getProfile } = await import("../services/auth.service");
        const res = await getProfile();
        if (res.data && res.data.success) {
           const userData = res.data.user;
           let isExpired = false;
           
           const subEnd = userData.subscription_end || userData.Institute?.subscription_end;
           if (subEnd) {
               const end = new Date(subEnd);
               end.setHours(23, 59, 59, 999);
               if (new Date() > end) isExpired = true;
           }
           
           sessionStorage.setItem("isPlanExpired", isExpired ? "true" : "false");
           userData.isPlanExpired = isExpired;
           setUser(userData);
        } else {
           logout();
        }
      } catch (err) {
        console.error("Session verification failed:", err.message);
        logout();
      } finally {
        setIsInitializing(false);
      }
    };
    
    verifySession();
  }, []);

  const login = async (data) => {
    const response = await loginUser(data);

    const { token, user } = response.data;

    let isExpired = false;
    if (user.subscription_end) {
        const end = new Date(user.subscription_end);
        end.setHours(23, 59, 59, 999);
        if (new Date() > end) isExpired = true;
    }
    
    user.isPlanExpired = isExpired;

    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("isPlanExpired", isExpired ? "true" : "false");

    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};
