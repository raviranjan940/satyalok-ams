'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Users,
  ClipboardList,
  UserPlus,
  BarChart3,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Add Teacher", href: "/dashboard/admin/add-teacher", icon: UserPlus },
    { name: "Show Teachers", href: "/dashboard/admin/show-teachers", icon: Users },
    { name: "Show Attendance", href: "/dashboard/admin/show-attendance", icon: ClipboardList },
    { name: "Student Data", href: "/dashboard/admin/student-data", icon: ClipboardList },
    { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  ];

  async function handleLogout() {
    await signOut(auth);
    document.cookie = "satyalok_token=; Max-Age=0; path=/;";
    window.location.href = "/auth/login";
  }

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* 🌐 Mobile Header */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b shadow flex items-center justify-between p-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="text-lg font-semibold text-blue-700">SatyalokAMS Admin</h1>
        <button onClick={handleLogout} className="text-red-600 text-sm font-medium">
          Logout
        </button>
      </header>

      {/* 🧭 Sidebar */}
      <aside
        className={`fixed sm:static z-40 bg-white border-r shadow-sm flex flex-col transition-transform duration-300 ease-in-out w-64 h-screen ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        {/* Sidebar Title */}
        <div className="px-4 py-5 border-b text-lg font-semibold text-blue-700 hidden sm:block">
          SatyalokAMS Admin
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition ${
                  active ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" /> {item.name}
              </Link>
            );
          })}
        </nav>

        {/* 🚪 Logout Button (Pinned at Bottom for Desktop) */}
        <div className="hidden sm:block mt-auto border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-4 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* 🌫️ Invisible Click-Area (to close sidebar) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 sm:hidden cursor-pointer"
        />
      )}

      {/* 🧾 Main Content */}
      <main className="flex-1 mt-14 sm:mt-0 p-4 sm:p-6 overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
