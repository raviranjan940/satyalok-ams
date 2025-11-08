export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow text-gray-700 leading-relaxed">
      <h1 className="text-2xl font-bold mb-4">Terms & Conditions</h1>
      <p className="mb-3">
        Welcome to SatyalokAMS. By using this platform, you agree to follow our
        policies and use the system responsibly for educational and attendance
        management purposes.
      </p>
      <p className="mb-3">
        The data collected (students, teachers, and attendance records) is
        securely stored and used only for official NGO purposes.
      </p>
      <p>
        © {new Date().getFullYear()} Satyalok: A New Hope. All rights reserved.
      </p>
    </main>
  );
}
