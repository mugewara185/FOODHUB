import React, { useRef } from "react";
import { User as UserIcon, Camera } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAppDispatch } from "../../app/store";
import { setAuthSession, updateProfileThunk } from "../../features/auth/authSlice";
import { showToast } from "../../features/ui/uiSlice";

const ProfileHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      dispatch(showToast({ message: 'Please upload an image file', type: 'error' }));
      return;
    }

    // Optional limit: 2MB for base64 storage limits
    if (file.size > 2 * 1024 * 1024) { 
      dispatch(showToast({ message: 'Image must be smaller than 2MB', type: 'error' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64String = e.target?.result as string;
      
      if (user) {
        try {
          await dispatch(updateProfileThunk({ avatar: base64String })).unwrap();
          dispatch(showToast({ message: 'Profile picture updated!', type: 'success' }));
        } catch (err) {
          dispatch(showToast({ message: 'Failed to update profile picture', type: 'error' }));
        }
      }
    };
    
    reader.onerror = () => {
      dispatch(showToast({ message: 'Failed to read image', type: 'error' }));
    };

    reader.readAsDataURL(file);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center justify-between bg-card rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
            alt="User Avatar"
            className="w-20 h-20 rounded-full object-cover border"
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button
            className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full hover:scale-110 transition shadow-md"
            title="Change avatar"
            onClick={() => {console.log('Change avatar clicked'); fileInputRef.current?.click()}}
          >
            <Camera size={14} />
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
