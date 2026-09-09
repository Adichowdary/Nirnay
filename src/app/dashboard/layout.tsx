import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { SessionTimeoutWarning } from "@/components/shell/SessionTimeoutWarning";
import { LiveActivityTicker } from "@/components/shared/LiveActivityTicker";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-app">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
        >
          {children}
        </main>
      </div>
      <SessionTimeoutWarning />
      <LiveActivityTicker />
    </div>
  );
}
