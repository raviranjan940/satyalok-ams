'use client';

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, UserPlus, ClipboardCheck } from "lucide-react";

export default function TeacherDashboard() {
  const cards = [
    {
      title: "Add Student",
      desc: "Register a new student for attendance.",
      icon: <UserPlus className="w-8 h-8 text-blue-600" />,
      href: "/dashboard/user/add-student",
    },
    {
      title: "Take Attendance",
      desc: "Mark attendance for today's class.",
      icon: <ClipboardCheck className="w-8 h-8 text-green-600" />,
      href: "/dashboard/user/take-attendance",
    },
    {
      title: "Attendance Report",
      desc: "View or export attendance reports.",
      icon: <ClipboardList className="w-8 h-8 text-orange-600" />,
      href: "/dashboard/user/attendance-report",
    },
  ];

  return (
    <main className="max-w-5xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Welcome, Teacher 👋
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <Link href={c.href} key={c.title}>
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="flex flex-col items-center text-center p-6 space-y-3">
                {c.icon}
                <h3 className="font-semibold text-lg">{c.title}</h3>
                <p className="text-sm text-gray-600">{c.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
