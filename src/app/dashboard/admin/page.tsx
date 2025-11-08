'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, UserPlus, Users, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface AreaStats {
  area: string;
  students: number;
  teachers: number;
}

const AREAS = ["Swang", "Kathara", "Nawadih", "Pipradih", "Phusro"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AreaStats[]>([]);

  useEffect(() => {
    async function loadStats() {
      const areaData: AreaStats[] = [];
      for (const area of AREAS) {
        const studentsSnap = await getDocs(collection(db, "areas", area, "students"));
        const teachersSnap = await getDocs(collection(db, "users"));
        areaData.push({
          area,
          students: studentsSnap.size,
          teachers: teachersSnap.docs.filter((d) => d.data().area === area).length,
        });
      }
      setStats(areaData);
    }
    loadStats();
  }, []);

  const cards = [
    {
      title: "Add Teacher",
      desc: "Create new teacher login credentials.",
      icon: <UserPlus className="w-8 h-8 text-blue-600" />,
      href: "/dashboard/admin/add-teacher",
    },
    {
      title: "Show Attendance",
      desc: "View, filter and export attendance records.",
      icon: <ClipboardList className="w-8 h-8 text-green-600" />,
      href: "/dashboard/admin/show-attendance",
    },
    {
      title: "Student Data",
      desc: "Manage and export student information.",
      icon: <Users className="w-8 h-8 text-orange-600" />,
      href: "/dashboard/admin/student-data",
    },
    {
      title: "Analytics",
      desc: "View center-wise and monthly analytics.",
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      href: "/dashboard/admin/analytics",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto mt-10 space-y-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Welcome, Admin 👋
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      {/* Area Summary Chart */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-3">Center Summary</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats}>
            <XAxis dataKey="area" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="students" fill="#60a5fa" name="Students" />
            <Bar dataKey="teachers" fill="#34d399" name="Teachers" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </main>
  );
}
