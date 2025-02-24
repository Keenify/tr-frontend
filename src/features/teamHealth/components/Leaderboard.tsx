import { Session } from "@supabase/supabase-js";
import React from "react";

interface LeaderboardProps {
  session: Session;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ session }) => {
  console.log(session);
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Coming Soon!</h1>
      <p className="text-gray-600 text-center max-w-md">
        The Leaderboard feature is currently under development.
      </p>
    </div>
  );
};

export default Leaderboard;
