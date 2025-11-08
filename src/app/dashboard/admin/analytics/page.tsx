'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { parseISO, format } from "date-fns";

interface AttendanceRecord {
  date: string;
  area: string;
  studentName: string;
  status: string;
}

interface AreaStats {
  area: string;
  present: number;
  absent: number;
}

interface StudentStats {
  studentName: string;
  area: string;
  totalDays: number;
  presentDays: number;
}

const AREAS = ["Swang", "Kathara", "Nawadih", "Pipradih", "Phusro"];
const COLORS = ["#22c55e", "#ef4444"];

export default function AttendanceAnalytics() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [areaStats, setAreaStats] = useState<AreaStats[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [overall, setOverall] = useState({ present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);

  async function fetchAttendance() {
    setLoading(true);
    try {
      const all: AttendanceRecord[] = [];
      for (const area of AREAS) {
        const q = query(collection(db, "areas", area, "attendance"), orderBy("date", "desc"));
        const snap = await getDocs(q);
        snap.docs.forEach((doc) => {
          const data = doc.data();
          const date = data.date;
          (data.records || []).forEach((r: any) =>
            all.push({ date, area, studentName: r.studentName, status: r.status })
          );
        });
      }
      setRecords(all);
      computeStats(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function computeStats(data: AttendanceRecord[]) {
    const areaMap: Record<string, AreaStats> = {};
    const studentMap: Record<string, StudentStats> = {};
    let totalPresent = 0;
    let totalAbsent = 0;

    data.forEach((rec) => {
      if (!areaMap[rec.area]) areaMap[rec.area] = { area: rec.area, present: 0, absent: 0 };
      rec.status === "Present" ? (areaMap[rec.area].present++, totalPresent++) : (areaMap[rec.area].absent++, totalAbsent++);
      const key = `${rec.area}-${rec.studentName}`;
      if (!studentMap[key]) studentMap[key] = { studentName: rec.studentName, area: rec.area, totalDays: 0, presentDays: 0 };
      studentMap[key].totalDays++;
      if (rec.status === "Present") studentMap[key].presentDays++;
    });

    setAreaStats(Object.values(areaMap));
    setStudentStats(Object.values(studentMap));
    setOverall({ present: totalPresent, absent: totalAbsent });
  }

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Analytics");
    XLSX.writeFile(wb, "attendance-analytics.xlsx");
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.text("Attendance Analytics Summary", 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [["Date", "Area", "Student", "Status"]],
      body: records.map((r) => [r.date, r.area, r.studentName, r.status]),
    });
    doc.save("attendance-analytics.pdf");
  }

  useEffect(() => {
    fetchAttendance();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading analytics...</p>;

  const overallData = [
    { name: "Present", value: overall.present },
    { name: "Absent", value: overall.absent },
  ];

  const studentSorted = [...studentStats].sort(
    (a, b) => b.presentDays / b.totalDays - a.presentDays / a.totalDays
  );

  const monthlyData = Object.values(
    records.reduce((acc: any, r) => {
      const month = format(parseISO(r.date), "MMM yyyy");
      if (!acc[month]) acc[month] = { month, present: 0, absent: 0 };
      r.status === "Present" ? acc[month].present++ : acc[month].absent++;
      return acc;
    }, {})
  );

  return (
    <main className="max-w-7xl mx-auto mt-10 bg-white p-6 rounded-lg shadow space-y-10">
      <h1 className="text-2xl font-semibold text-center mb-6">
        Attendance Analytics Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-100 text-green-700 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-lg">Total Records</h3>
          <p className="text-2xl font-bold">{records.length}</p>
        </div>
        <div className="bg-blue-100 text-blue-700 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-lg">Centers</h3>
          <p className="text-2xl font-bold">{areaStats.length}</p>
        </div>
        <div className="bg-orange-100 text-orange-700 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-lg">Total Students</h3>
          <p className="text-2xl font-bold">{studentStats.length}</p>
        </div>
        <div className="bg-purple-100 text-purple-700 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-lg">Attendance Rate</h3>
          <p className="text-2xl font-bold">
            {((overall.present / (overall.present + overall.absent)) * 100 || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-3">
        <Button onClick={exportExcel}>Export Excel</Button>
        <Button onClick={exportPDF}>Export PDF</Button>
      </div>

      {/* Charts */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Center-Wise Attendance</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={areaStats}>
            <XAxis dataKey="area" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#22c55e" name="Present" />
            <Bar dataKey="absent" fill="#ef4444" name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Overall Pie */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Overall Attendance Ratio</h2>
        <div className="flex justify-center">
          <ResponsiveContainer width={300} height={300}>
            <PieChart>
              <Pie data={overallData} cx="50%" cy="50%" outerRadius={120} dataKey="value">
                {overallData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Monthly Trend */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Monthly Attendance Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#16a34a" name="Present" />
            <Bar dataKey="absent" fill="#dc2626" name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Student Leaderboard */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Student Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Student</th>
                <th className="border p-2">Area</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Present</th>
                <th className="border p-2">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {studentSorted.map((s, i) => {
                const percent = ((s.presentDays / s.totalDays) * 100).toFixed(1);
                return (
                  <tr key={i}>
                    <td className="border p-2">{s.studentName}</td>
                    <td className="border p-2">{s.area}</td>
                    <td className="border p-2">{s.totalDays}</td>
                    <td className="border p-2">{s.presentDays}</td>
                    <td className={`border p-2 ${percent < 75 ? "text-red-600" : "text-green-600"}`}>
                      {percent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
