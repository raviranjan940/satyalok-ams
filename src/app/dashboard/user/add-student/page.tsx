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

  // 🧠 Automatically detect area from logged-in teacher
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
    <main className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-4">Add Student</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Student Name</Label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="age">Age</Label>
          <Input id="age" name="age" value={form.age} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="admissionDate">Admission Date</Label>
          <Input id="admissionDate" name="admissionDate" type="date" value={form.admissionDate} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="fatherName">Father's Name</Label>
          <Input id="fatherName" name="fatherName" value={form.fatherName} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="motherName">Mother's Name</Label>
          <Input id="motherName" name="motherName" value={form.motherName} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="contact">Contact No</Label>
          <Input id="contact" name="contact" value={form.contact} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="aadhaar">Aadhaar No</Label>
          <Input id="aadhaar" name="aadhaar" value={form.aadhaar} onChange={handleChange} />
        </div>

        <div className="col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" value={form.address} onChange={handleChange} />
        </div>

        <div className="col-span-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
        </div>

        <div className="col-span-2 mt-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Student"}
          </Button>
        </div>

        {message && (
          <p
            className={`text-sm mt-2 col-span-2 text-center ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </main>
  );
}
