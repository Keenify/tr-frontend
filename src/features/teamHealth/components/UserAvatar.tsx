import React from 'react';

interface UserAvatarProps {
    profileUrl?: string | null;
    firstName?: string;
    lastName?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
    profileUrl,
    firstName = '',
    lastName = '',
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg'
    };

    const isValidImageUrl = profileUrl?.toLowerCase().startsWith('https://');
    const initials = firstName ? firstName.charAt(0).toUpperCase() : '?';
    const bgColor = `bg-blue-${Math.abs(firstName?.charCodeAt(0) ?? 0) % 5 + 4}00`;

    if (isValidImageUrl) {
        return (
            <img 
                src={profileUrl}
                alt={`${firstName} ${lastName}`}
                className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
            />
        );
    }

    return (
        <div className={`rounded-full flex items-center justify-center text-white font-medium ${bgColor} ${sizeClasses[size]} ${className}`}>
            {initials}
        </div>
    );
}; 