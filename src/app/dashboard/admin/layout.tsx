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
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="px-4 py-5 border-b text-lg font-semibold text-blue-700">
          SatyalokAMS Admin
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition ${
                  active ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" /> {item.name}
              </Link>
            );
          })}
        </nav>

        <div
          onClick={handleLogout}
          className="border-t p-4 text-sm text-gray-500 flex items-center gap-2 cursor-pointer hover:text-red-600"
        >
          <LogOut className="w-4 h-4" /> Logout
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
