'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ClipboardCheck, UserPlus, ClipboardList } from "lucide-react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Add Student", href: "/dashboard/user/add-student", icon: UserPlus },
    { name: "Take Attendance", href: "/dashboard/user/take-attendance", icon: ClipboardCheck },
    { name: "Attendance Report", href: "/dashboard/user/attendance-report", icon: ClipboardList },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="px-4 py-5 border-b text-lg font-semibold text-blue-700">
          SatyalokAMS Teacher
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
        <div className="border-t p-4 text-sm text-gray-500 flex items-center gap-2 cursor-pointer hover:text-red-600">
          <LogOut className="w-4 h-4" /> Logout
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
