import React from 'react';
import { motion } from 'framer-motion';
import { User, GraduationCap } from 'lucide-react';

interface RoleSelectorProps {
    selectedRole: 'student' | 'professor';
    onSelect: (role: 'student' | 'professor') => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelect }) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <button
                type="button"
                onClick={() => onSelect('student')}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${selectedRole === 'student'
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
                    }`}
            >
                <User className="w-8 h-8" />
                <span className="font-bold uppercase tracking-wider">Student</span>
                {selectedRole === 'student' && (
                    <motion.div
                        layoutId="role-indicator"
                        className="absolute inset-0 border-2 border-white rounded-2xl"
                        transition={{ duration: 0.3 }}
                    />
                )}
            </button>

            <button
                type="button"
                onClick={() => onSelect('professor')}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${selectedRole === 'professor'
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
                    }`}
            >
                <GraduationCap className="w-8 h-8" />
                <span className="font-bold uppercase tracking-wider">Professor</span>
                {selectedRole === 'professor' && (
                    <motion.div
                        layoutId="role-indicator"
                        className="absolute inset-0 border-2 border-white rounded-2xl"
                        transition={{ duration: 0.3 }}
                    />
                )}
            </button>
        </div>
    );
};
