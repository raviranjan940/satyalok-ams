'use client';

import { useEffect, useState, useMemo } from "react";
import { db, auth } from "@/lib/firebase-client";
import { getIdTokenResult } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import DatePicker from "react-datepicker";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "react-datepicker/dist/react-datepicker.css";
import { Search, Filter } from "lucide-react";

interface AttendanceRecord {
  date: string;
  studentName: string;
  status: string;
}

interface DailySummary {
  date: string;
  present: number;
  absent: number;
  percent: number;
}

export default function TeacherAttendanceReport() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filtered, setFiltered] = useState<AttendanceRecord[]>([]);
  const [displayed, setDisplayed] = useState<AttendanceRecord[]>([]);
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const [area, setArea] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Present" | "Absent">("All");
  const [loading, setLoading] = useState(true);

  // 🧠 Fetch and Clean Data
  useEffect(() => {
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const tokenResult = await getIdTokenResult(user);
        const teacherArea = (tokenResult.claims?.area as string) || "";
        setArea(teacherArea);

        if (!teacherArea) {
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "areas", teacherArea, "attendance"),
          orderBy("date", "desc")
        );
        const snap = await getDocs(q);

        const all: AttendanceRecord[] = [];
        snap.docs.forEach((doc) => {
          const data = doc.data();
          const date = data.date;
          (data.records || []).forEach((r: any) =>
            all.push({ date, studentName: r.studentName, status: r.status })
          );
        });

        // ✅ Remove Duplicates
        const uniqueMap = new Map<string, AttendanceRecord>();
        all.forEach((rec) => {
          const key = `${rec.date}_${rec.studentName.toLowerCase().trim()}`;
          uniqueMap.set(key, rec);
        });

        const uniqueRecords = Array.from(uniqueMap.values());
        setRecords(uniqueRecords);
        setFiltered(uniqueRecords);
        setDisplayed(uniqueRecords);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🗓️ Date Filter
  useEffect(() => {
    let temp = [...records];
    if (startDate || endDate) {
      temp = temp.filter((r) => {
        const d = new Date(r.date);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    }
    setFiltered(temp);
  }, [startDate, endDate, records]);

  // 🔍 Search + Status Filter
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();

    let result = filtered;

    if (statusFilter !== "All") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (term) {
      result = result.filter((r) =>
        r.studentName.toLowerCase().includes(term)
      );
    }

    setDisplayed(result);
  }, [searchTerm, statusFilter, filtered]);

  // 📈 Summary Stats
  const summary = useMemo(() => {
    const grouped: Record<string, { present: number; absent: number }> = {};
    filtered.forEach((r) => {
      if (!grouped[r.date]) grouped[r.date] = { present: 0, absent: 0 };
      r.status === "Present"
        ? grouped[r.date].present++
        : grouped[r.date].absent++;
    });

    const dailySummary = Object.entries(grouped).map(([date, { present, absent }]) => ({
      date,
      present,
      absent,
      percent: present + absent > 0 ? Math.round((present / (present + absent)) * 100) : 0,
    }));

    const totalDays = dailySummary.length;
    const totalPresent = filtered.filter((r) => r.status === "Present").length;
    const totalAbsent = filtered.filter((r) => r.status === "Absent").length;
    const avgPercent =
      totalDays > 0
        ? Math.round(
            dailySummary.reduce((sum, d) => sum + d.percent, 0) / totalDays
          )
        : 0;

    return { totalDays, totalPresent, totalAbsent, avgPercent };
  }, [filtered]);

  // 📤 Export Functions
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(displayed);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance-${area}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Attendance Report (${area})`, 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [["Date", "Student", "Status"]],
      body: displayed.map((r) => [r.date, r.studentName, r.status]),
    });
    doc.save(`attendance-${area}.pdf`);
  };

  if (loading)
    return <p className="text-center mt-10">Loading attendance...</p>;

  return (
    <main className="max-w-6xl mx-auto mt-10 bg-white p-4 sm:p-6 rounded-lg shadow space-y-8">
      <h1 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">
        📘 Attendance Report {area ? `(${area})` : ""}
      </h1>

      {/* 🧾 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-blue-100 text-blue-700 rounded-lg p-3">
          <h3 className="text-sm font-medium">Total Days</h3>
          <p className="text-2xl font-bold">{summary.totalDays}</p>
        </div>
        <div className="bg-green-100 text-green-700 rounded-lg p-3">
          <h3 className="text-sm font-medium">Total Present</h3>
          <p className="text-2xl font-bold">{summary.totalPresent}</p>
        </div>
        <div className="bg-red-100 text-red-700 rounded-lg p-3">
          <h3 className="text-sm font-medium">Total Absent</h3>
          <p className="text-2xl font-bold">{summary.totalAbsent}</p>
        </div>
        <div className="bg-purple-100 text-purple-700 rounded-lg p-3">
          <h3 className="text-sm font-medium">Avg Attendance</h3>
          <p className="text-2xl font-bold">{summary.avgPercent}%</p>
        </div>
      </div>

      {/* 🗓️ Filters, Search & Status */}
      <div className="flex flex-wrap gap-3 mb-4 justify-center sm:justify-between items-center">
        <div className="flex flex-wrap gap-2 items-center">
          <DatePicker
            selected={startDate}
            onChange={(d) => setStartDate(d)}
            placeholderText="Start Date"
            className="border p-2 rounded text-sm"
          />
          <DatePicker
            selected={endDate}
            onChange={(d) => setEndDate(d)}
            placeholderText="End Date"
            className="border p-2 rounded text-sm"
          />
        </div>

        {/* 🔍 Search Bar */}
        <div className="flex items-center border rounded px-2 py-1 bg-gray-50">
          <Search className="w-4 h-4 text-gray-500 mr-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student..."
            className="outline-none bg-transparent text-sm"
          />
        </div>

        {/* 🧭 Status Filter */}
        <div className="flex items-center border rounded px-2 py-1 bg-gray-50">
          <Filter className="w-4 h-4 text-gray-500 mr-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-transparent outline-none text-sm"
          >
            <option value="All">All</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button onClick={exportExcel}>Export Excel</Button>
          <Button onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>

      {/* 🧮 Detailed Table */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="min-w-full text-xs sm:text-sm border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Student</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length > 0 ? (
              displayed.map((r, i) => (
                <tr key={i}>
                  <td className="border p-2">{r.date}</td>
                  <td className="border p-2">{r.studentName}</td>
                  <td
                    className={`border p-2 ${
                      r.status === "Absent"
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {r.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="border p-3 text-center text-gray-500">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
