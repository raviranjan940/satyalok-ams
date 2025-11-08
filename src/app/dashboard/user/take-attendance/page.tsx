'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { db, auth } from "@/lib/firebase-client";
import { getIdTokenResult } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

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
  const [area, setArea] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    (async () => {
      try {
        // Get teacher area from token
        const user = auth.currentUser;
        if (!user) {
          setMessage("⚠️ Not logged in.");
          setLoading(false);
          return;
        }
        const tokenResult = await getIdTokenResult(user);
        const claimArea = (tokenResult.claims.area as string) || "";

        if (!claimArea) {
          setMessage("⚠️ Area not assigned. Contact admin.");
          setLoading(false);
          return;
        }

        setArea(claimArea);

        // Load students from the teacher's area
        const snap = await getDocs(collection(db, "areas", claimArea, "students"));
        const list = snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) || "-" }));
        setStudents(list);

        // Default all to Present
        const defaults: Record<string, boolean> = {};
        list.forEach((s) => (defaults[s.id] = true));
        setAttendance(defaults);

        // Check if today's attendance already exists
        const attendDocRef = doc(db, "areas", claimArea, "attendance", today);
        const attendDoc = await getDoc(attendDocRef);
        if (attendDoc.exists()) {
          setAlreadyTaken(true);
          setMessage(`⚠️ Attendance already submitted for ${today}.`);
        }
      } catch (e) {
        console.error(e);
        setMessage("❌ Failed to load students.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id: string) => {
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setAll = (value: boolean) => {
    const map: Record<string, boolean> = {};
    students.forEach((s) => (map[s.id] = value));
    setAttendance(map);
  };

  const submit = async () => {
    if (!area) return;
    if (alreadyTaken) {
      setMessage("⚠️ Attendance already submitted.");
      return;
    }
    setMessage("");

    try {
      const records: RecordItem[] = students.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        status: attendance[s.id] ? "Present" : "Absent",
      }));

      // Save under area-by-date
      await setDoc(doc(db, "areas", area, "attendance", today), {
        date: today,
        area,
        records,
        createdAt: new Date(),
      });

      // Optional global mirror (if you want)
      // await setDoc(doc(db, "attendance", `${area}_${today}`), { date: today, area, records });

      setAlreadyTaken(true);
      setMessage("✅ Attendance submitted.");
    } catch (e) {
      console.error(e);
      setMessage("❌ Failed to submit attendance.");
    }
  };

  if (loading) {
    return <div className="text-center mt-10 text-gray-500">Loading...</div>;
  }

  return (
    <main className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-4">Take Attendance ({area})</h1>

      {alreadyTaken && (
        <p className="text-center text-yellow-700 mb-3">
          ⚠️ Attendance for {today} already submitted.
        </p>
      )}

      <div className="flex gap-2 mb-4">
        <Button variant="secondary" onClick={() => setAll(true)}>Mark All Present</Button>
        <Button variant="secondary" onClick={() => setAll(false)}>Mark All Absent</Button>
        <Button className="ml-auto" disabled={alreadyTaken || students.length === 0} onClick={submit}>
          {alreadyTaken ? "Already Submitted" : "Submit Attendance"}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {students.map((s) => (
          <div key={s.id} className="flex items-center justify-between border rounded p-2">
            <span>{s.name}</span>
            <Button
              variant={attendance[s.id] ? "default" : "secondary"}
              onClick={() => toggle(s.id)}
            >
              {attendance[s.id] ? "Present" : "Absent"}
            </Button>
          </div>
        ))}
      </div>

      {message && (
        <p className={`mt-3 text-center ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </main>
  );
}
