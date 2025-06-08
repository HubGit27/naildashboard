// components/scheduler/ui/UserSelector.tsx
"use client";

import React from 'react';
import { User } from '../types';

interface UserSelectorProps {
    users: User[];
    selectedUsers: Array<string | number>;
    onToggle: (userId: string | number) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ users, selectedUsers, onToggle }) => {
    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Viewing:</span>
            <div className="flex flex-wrap items-center gap-2">
                {users.map(user => {
                    const isSelected = selectedUsers.includes(user.id);
                    return (
                        <button
                            key={user.id}
                            onClick={() => onToggle(user.id)}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border-2 ${
                                isSelected 
                                ? 'text-white' 
                                : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                            }`}
                            style={{
                                backgroundColor: isSelected ? user.color : undefined,
                                borderColor: isSelected ? user.color : 'transparent',
                            }}
                            aria-pressed={isSelected}
                        >
                            <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                style={{ 
                                    backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : user.color 
                                }}
                            >
                                {user.avatar}
                            </div>
                            <span>{user.name}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
