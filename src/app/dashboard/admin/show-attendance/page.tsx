'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePicker from "react-datepicker";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "react-datepicker/dist/react-datepicker.css";

interface AttendanceRecord {
  date: string;
  area: string;
  studentName: string;
  status: string;
}

const AREAS = ["All", "Swang", "Kathara", "Nawadih", "Pipradih", "Phusro"];

export default function AdminAttendanceReport() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filtered, setFiltered] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState("All");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  async function fetchAttendance() {
    setLoading(true);
    try {
      const areasToFetch = selectedArea === "All" ? AREAS.slice(1) : [selectedArea];
      const all: AttendanceRecord[] = [];

      for (const area of areasToFetch) {
        const q = query(collection(db, "areas", area, "attendance"), orderBy("date", "desc"));
        const snap = await getDocs(q);
        snap.docs.forEach((doc) => {
          const data = doc.data();
          const date = data.date;
          (data.records || []).forEach((r: any) => {
            all.push({ date, area, studentName: r.studentName, status: r.status });
          });
        });
      }

      setRecords(all);
      setFiltered(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAttendance();
  }, [selectedArea]);

  useEffect(() => {
    let filteredData = [...records];
    if (search)
      filteredData = filteredData.filter((r) =>
        r.studentName.toLowerCase().includes(search.toLowerCase())
      );
    if (startDate || endDate) {
      filteredData = filteredData.filter((r) => {
        const d = new Date(r.date);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    }
    setFiltered(filteredData);
  }, [records, search, startDate, endDate]);

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance-${selectedArea}.xlsx`);
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.text(`Attendance Report (${selectedArea})`, 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [["Date", "Area", "Student", "Status"]],
      body: filtered.map((r) => [r.date, r.area, r.studentName, r.status]),
    });
    doc.save(`attendance-${selectedArea}.pdf`);
  }

  if (loading) return <p className="text-center mt-10">Loading attendance...</p>;

  return (
    <main className="max-w-6xl mx-auto mt-10 bg-white p-4 sm:p-6 rounded-lg shadow">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 text-center sm:text-left">
        Attendance Reports
      </h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="border p-2 rounded w-full sm:w-auto"
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
        >
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <Input
          placeholder="Search student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />

        <DatePicker
          selected={startDate}
          onChange={(d) => setStartDate(d)}
          placeholderText="Start Date"
          className="border p-2 rounded w-full sm:w-auto"
        />
        <DatePicker
          selected={endDate}
          onChange={(d) => setEndDate(d)}
          placeholderText="End Date"
          className="border p-2 rounded w-full sm:w-auto"
        />

        <Button onClick={exportExcel}>Export Excel</Button>
        <Button onClick={exportPDF}>Export PDF</Button>
      </div>

      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="min-w-full text-xs sm:text-sm border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Area</th>
              <th className="border p-2">Student</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="text-center">
                <td className="border p-2">{r.date}</td>
                <td className="border p-2">{r.area}</td>
                <td className="border p-2">{r.studentName}</td>
                <td
                  className={`border p-2 ${
                    r.status === "Absent" ? "text-red-500" : "text-green-600"
                  }`}
                >
                  {r.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
