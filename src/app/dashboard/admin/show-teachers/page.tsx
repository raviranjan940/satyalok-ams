'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Teacher {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  gender: string;
  area: string;
  joinDate: string;
  password?: string;
}

const AREAS = ["All", "Swang", "Kathara", "Nawadih", "Pipradih", "Phusro"];

export default function ShowTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState("All");

  async function fetchTeachers() {
    setLoading(true);
    try {
      let q;
      if (selectedArea === "All") {
        q = query(collection(db, "users"), where("role", "==", "teacher"), orderBy("createdAt", "desc"));
      } else {
        q = query(
          collection(db, "areas", selectedArea, "users"),
          where("role", "==", "teacher"),
          orderBy("createdAt", "desc")
        );
      }

      const snap = await getDocs(q);
      const data: Teacher[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Teacher[];
      setTeachers(data);
    } catch (err) {
      console.error("Error fetching teachers:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeachers();
  }, [selectedArea]);

  const togglePassword = (id: string) =>
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));

  const deleteTeacher = async (uid: string, name: string, area: string) => {
    if (!confirm(`Are you sure you want to delete teacher "${name}" from ${area}?`)) return;

    try {
      const res = await fetch("/api/users/delete-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_ADMIN_SECRET || "change-me",
        },
        body: JSON.stringify({ uid, area }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete teacher");

      alert("✅ " + data.message);
      setTeachers((prev) => prev.filter((t) => t.id !== uid));
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  return (
    <main className="max-w-6xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-lg shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">All Teachers</h1>

        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="border p-2 rounded w-full sm:w-auto"
        >
          {AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center">Loading teachers...</p>
      ) : teachers.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">No teachers found for this area.</p>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="min-w-full text-xs sm:text-sm border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Phone</th>
                <th className="border p-2">Gender</th>
                <th className="border p-2">Area</th>
                <th className="border p-2">Join Date</th>
                <th className="border p-2">Password</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="text-center">
                  <td className="border p-2">{t.displayName}</td>
                  <td className="border p-2">{t.email}</td>
                  <td className="border p-2">{t.phone || "-"}</td>
                  <td className="border p-2">{t.gender || "-"}</td>
                  <td className="border p-2">{t.area}</td>
                  <td className="border p-2">{t.joinDate || "-"}</td>
                  <td className="border p-2 flex items-center gap-2 justify-center">
                    <span>{visiblePasswords[t.id] ? t.password || "••••••" : "••••••"}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePassword(t.id)}
                    >
                      {visiblePasswords[t.id] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </td>
                  <td className="border p-2 text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTeacher(t.id, t.displayName, t.area)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
