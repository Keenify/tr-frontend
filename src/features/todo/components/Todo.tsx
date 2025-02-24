import { Session } from "@supabase/supabase-js";
import React from "react";

interface TodoProps {
  session: Session;
}

const Todo: React.FC<TodoProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Coming Soon!</h1>
      <p className="text-gray-600 text-center max-w-md">
        The Todo feature is currently under development. Stay tuned for an amazing task management experience!
      </p>
    </div>
  );
};

export default Todo;
