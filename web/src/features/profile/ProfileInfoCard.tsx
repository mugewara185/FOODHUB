import React from "react";
import { useAuth } from "../../contexts/AuthContext";

const ProfileInfoCard: React.FC = () => {
  const { user } = useAuth();
  
  // Format member since date
  const memberSince = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Unknown';

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold">Account Information</h3>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Phone</p>
          <p>{user?.phone || 'Not provided'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Member since</p>
          <p>{memberSince}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoCard;
