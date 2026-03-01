import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[260px] flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 p-7 pb-16 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
