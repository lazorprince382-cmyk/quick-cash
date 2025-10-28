import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/signin";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Invest from "./pages/Invest";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import TransactionHistory from "./pages/TransactionHistory";
import Admin from "./components/Admin";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/invest" element={<Invest />} />
      <Route path="/deposit" element={<Deposit />} />
      <Route path="/withdraw" element={<Withdraw />} />
      <Route path="/history" element={<TransactionHistory />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
};

export default App;
