import React from 'react';
import { UserCog } from 'lucide-react';

interface LoginModalProps {
  username: string;
  password: string;
  error: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function LoginModal({
  username,
  password,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onCancel,
}: LoginModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <UserCog className="h-8 w-8" />
          <h2 className="text-2xl font-semibold">Admin Login</h2>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
            <input
              type="text"
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Enter admin username"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Login
            </button>
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
