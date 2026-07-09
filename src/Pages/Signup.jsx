import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');


function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup(e) {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          display_name: displayName,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Signup failed: ${res.status}`);
      }

      alert(data.message);

      if (data.success) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      alert(error.message || "An error occurred during signup. Please try again.");
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-950 text-white">
      <form
        onSubmit={handleSignup}
        className="bg-slate-900 p-8 rounded-xl w-96 space-y-4"
      >
        <h1 className="text-3xl font-bold text-center">Create Account</h1>

        <input
          className="w-full p-3 rounded bg-slate-800"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="w-full p-3 rounded bg-slate-800"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 rounded bg-slate-800"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

          <button 
            type="submit" 
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg transition-colors mt-2"
          >
            Create Account
          </button>
        <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-slate-800 after:h-px after:flex-1 after:bg-slate-800">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">or sign up with</span>
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
          Already have an account?{" "}
          <button 
            onClick={() => navigate("/login")}
            className="text-green-400 hover:text-green-300 font-semibold transition-colors focus:outline-none"
          >
            Log in
          </button>
        </div>
      </form>
    </div>
  );
}

export default Signup;
