'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, getIdTokenResult } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ Authenticate user manually
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Fetch custom claims (role)
      const tokenResult = await getIdTokenResult(user);
      const role = tokenResult.claims.role || 'teacher';

      // ✅ Store token for middleware if needed
      const token = await user.getIdToken();
      document.cookie = `satyalok_token=${token}; path=/;`;

      // ✅ Redirect based on role
      if (role === 'superadmin' || role === 'admin') {
        window.location.href = '/dashboard/admin';
      } else if (role === 'teacher') {
        window.location.href = '/dashboard/user';
      } else {
        setError('Unauthorized role. Please contact admin.');
        await auth.signOut();
      }
    } catch (err: any) {
      console.error(err);
      setError('Invalid credentials or inactive account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-4 bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-center text-blue-700">
          SatyalokAMS Login
        </h2>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@satyalok.org"
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
}
