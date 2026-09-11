import React from "react";
import { User as UserIcon, Camera } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const ProfileHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between bg-card rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
            alt="User Avatar"
            className="w-20 h-20 rounded-full object-cover border"
          />
          <button
            className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full hover:scale-105 transition"
            title="Change avatar"
          >
            <Camera size={16} />
          </button>
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user?.name || 'Guest User'}</h2>
          <p className="text-sm text-muted-foreground">{user?.email || 'No email'}</p>
          <button className="text-sm text-primary mt-1 hover:underline flex items-center gap-1">
            <UserIcon size={14}/> Edit Profile
          </button>
        </div>
      </div>
      <button 
        onClick={logout}
        className="text-sm bg-destructive text-white px-3 py-2 rounded-lg hover:bg-destructive/80"
      >
        Logout
      </button>
    </div>
  );
};

export default ProfileHeader;
