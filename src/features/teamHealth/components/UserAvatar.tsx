import React from 'react';

export interface UserAvatarProps {
    name: string;
    imageUrl?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, imageUrl, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className={`relative inline-flex items-center justify-center rounded-full bg-blue-100 ${sizeClasses[size]}`}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={`${name}'s avatar`}
                    className="w-full h-full object-cover rounded-full"
                />
            ) : (
                <span className="font-medium text-blue-700">{initials}</span>
            )}
        </div>
    );
}; 