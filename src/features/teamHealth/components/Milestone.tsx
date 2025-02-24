import { Session } from "@supabase/supabase-js";
import React from "react";

interface MilestoneProps {
  session: Session;
}

const Milestone: React.FC<MilestoneProps> = ({ session }) => {
  console.log(session);
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Coming Soon!</h1>
      <p className="text-gray-600 text-center max-w-md">
        The Milestone feature is currently under development.
      </p>
    </div>
  );
};

export default Milestone;
