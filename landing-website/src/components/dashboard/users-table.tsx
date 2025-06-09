// src/components/dashboard/users-table.tsx
'use client';

import React from 'react';

// Define a type for the user data we expect
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string; // Adjust if Role is an enum in your Prisma schema
  isActive: boolean;
  createdAt: Date;
}

interface UsersTableProps {
  users: User[];
}

const UsersTable: React.FC<UsersTableProps> = ({ users }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg">
        <thead>
          <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left">Name</th>
            <th className="py-3 px-6 text-left">Email</th>
            <th className="py-3 px-6 text-left">Role</th>
            <th className="py-3 px-6 text-left">Status</th>
            <th className="py-3 px-6 text-left">Joined At</th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {users.map((user: User) => (
            <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-left whitespace-nowrap">{user.name || 'N/A'}</td>
              <td className="py-3 px-6 text-left">{user.email}</td>
              <td className="py-3 px-6 text-left">
                <span 
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'ADMIN' 
                      ? 'bg-red-200 text-red-700' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="py-3 px-6 text-left">
                <span 
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive 
                      ? 'bg-green-200 text-green-700' 
                      : 'bg-yellow-200 text-yellow-700'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="py-3 px-6 text-left">{new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
