'use client';

import ProtectedRoute from '@/components/admin/ProtectedRoute';
import AdminNavbar from '@/components/admin/Navbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
