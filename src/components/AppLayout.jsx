import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Header from './Header';
import MobileNav from './MobileNav';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';

export default function AppLayout({ admin = false }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="app-shell min-h-screen">
      <div className="relative z-10 flex min-h-screen">
        <Sidebar admin={admin} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header admin={admin} onMenuClick={() => setDrawerOpen(true)} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
            <Outlet />
          </main>
        </div>
        <MobileNav admin={admin} />
        <MobileDrawer admin={admin} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
