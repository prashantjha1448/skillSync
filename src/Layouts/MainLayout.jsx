import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MainLayout = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col w-full">
    <Navbar />
    <main className="flex-1 w-full">
      <Outlet />
    </main>
  </div>
);

export default MainLayout;