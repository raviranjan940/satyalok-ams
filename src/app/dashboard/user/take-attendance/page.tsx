'use client';

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { db, auth } from "@/lib/firebase-client";
import { getIdTokenResult } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Users } from "lucide-react";

interface Student {
  id: string;
  name: string;
}

interface RecordItem {
  studentId: string;
  studentName: string;
  status: "Present" | "Absent";
}

export default function TakeAttendancePage() {
  const [area, setArea] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // 🧠 Load area, students, and check for duplicate attendance
  useEffect(() => {
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setMessage("⚠️ User not logged in.");
          setLoading(false);
          return;
        }

        const tokenResult = await getIdTokenResult(user);
        const claimArea = (tokenResult.claims.area as string) || "";
        if (!claimArea) {
          setMessage("⚠️ Area not assigned. Please contact admin.");
          setLoading(false);
          return;
        }

        setArea(claimArea);

        // Load students in the teacher's area
        const studentSnap = await getDocs(collection(db, "areas", claimArea, "students"));
        if (studentSnap.empty) {
          setMessage("⚠️ No students found in your center.");
          setLoading(false);
          return;
        }

        const list = studentSnap.docs.map((d) => ({
          id: d.id,
          name: (d.data().name as string) || "-",
        }));
        setStudents(list);

        // Default all to Present
        const defaults: Record<string, boolean> = {};
        list.forEach((s) => (defaults[s.id] = true));
        setAttendance(defaults);

        // Check attendance duplicacy
        const attendanceDocRef = doc(db, "areas", claimArea, "attendance", today);
        const attendanceDoc = await getDoc(attendanceDocRef);
        if (attendanceDoc.exists()) {
          setAlreadyTaken(true);
          setMessage(`✅ Attendance already submitted for ${today}.`);
        }
      } catch (e) {
        console.error(e);
        setMessage("❌ Failed to load data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id: string) =>
    !alreadyTaken &&
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));

  const setAll = (value: boolean) => {
    if (alreadyTaken) return;
    const map: Record<string, boolean> = {};
    students.forEach((s) => (map[s.id] = value));
    setAttendance(map);
  };

  const { presentCount, absentCount, percent } = useMemo(() => {
    const total = students.length || 0;
    const present = students.reduce((acc, s) => acc + (attendance[s.id] ? 1 : 0), 0);
    const absent = total - present;
    const pct = total ? Math.round((present / total) * 100) : 0;
    return { presentCount: present, absentCount: absent, percent: pct };
  }, [students, attendance]);

  // 🧾 Submit attendance safely (no duplicates)
  const submit = async () => {
    if (!area || alreadyTaken) return;
    if (!confirm("Are you sure you want to submit today’s attendance?"))
      return;

    try {
      // Double-check Firestore (prevent race condition)
      const attendanceDocRef = doc(db, "areas", area, "attendance", today);
      const existing = await getDoc(attendanceDocRef);
      if (existing.exists()) {
        setAlreadyTaken(true);
        setMessage("⚠️ Attendance already submitted earlier.");
        return;
      }

      const records: RecordItem[] = students.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        status: attendance[s.id] ? "Present" : "Absent",
      }));

      await setDoc(attendanceDocRef, {
        date: today,
        area,
        records,
        createdAt: serverTimestamp(),
      });

      setAlreadyTaken(true);
      setMessage("✅ Attendance submitted successfully!");
    } catch (e) {
      console.error(e);
      setMessage("❌ Failed to submit attendance. Please try again.");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500">
        <Users className="w-10 h-10 animate-pulse mb-2" />
        Loading teacher area & students...
      </div>
    );

  return (
    <main className="max-w-3xl mx-auto mt-10 bg-white p-4 sm:p-6 rounded-2xl shadow-md transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <h1 className="text-2xl font-semibold text-gray-800 text-center sm:text-left">
          Take Attendance
        </h1>

        <div className="flex flex-col sm:flex-row gap-2 items-center text-sm">
          <span
            className={`px-3 py-1 rounded-full ${
              area
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 animate-pulse"
            }`}
          >
            📍 {area ? `Your Center: ${area}` : "Detecting area..."}
          </span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
            📅 {today}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center sm:justify-start mb-4">
        <Button
          variant="secondary"
          onClick={() => setAll(true)}
          disabled={alreadyTaken}
          className="hover:bg-green-50 hover:text-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          ✅ Mark All Present
        </Button>
        <Button
          variant="secondary"
          onClick={() => setAll(false)}
          disabled={alreadyTaken}
          className="hover:bg-red-50 hover:text-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          ❌ Mark All Absent
        </Button>
        <Button
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={alreadyTaken || students.length === 0}
          onClick={submit}
        >
          {alreadyTaken ? "Attendance Completed" : "Submit Attendance"}
        </Button>
      </div>

      {/* Student List */}
      {students.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No students found in your assigned center.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <AnimatePresence>
            <div className="space-y-2 sm:space-y-3">
              {students.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center justify-between border rounded-lg p-3 shadow-sm transition ${
                    attendance[s.id]
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <span className="font-medium text-gray-800 text-sm sm:text-base">
                    {i + 1}. {s.name}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => toggle(s.id)}
                    size="sm"
                    disabled={alreadyTaken}
                    className={`transition flex items-center gap-1 ${
                      attendance[s.id]
                        ? "border-green-500 text-green-600 hover:bg-green-100"
                        : "border-red-500 text-red-600 hover:bg-red-100"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {attendance[s.id] ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Present
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" /> Absent
                      </>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      )}

      {/* Summary Card */}
      <section className="mt-6">
        <div className="rounded-xl border bg-gray-50 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Attendance Summary
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg border p-3">
              <div className="text-xs text-gray-500">Present</div>
              <div className="text-lg font-bold text-green-600">{presentCount}</div>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <div className="text-xs text-gray-500">Absent</div>
              <div className="text-lg font-bold text-red-600">{absentCount}</div>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <div className="text-xs text-gray-500">Attendance %</div>
              <div
                className={`text-lg font-bold ${
                  percent < 75 ? "text-red-600" : "text-green-600"
                }`}
              >
                {percent}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  percent < 75 ? "bg-red-500" : "bg-green-500"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Message */}
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-5 text-center text-sm font-medium ${
            message.startsWith("✅")
              ? "text-green-600"
              : message.startsWith("⚠️")
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {message}
        </motion.p>
      )}
    </main>
  );
}
