// components/scheduler/ui/UserSelectionModal.tsx
"use client";

import React from 'react';
import { X, UserCheck } from 'lucide-react';
import { User } from '../types';

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  selectedUsers: Array<string | number>;
  onToggle: (userId: string | number) => void;
}

export const UserSelectionModal: React.FC<UserSelectionModalProps> = ({ isOpen, onClose, users, selectedUsers, onToggle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Select Employees to View</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
            <ul className="space-y-2">
                {users.map(user => {
                    const isSelected = selectedUsers.includes(user.id);
                    return (
                        <li key={user.id}>
                            <label 
                                htmlFor={`user-${user.id}`} 
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    id={`user-${user.id}`}
                                    checked={isSelected}
                                    onChange={() => onToggle(user.id)}
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                    style={{ backgroundColor: user.color }}
                                >
                                    {user.avatar}
                                </div>
                                <span className="font-medium text-gray-700">{user.name}</span>
                            </label>
                        </li>
                    )
                })}
            </ul>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end">
            <button 
                onClick={onClose} 
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};
