import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown on desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      <main className="lg:ml-[260px] flex flex-1 flex-col min-h-screen w-full">
        <Topbar
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          showMenuButton
        />
        <div className="flex-1 p-4 sm:p-7 pb-16 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
