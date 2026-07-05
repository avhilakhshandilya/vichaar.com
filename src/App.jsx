import Signup from "./Pages/Signup";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Components
import Navbar from "./components/layout/Navbar";

// Pages (Updated to use capital 'P')
import Home from "./Pages/Home";
import Leaderboard from "./Pages/Leaderboard";
import Login from "./Pages/Login";
import Portfolio from "./Pages/Portfolio";
import UserProfile from "./Pages/UserProfile";
import Market from "./Pages/Market";
import Admin from "./Pages/Admin";
import Sports from "./Pages/Sports";
import Settings from "./Pages/Settings";
import Rewards from "./Pages/Rewards";
import LiveActivity from "./Pages/LiveActivity";
import Notifications from "./Pages/Notifications";
import MultiEvent from "./Pages/MultiEvent";
import BottomNav from "./components/layout/BottomNav";
import Footer from "./components/layout/Footer";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0e1014] pb-16 md:pb-0 text-white font-sans selection:bg-[#00c853]/30 selection:text-white">
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/user/:username" element={<UserProfile />} />
            <Route path="/market/:market_id" element={<Market />} />
            <Route path="/event/:event_id" element={<MultiEvent />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/live" element={<LiveActivity />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </main>
        <Footer />
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;