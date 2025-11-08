'use client';

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase-client";
import { getIdTokenResult } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import DatePicker from "react-datepicker";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "react-datepicker/dist/react-datepicker.css";

interface AttendanceRecord {
  date: string;
  studentName: string;
  status: string;
}

export default function TeacherAttendanceReport() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filtered, setFiltered] = useState<AttendanceRecord[]>([]);
  const [area, setArea] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const tokenResult = await getIdTokenResult(user);
        const teacherArea = tokenResult.claims.area || "";
        setArea(teacherArea);

        const q = query(collection(db, "areas", teacherArea, "attendance"), orderBy("date", "desc"));
        const snap = await getDocs(q);

        const all: AttendanceRecord[] = [];
        snap.docs.forEach((doc) => {
          const data = doc.data();
          const date = data.date;
          (data.records || []).forEach((r: any) =>
            all.push({ date, studentName: r.studentName, status: r.status })
          );
        });

        setRecords(all);
        setFiltered(all);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter by date range
  useEffect(() => {
    if (!startDate && !endDate) {
      setFiltered(records);
    } else {
      setFiltered(
        records.filter((r) => {
          const d = new Date(r.date);
          if (startDate && d < startDate) return false;
          if (endDate && d > endDate) return false;
          return true;
        })
      );
    }
  }, [startDate, endDate, records]);

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance-${area}.xlsx`);
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.text(`Attendance Report (${area})`, 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [["Date", "Student", "Status"]],
      body: filtered.map((r) => [r.date, r.studentName, r.status]),
    });
    doc.save(`attendance-${area}.pdf`);
  }

  if (loading) return <p className="text-center mt-10">Loading attendance...</p>;

  return (
    <main className="max-w-5xl mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-4">Attendance Report ({area})</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <DatePicker
          selected={startDate}
          onChange={(d) => setStartDate(d)}
          placeholderText="Start Date"
          className="border p-2 rounded"
        />
        <DatePicker
          selected={endDate}
          onChange={(d) => setEndDate(d)}
          placeholderText="End Date"
          className="border p-2 rounded"
        />
        <Button onClick={exportExcel}>Export Excel</Button>
        <Button onClick={exportPDF}>Export PDF</Button>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Student</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={i}>
              <td className="border p-2">{r.date}</td>
              <td className="border p-2">{r.studentName}</td>
              <td className={`border p-2 ${r.status === "Absent" ? "text-red-500" : "text-green-600"}`}>
                {r.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
