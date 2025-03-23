import { Session } from "@supabase/supabase-js";
import React from "react";
import CoreValuesTable from "./CoreValuesTable";

interface AwardProps {
  session: Session;
}

const Award: React.FC<AwardProps> = ({ session }) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Company Values & Recognition</h1>
      <p className="text-gray-600 mb-8">
        Define your company's core values and use them to recognize team members who exemplify these values.
      </p>
      
      <div className="space-y-8">
        {/* Core Values Management */}
        <CoreValuesTable session={session} />
        
        {/* Award Recognition System - Coming Soon */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Recognition</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Coming Soon!</h3>
            <p className="text-gray-600">
              The team recognition feature is currently under development.
              Soon you'll be able to recognize team members who exemplify your core values.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Award;
