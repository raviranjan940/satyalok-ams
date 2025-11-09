'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddTeacherPage() {
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    joinDate: "",
    area: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/users/create-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_ADMIN_SECRET || "",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create teacher");

      setMessage(`✅ ${data.message}`);
      setForm({
        displayName: "",
        email: "",
        password: "",
        phone: "",
        gender: "",
        joinDate: "",
        area: "",
      });
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto mt-6 bg-white p-4 sm:p-6 rounded-xl shadow-md">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 text-center sm:text-left">
        Add Teacher
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="displayName">Full Name</Label>
          <Input id="displayName" name="displayName" value={form.displayName} onChange={handleChange} required />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="phone">Phone No.</Label>
          <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="gender">Gender</Label>
          <select id="gender" name="gender" value={form.gender} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="area">Area Center</Label>
          <select id="area" name="area" value={form.area} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="">Select Area</option>
            <option value="Swang">Swang</option>
            <option value="Kathara">Kathara</option>
            <option value="Nawadih">Nawadih</option>
            <option value="Pipradih">Pipradih</option>
            <option value="Phusro">Phusro</option>
          </select>
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="joinDate">Join Date</Label>
          <Input id="joinDate" name="joinDate" type="date" value={form.joinDate} onChange={handleChange} />
        </div>

        <div className="col-span-1 sm:col-span-2 mt-2">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Add Teacher"}
          </Button>
          {message && (
            <p className={`text-center mt-2 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
