'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase-client";
import { getIdTokenResult } from "firebase/auth";

export default function AddStudentPage() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    admissionDate: "",
    fatherName: "",
    motherName: "",
    contact: "",
    address: "",
    aadhaar: "",
    dateOfBirth: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [area, setArea] = useState("");

  async function getTeacherArea() {
    const user = auth.currentUser;
    if (!user) return "";
    const tokenResult = await getIdTokenResult(user);
    return tokenResult.claims.area || "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const teacherArea = area || (await getTeacherArea());
    if (!teacherArea) {
      setMessage("⚠️ Could not detect teacher area. Please contact admin.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/students/add-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret":
            process.env.NEXT_PUBLIC_INTERNAL_ADMIN_SECRET || "change-me",
        },
        body: JSON.stringify({ ...form, area: teacherArea }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add student");

      setMessage(`✅ ${data.message}`);
      setForm({
        name: "",
        age: "",
        admissionDate: "",
        fatherName: "",
        motherName: "",
        contact: "",
        address: "",
        aadhaar: "",
        dateOfBirth: "",
      });
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <main className="max-w-2xl mx-auto mt-10 bg-white p-4 sm:p-6 rounded-lg shadow">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 text-center sm:text-left">
        Add Student
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Student Name", name: "name", type: "text" },
          { label: "Age", name: "age", type: "number" },
          { label: "Admission Date", name: "admissionDate", type: "date" },
          { label: "Father's Name", name: "fatherName", type: "text" },
          { label: "Mother's Name", name: "motherName", type: "text" },
          { label: "Contact No", name: "contact", type: "text" },
          { label: "Aadhaar No", name: "aadhaar", type: "text" },
          { label: "Date of Birth", name: "dateOfBirth", type: "date" },
        ].map((f) => (
          <div key={f.name}>
            <Label htmlFor={f.name}>{f.label}</Label>
            <Input
              id={f.name}
              name={f.name}
              type={f.type}
              value={(form as any)[f.name]}
              onChange={handleChange}
              required={f.name === "name"}
            />
          </div>
        ))}

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-1 sm:col-span-2 mt-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Student"}
          </Button>
        </div>
      </form>

      {message && (
        <p
          className={`text-sm mt-3 text-center ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </main>
  );
}
