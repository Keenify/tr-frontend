import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import CoreValuesTable from "./CoreValuesTable";
import CoreScoreTable from "./CoreScoreTable";

interface AwardProps {
  session: Session;
}

const Award: React.FC<AwardProps> = ({ session }) => {
  const { userInfo, isLoading } = useUserAndCompanyData(session.user.id);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  
  // Extract the correct employee ID from user info when it loads
  useEffect(() => {
    if (userInfo) {
      // Log available ID fields for debugging
      console.log('User info loaded, checking for employee ID field:');
      Object.keys(userInfo).forEach(key => {
        if (key.includes('id') || key.includes('Id')) {
          console.log(`- ${key}: ${userInfo[key as keyof typeof userInfo]}`);
        }
      });
      
      // Use the correct employee ID from userInfo if available
      // Default to using id if employee_id doesn't exist
      if ('employee_id' in userInfo) {
        console.log('Setting employee_id from userInfo.employee_id:', userInfo.employee_id);
        setEmployeeId(userInfo.employee_id as string);
      } else if ('id' in userInfo) {
        console.log('Fallback: Setting employee_id from userInfo.id:', userInfo.id);
        setEmployeeId(userInfo.id as string);
      } else {
        // Last resort fallback to session user ID
        console.log('Unable to find employee ID in userInfo, using session.user.id');
        setEmployeeId(session.user.id);
      }
    }
  }, [userInfo, session.user.id]);

  if (isLoading || !employeeId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-3 text-indigo-600 font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Company Values & Recognition</h1>
      <p className="text-gray-600 mb-8">
        Define your company's core values and use them to recognize team members who exemplify these values.
      </p>
      
      <div className="space-y-8">
        {/* Core Values Management */}
        <CoreValuesTable session={session} />
        
        {/* Core Scores Management */}
        <CoreScoreTable 
          session={session} 
          employeeId={employeeId} 
        />
        
      </div>
    </div>
  );
};

export default Award;
