"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const goToLogin = () => {
    router.push("/auth/login"); // ✅ client-side navigation
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Welcome to SatyalokAMS</h1>
      <p className="text-gray-600 mt-2">
        Please{" "}
        <button
          onClick={goToLogin}
          className="text-blue-600 underline hover:text-blue-800"
        >
          login
        </button>{" "}
        to continue.
      </p>
    </main>
  );
}
