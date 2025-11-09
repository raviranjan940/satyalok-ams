'use client';

import Link from "next/link";
import { Github, Linkedin, Instagram, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t mt-10 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
        {/* Developer Info */}
        <div className="text-center md:text-left">
          <p className="font-medium text-gray-800">
            Developed by <span className="text-blue-600">Ravi Ranjan</span>
          </p>
          <p>Proudly made in India 🇮🇳</p>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/raviranjan940"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition"
          >
            <Github className="w-5 h-5" />
          </Link>
          <Link
            href="https://www.linkedin.com/in/raviranjan940/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition"
          >
            <Linkedin className="w-5 h-5" />
          </Link>
          <Link
            href="https://www.instagram.com/raviranjan_143"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-500 transition"
          >
            <Instagram className="w-5 h-5" />
          </Link>
          <Link
            href="https://www.facebook.com/raviranjan0940/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition"
          >
            <Facebook className="w-5 h-5" />
          </Link>
        </div>

        {/* Legal Info */}
        <div className="text-center md:text-right text-gray-500 text-xs">
          <Link
            href="/terms"
            className="hover:underline hover:text-blue-600 mr-3"
          >
            Terms & Conditions
          </Link>
          <span>© {new Date().getFullYear()} SatyalokAMS. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
