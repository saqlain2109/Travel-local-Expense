import React, { useRef, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { gsap } from 'gsap';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Layout from './layouts/Layout';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewExpenseClaim from './pages/NewExpenseClaim';
import NewTravelRequest from './pages/NewTravelRequest';
import ClaimDetails from './pages/ClaimDetails';
import EmployeeManagement from './pages/EmployeeManagement';
import Tasks from './pages/Tasks';
import { AuthProvider } from './context/AuthContext';
import ClaimsHistory from './pages/ClaimsHistory';


// Placeholder setup
const Settings = () => <div className="text-2xl font-bold">Settings Page (Coming Soon)</div>

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* User Routes */}
                    <Route element={<Layout role="user" />}>
                        <Route path="/dashboard" element={<UserDashboard />} />
                        <Route path="/submit-claim" element={<NewExpenseClaim />} />
                        <Route path="/submit-request" element={<NewTravelRequest />} />
                        <Route path="/claim/:id" element={<ClaimDetails />} />
                        <Route path="/claims" element={<ClaimsHistory />} />
                        <Route path="/history" element={<ClaimsHistory />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route element={<Layout role="admin" />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/employees" element={<EmployeeManagement />} />
                        <Route path="/claim/:id" element={<ClaimDetails />} />
                        <Route path="/history" element={<ClaimsHistory />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider >
    );
}

export default App;
