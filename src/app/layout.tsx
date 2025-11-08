import "../styles/globals.css";
import Footer from "../components/layout/footer";

export const metadata = {
  title: "SatyalokAMS",
  description: "Attendance Management System for Satyalok: A New Hope",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
