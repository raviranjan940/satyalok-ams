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
  motherName?: string;
  contact?: string;
  address?: string;
  aadhaar?: string;
  dateOfBirth?: string;
  area: string;
  createdAt?: any;
}

const AREAS = ["All", "Swang", "Kathara", "Nawadih", "Pipradih", "Phusro"];

export default function ShowStudentsAdmin() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState("All");

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [fatherFilter, setFatherFilter] = useState("");
  const [contactFilter, setContactFilter] = useState("");
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sortField, setSortField] = useState<"admissionDate" | "age">("admissionDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  async function fetchStudents() {
    setLoading(true);
    try {
      let docs: Student[] = [];
      if (area === "All") {
        // Global students collection
        const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
      } else {
        // Area scoped students
        const q = query(
          collection(db, "areas", area, "students"),
          orderBy("createdAt", "desc")
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);

  const filtered = students
    .filter((s) => s.name?.toLowerCase().includes(nameFilter.toLowerCase()))
    .filter((s) => (fatherFilter ? (s.fatherName || "").toLowerCase().includes(fatherFilter.toLowerCase()) : true))
    .filter((s) => (contactFilter ? (s.contact || "").includes(contactFilter) : true))
    .filter((s) => {
      if (minAge !== "" && (s.age || 0) < Number(minAge)) return false;
      if (maxAge !== "" && (s.age || 0) > Number(maxAge)) return false;
      return true;
    })
    .filter((s) => {
      if (!startDate || !endDate) return true;
      const d = s.admissionDate ? new Date(s.admissionDate) : null;
      return d ? d >= startDate && d <= endDate : false;
    })
    .sort((a, b) => {
      if (sortField === "age") {
        const aa = a.age || 0, bb = b.age || 0;
        return sortOrder === "asc" ? aa - bb : bb - aa;
      } else {
        const ad = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
        const bd = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
        return sortOrder === "asc" ? ad - bd : bd - ad;
      }
    });

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
      head: [["Name", "Age", "Admission", "Father", "Contact", "Area"]],
      body: filtered.map((s) => [
        s.name,
        s.age ?? "-",
        s.admissionDate ?? "-",
        s.fatherName ?? "-",
        s.contact ?? "-",
        s.area,
      ]),
    });
    doc.save(`students-${area.toLowerCase()}.pdf`);
  }

  return (
    <main className="max-w-6xl mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Show Students</h1>

        <select className="border p-2 rounded" value={area} onChange={(e) => setArea(e.target.value)}>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Input placeholder="Filter by Name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
        <Input placeholder="Filter by Father's Name" value={fatherFilter} onChange={(e) => setFatherFilter(e.target.value)} />
        <Input placeholder="Filter by Contact" value={contactFilter} onChange={(e) => setContactFilter(e.target.value)} />

        <div className="flex gap-2">
          <Input type="number" placeholder="Min Age" value={minAge} onChange={(e) => setMinAge(e.target.value ? Number(e.target.value) : "")} />
          <Input type="number" placeholder="Max Age" value={maxAge} onChange={(e) => setMaxAge(e.target.value ? Number(e.target.value) : "")} />
        </div>

        <div className="flex gap-2">
          <DatePicker selected={startDate} onChange={(d) => setStartDate(d)} placeholderText="Admission Start" className="border p-2 rounded w-full" />
          <DatePicker selected={endDate} onChange={(d) => setEndDate(d)} placeholderText="Admission End" className="border p-2 rounded w-full" />
        </div>

        <div className="flex gap-2">
          <select className="border p-2 rounded w-full" value={sortField} onChange={(e) => setSortField(e.target.value as any)}>
            <option value="admissionDate">Sort by Admission</option>
            <option value="age">Sort by Age</option>
          </select>
          <select className="border p-2 rounded w-full" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={exportExcel}>Export Excel</Button>
        <Button onClick={exportPDF}>Export PDF</Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading students...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No students found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Age</th>
                <th className="border p-2">Admission</th>
                <th className="border p-2">Father</th>
                <th className="border p-2">Contact</th>
                <th className="border p-2">Area</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="border p-2">{s.name}</td>
                  <td className="border p-2">{s.age ?? "-"}</td>
                  <td className="border p-2">{s.admissionDate ?? "-"}</td>
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
