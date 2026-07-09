import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');


export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Login failed: ${res.status}`);
      }

      localStorage.setItem("vichaarUser", JSON.stringify(data.user));
      alert(data.message);
      navigate("/portfolio");
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.message || "An error occurred during login. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 animate-fade-in-up">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-md shadow-2xl">
        
        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          Welcome Back
        </h2>
        <p className="text-slate-400 text-center mb-8">
          Enter your username and password to access your portfolio.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
            <input 
              type="text" 
              placeholder="PredictionPro" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-400">Password</label>
              <button 
                type="button" 
                onClick={() => alert("Password reset functionality would send an email here. Please ensure you have added an email in Settings.")}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg transition-colors mt-2"
          >
            Sign In
          </button>
        </form>

        <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-slate-800 after:h-px after:flex-1 after:bg-slate-800">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">or continue with</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            type="button"
            onClick={() => alert("Google OAuth requires Supabase configuration.")}
            className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white py-2.5 rounded-lg transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button 
            type="button"
            onClick={() => alert("X (Twitter) OAuth requires Supabase configuration.")}
            className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white py-2.5 rounded-lg transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            X (Twitter)
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <button 
            onClick={() => navigate("/signup")}
            className="text-green-400 hover:text-green-300 font-semibold transition-colors focus:outline-none"
          >
            Sign up
          </button>
        </div>
        
      </div>
    </div>
  );
}
