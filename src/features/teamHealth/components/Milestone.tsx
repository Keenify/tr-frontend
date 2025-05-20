import { Session } from "@supabase/supabase-js";
import React, { useState, useEffect, useRef } from "react";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";

// Extend Document and HTMLElement with vendor-specific fullscreen methods
interface VendorFullscreenDocument extends Document {
  mozCancelFullScreen?: () => Promise<void>;
  webkitExitFullscreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface VendorFullscreenElement extends HTMLElement {
  mozRequestFullScreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

interface MilestoneProps {
  session: Session;
}

interface MilestoneData {
  id?: string;
  current_count: number;
  goal: number;
  goal_year: number;
  last_updated: string;
}

// Hardcoded milestone data
const HARDCODED_MILESTONE: MilestoneData = {
  id: "1",
  current_count: 1250000,
  goal: 5000000,
  goal_year: 2029,
  last_updated: new Date().toISOString()
};

const Milestone: React.FC<MilestoneProps> = ({ session }) => {
  const { userInfo, companyInfo, isLoading } = useUserAndCompanyData(session.user.id);
  const [isEditing, setIsEditing] = useState(false);
  const [milestoneData, setMilestoneData] = useState<MilestoneData>(HARDCODED_MILESTONE);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract employee ID and company ID from user info when it loads
  useEffect(() => {
    if (userInfo) {
      // Log available ID fields for debugging
      console.log('User info loaded, checking for IDs:');
      Object.keys(userInfo).forEach(key => {
        if (key.includes('id') || key.includes('Id')) {
          console.log(`- ${key}: ${userInfo[key as keyof typeof userInfo]}`);
        }
      });
      
      // Extract employee ID
      if ('employee_id' in userInfo) {
        console.log('Setting employee_id from userInfo.employee_id:', userInfo.employee_id);
        setEmployeeId(userInfo.employee_id as string);
      } else if ('id' in userInfo) {
        console.log('Fallback: Setting employee_id from userInfo.id:', userInfo.id);
        setEmployeeId(userInfo.id as string);
      } else {
        console.log('Unable to find employee ID in userInfo, using session.user.id');
        setEmployeeId(session.user.id);
      }

      // Check if user is admin
      if ('role' in userInfo) {
        console.log('User role:', userInfo.role);
        setIsAdmin(userInfo.role === 'admin');
      }
    }

    if (companyInfo) {
      console.log('Company info loaded:');
      Object.keys(companyInfo).forEach(key => {
        if (key.includes('id') || key.includes('Id')) {
          console.log(`- ${key}: ${companyInfo[key as keyof typeof companyInfo]}`);
        }
      });

      if ('id' in companyInfo) {
        console.log('Setting company_id from companyInfo.id:', companyInfo.id);
        setCompanyId(companyInfo.id as string);
      }
    }
  }, [userInfo, companyInfo, session.user.id]);

  // Add fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Add debug logging that uses the ID variables
  useEffect(() => {
    if (employeeId && companyId) {
      console.log(`Ready to load milestone data for employee ${employeeId} at company ${companyId}`);
    }
  }, [employeeId, companyId]);

  useEffect(() => {
    fetchMilestoneData();
  }, []);

  const fetchMilestoneData = async () => {
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use hardcoded data
      setMilestoneData(HARDCODED_MILESTONE);
    } catch (error) {
      console.error('Error fetching milestone data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMilestoneData = async () => {
    try {
      const newCount = parseInt(inputValue);
      if (isNaN(newCount)) return;

      // Update the milestone data without supabase
      const updatedData = {
        ...milestoneData,
        current_count: newCount,
        last_updated: new Date().toISOString()
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update state with the new data
      setMilestoneData(updatedData);
      setIsEditing(false);
      setInputValue("");
      
      console.log('Updated milestone count to:', newCount);
    } catch (error) {
      console.error('Error updating milestone data:', error);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (containerRef.current) {
          const element = containerRef.current as VendorFullscreenElement;
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          } else if (element.mozRequestFullScreen) {
            await element.mozRequestFullScreen();
          } else if (element.webkitRequestFullscreen) {
            await element.webkitRequestFullscreen();
          } else if (element.msRequestFullscreen) {
            await element.msRequestFullscreen();
          }
        }
      } else {
        // Exit fullscreen
        const doc = document as VendorFullscreenDocument;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const formatNumber = (number: number) => {
    return number.toLocaleString();
  };

  const calculatePercentage = () => {
    return Math.min(100, Math.round((milestoneData.current_count / milestoneData.goal) * 100));
  };

  const percentage = calculatePercentage();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateMilestoneData();
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-indigo-900 p-8 text-white ${isFullscreen ? 'fixed inset-0 z-50 group' : ''}`}
      onClick={() => isAdmin && !isEditing && setIsEditing(true)}
    >
      <div className="flex flex-col items-center justify-center max-w-4xl w-full space-y-10">
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-wide text-center">
          {milestoneData.goal_year} Goal Progress
        </h1>
        
        <div className="w-full bg-white/10 h-8 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          >
          </div>
        </div>
        
        <div className="text-xl font-semibold text-amber-300">
          {percentage}% Complete
        </div>

        <div className="relative p-8 md:p-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-2xl w-full text-center transform transition-all group">
          {/* Fullscreen toggle button */}
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the parent div's onClick
              toggleFullscreen();
            }}
            className={`absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300 text-white hover:text-white ${
              isFullscreen ? 'opacity-0 group-hover:opacity-100' : ''
            }`}
            title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            )}
          </button>
          
          <div className="absolute top-0 left-0 -mt-4 -ml-4 bg-white px-4 py-1 rounded-full text-amber-700 font-bold">
            {formatNumber(milestoneData.goal)} BY {milestoneData.goal_year}
          </div>
          
          {isEditing && isAdmin ? (
            <div className="flex flex-col items-center gap-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-6xl md:text-8xl font-bold text-center bg-transparent border-b-2 border-white focus:outline-none w-full text-white"
                placeholder={formatNumber(milestoneData.current_count)}
                autoFocus
              />
              <div className="flex gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-white/20 rounded-md text-white hover:bg-white/30 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateMilestoneData();
                  }}
                  className="px-4 py-2 bg-white rounded-md text-amber-600 font-bold hover:bg-amber-100 transition"
                >
                  Update Count
                </button>
              </div>
            </div>
          ) : (
            <h2 className="text-6xl md:text-8xl font-bold text-white mb-3">
              {formatNumber(milestoneData.current_count)}
            </h2>
          )}
          
          <p className="text-xl md:text-2xl uppercase tracking-wider text-white/90 mt-4">
            Good Times & Counting
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-1 text-white/60 text-sm">
          <p>Last updated: {new Date(milestoneData.last_updated).toLocaleDateString()}</p>
          {isAdmin && !isEditing && !isFullscreen && (
            <p className="italic">Click anywhere to update the count</p>
          )}
        </div>

        {/* Milestone markers */}
        <div className="w-full mt-8 flex flex-col md:flex-row justify-between gap-4">
          <div className="bg-white/10 p-4 rounded-lg flex-1 text-center">
            <div className="text-lg font-bold">2025</div>
            <div className="text-amber-300">2M</div>
            <div className="text-sm text-white/70">6 brands, 60 SKUs</div>
          </div>
          <div className="bg-white/10 p-4 rounded-lg flex-1 text-center">
            <div className="text-lg font-bold">2027</div>
            <div className="text-amber-300">3M</div>
            <div className="text-sm text-white/70">7 brands, 100 SKUs</div>
          </div>
          <div className="bg-white/10 p-4 rounded-lg flex-1 text-center border border-amber-500">
            <div className="text-lg font-bold">2029</div>
            <div className="text-amber-300">5M</div>
            <div className="text-sm text-white/70">15 brands, 300 SKUs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Milestone;
