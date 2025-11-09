'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Student {
  id: string;
  name: string;
  age?: number;
  admissionDate?: string;
  fatherName?: string;
  contact?: string;
  area: string;
}

const AREAS = ["All", "Swang", "Kathara", "Nawadih", "Pipradih", "Phusro"];

export default function ShowStudentsAdmin() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState("All");
  const [search, setSearch] = useState("");

  async function fetchStudents() {
    setLoading(true);
    try {
      let docs: Student[] = [];
      if (area === "All") {
        const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
      } else {
        const q = query(collection(db, "areas", area, "students"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
      }
      setStudents(docs);
    } catch (e) {
      console.error("Error fetching students:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, [area]);

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `students-${area.toLowerCase()}.xlsx`);
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.text(`Students (${area})`, 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [["Name", "Age", "Father", "Contact", "Area"]],
      body: filtered.map((s) => [
        s.name,
        s.age ?? "-",
        s.fatherName ?? "-",
        s.contact ?? "-",
        s.area,
      ]),
    });
    doc.save(`students-${area.toLowerCase()}.pdf`);
  }

  return (
    <main className="max-w-6xl mx-auto mt-10 bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">Student Data</h1>
        <select
          className="border p-2 rounded w-full sm:w-auto"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportExcel}>Export Excel</Button>
        <Button onClick={exportPDF}>Export PDF</Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading students...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center">No students found.</p>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="min-w-full text-xs sm:text-sm border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Age</th>
                <th className="border p-2">Father</th>
                <th className="border p-2">Contact</th>
                <th className="border p-2">Area</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="text-center">
                  <td className="border p-2">{s.name}</td>
                  <td className="border p-2">{s.age ?? "-"}</td>
                  <td className="border p-2">{s.fatherName ?? "-"}</td>
                  <td className="border p-2">{s.contact ?? "-"}</td>
                  <td className="border p-2">{s.area}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
