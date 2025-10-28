import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  ThumbsUp,
  ChevronDown,
  Search,
} from 'react-feather';
import {
  IconUsers,
  IconTargetArrow,
  IconDeviceComputerCamera,
  IconChartArrowsVertical,
  IconProgressCheck,
  IconSitemap,
  IconUserHeart,
  IconFlagStar,
  IconClipboardList
} from '@tabler/icons-react';
import NavLinkWithContextMenu from './NavLinkWithContextMenu';
import { useUserAndCompanyData } from '../hooks/useUserAndCompanyData';

interface SidebarNavigationProps {
  session: any;
  onNavigate?: () => void; // Called after navigation (for mobile to close sidebar)
  isMobile?: boolean; // If true, adjust styling for mobile
}

/**
 * Navigation configuration - shared between desktop and mobile
 */
const navigationConfig = [
  {
    id: "people",
    label: "People",
    shortForm: "Pe",
    icon: IconUsers,
    isExpandable: true,
    subTabs: [
      { id: "directory", label: "Directory", shortForm: "Di", icon: ThumbsUp },
      { id: "orgChart", label: "Org Chart", shortForm: "OC", icon: ThumbsUp },
      { id: "supplier", label: "Supplier", shortForm: "Su", icon: ThumbsUp },
      { id: "client", label: "Client", shortForm: "Cl", icon: ThumbsUp },
      { id: "hiring", label: "Hiring", shortForm: "Hi", icon: ThumbsUp },
      { id: "calendar", label: "Calendar", shortForm: "Ca", icon: Calendar },
      { id: "accountability", label: "Accountability", shortForm: "Ac", icon: ThumbsUp },
      { id: "leaves", label: "Leaves", shortForm: "Le", icon: Calendar },
      { id: "paceForm", label: "PACe Form", shortForm: "PF", icon: ThumbsUp },
      { id: "faceForm", label: "FACe Form", shortForm: "FF", icon: ThumbsUp },
    ],
  },
  {
    id: "sales",
    label: "Sales & Marketing",
    shortForm: "SM",
    icon: IconTargetArrow,
    isExpandable: true,
    subTabs: [
      { id: "salesTab", label: "Sales", shortForm: "Sa", icon: ThumbsUp },
      { id: "product", label: "Product", shortForm: "Pr", icon: ThumbsUp },
      { id: "quotation", label: "Quotation", shortForm: "Qu", icon: ThumbsUp },
      { id: "gift-suggestion", label: "Gift Suggestion Generator", shortForm: "GSG", icon: ThumbsUp },
    ],
  },
  {
    id: "meeting",
    label: "Meeting",
    shortForm: "Me",
    icon: IconDeviceComputerCamera,
    isExpandable: true,
    subTabs: [
      { id: "dailyHuddle", label: "Daily Huddle", shortForm: "Dh", icon: Calendar },
      { id: "weeklyMeeting", label: "Weekly Meeting", shortForm: "Wm", icon: Calendar },
    ],
  },
  {
    id: "financeData",
    label: "Finance & Data",
    shortForm: "FD",
    icon: IconChartArrowsVertical,
    isExpandable: true,
    subTabs: [
      { id: "onlineSales", label: "Online Sales", shortForm: "OS", icon: ThumbsUp },
      { id: "financeTab", label: "Finance", shortForm: "Fi", icon: ThumbsUp },
      { id: "power-of-one", label: "Power of One", shortForm: "PO", icon: ThumbsUp },
      { id: "ccc", label: "Cash Conversion Cycle", shortForm: "CC", icon: ThumbsUp }
    ],
  },
  {
    id: "projects",
    label: "Projects",
    shortForm: "Pj",
    icon: IconClipboardList,
    isExpandable: true,
    subTabs: [
      { id: "projects", label: "Projects", shortForm: "Pj", icon: ThumbsUp },
      { id: "creative-management", label: "Creative Management", shortForm: "CM", icon: ThumbsUp },
    ],
  },
  {
    id: "process",
    label: "Process",
    shortForm: "Pr",
    icon: IconProgressCheck,
    isExpandable: true,
    subTabs: [
      { id: "playbook", label: "Playbook", shortForm: "Pb", icon: ThumbsUp },
      { id: "todo", label: "Todo", shortForm: "Td", icon: ThumbsUp },
      { id: "rockefeller-habit-checklist", label: "Rockefeller Habit Checklist", shortForm: "RH", icon: ThumbsUp },
    ],
  },
  {
    id: "technology",
    label: "Technology",
    shortForm: "Te",
    icon: IconSitemap,
    isExpandable: true,
    subTabs: [
      { id: "password", label: "Password Management", shortForm: "Pw", icon: ThumbsUp },
      { id: "resources", label: "Resources", shortForm: "Rs", icon: ThumbsUp },
      { id: "sandbox", label: "Sandbox", shortForm: "Sb", icon: ThumbsUp },
      { id: "integration", label: "Integration", shortForm: "In", icon: ThumbsUp },
    ],
  },
  {
    id: "teamHealth",
    label: "Team Health",
    shortForm: "TH",
    icon: IconUserHeart,
    isExpandable: true,
    subTabs: [
      { id: "admin", label: "Admin", shortForm: "Ad", icon: ThumbsUp },
      { id: "award", label: "Award", shortForm: "Aw", icon: ThumbsUp },
      { id: "leaderboard", label: "Leaderboard", shortForm: "Lb", icon: ThumbsUp },
      { id: "milestone", label: "Milestone", shortForm: "Mi", icon: ThumbsUp },
      { id: "feedback", label: "Feedback", shortForm: "Fe", icon: ThumbsUp },
      { id: "issue_statement", label: "Parking Lots", shortForm: "Pl", icon: ThumbsUp }
    ],
  },
  {
    id: "thePlan",
    label: "The Plan",
    shortForm: "TP",
    icon: IconFlagStar,
    isExpandable: true,
    subTabs: [
      { id: "theRocks", label: "The Rocks", shortForm: "TR", icon: ThumbsUp },
      { id: "peak", label: "Peak", shortForm: "Pe", icon: ThumbsUp },
      { id: "vivid_vision", label: "Vivid Vision", shortForm: "Vv", icon: ThumbsUp },
      { id: "businessQuadrant", label: "Business Quadrant", shortForm: "Bq", icon: ThumbsUp },
      { id: "strata", label: "7 Strata", shortForm: "7S", icon: ThumbsUp }
    ],
  },
];

type TabType = (typeof navigationConfig)[number]["id"];
type ExtractSubTabIds<T extends typeof navigationConfig> = T[number] extends infer Item ?
    Item extends { subTabs: Array<{ id: infer SubId }> } ? SubId : never
    : never;
type SubTabType = ExtractSubTabIds<typeof navigationConfig>;

/**
 * Shared sidebar navigation component
 * Used by both DashboardLayout (desktop) and MobileSidebarOverlay (mobile)
 */
export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  session,
  onNavigate,
  isMobile = false
}) => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  // Get user info for role-based filtering
  const { userInfo } = useUserAndCompanyData(session.user.id);

  // State management
  const [activeTabState, setActiveTabState] = useState<TabType>('meeting');
  const [localActiveSubTab, setLocalActiveSubTab] = useState<SubTabType | undefined>('dailyHuddle');
  const [searchTerm, setSearchTerm] = useState('');

  // Submenu states
  const [submenuStates, setSubmenuStates] = useState<Record<TabType, boolean>>({
    people: false,
    sales: false,
    meeting: true,
    financeData: false,
    projects: false,
    process: false,
    technology: false,
    teamHealth: false,
    thePlan: false,
  });

  // Filter navigation items based on search and user role
  const filteredNavigation = useMemo(() => {
    if (!searchTerm.trim()) {
      return navigationConfig.map(tab => {
        if (tab.id === 'people') {
          const filteredSubTabs = tab.subTabs.filter(subTab =>
            subTab.id !== 'hiring' || (userInfo?.role && userInfo.role.toLowerCase().includes('manager'))
          );
          return { ...tab, subTabs: filteredSubTabs };
        }
        return tab;
      });
    }

    const term = searchTerm.toLowerCase();
    return navigationConfig
      .map(tab => {
        const filteredTab = { ...tab };
        if (tab.id === 'people') {
          const filteredSubTabs = tab.subTabs.filter(subTab =>
            subTab.id !== 'hiring' || (userInfo?.role && userInfo.role.toLowerCase().includes('manager'))
          );
          filteredTab.subTabs = filteredSubTabs;
        }
        return filteredTab;
      })
      .filter(tab => {
        const matchesTab = tab.label.toLowerCase().includes(term);
        const matchesSubTabs = tab.subTabs.some(
          subTab => subTab.label.toLowerCase().includes(term)
        );
        return matchesTab || matchesSubTabs;
      });
  }, [searchTerm, userInfo?.role]);

  const handleTabToggle = (tabId: TabType) => {
    if (isMobile) {
      // On mobile: close all other sections, toggle only this one
      setSubmenuStates(prev => {
        const allClosed: Record<TabType, boolean> = {
          people: false,
          sales: false,
          meeting: false,
          financeData: false,
          projects: false,
          process: false,
          technology: false,
          teamHealth: false,
          thePlan: false,
        };
        return {
          ...allClosed,
          [tabId]: !prev[tabId]
        };
      });
    } else {
      // On desktop: allow multiple sections open
      setSubmenuStates(prev => ({
        ...prev,
        [tabId]: !prev[tabId]
      }));
    }
  };

  const handleSubTabClick = (subTabId: SubTabType, parentTabId: TabType) => {
    setLocalActiveSubTab(subTabId);
    setActiveTabState(parentTabId);
    setSubmenuStates(prev => ({
      ...prev,
      [parentTabId]: true
    }));
    navigate(`/${userId}/${subTabId}`);

    // Call onNavigate for mobile to close sidebar
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div className={`sidebar-nav-container ${isMobile ? 'mobile' : ''}`}>
      {/* Search Bar */}
      <div className="sidebar-search">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="search-icon">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav-menu">
        {filteredNavigation.map((item) => (
          <div key={item.id} className="nav-item-container">
            <div className="nav-item-wrapper">
              {item.isExpandable ? (
                <div
                  onClick={() => handleTabToggle(item.id as TabType)}
                  className={`nav-item ${
                    activeTabState === item.id && submenuStates[item.id as TabType]
                      ? "active-open"
                      : activeTabState === item.id
                      ? "active-closed"
                      : ""
                  }`}
                >
                  <span className="nav-item-content">
                    <item.icon size={18} className={activeTabState === item.id ? "icon-active" : "icon-inactive"} />
                    <span className="nav-item-label">{item.label}</span>
                  </span>
                  <ChevronDown size={16} className={`chevron ${submenuStates[item.id as TabType] ? "rotated" : ""}`} />
                </div>
              ) : (
                <NavLinkWithContextMenu
                  to={`/${userId}/${item.id}`}
                  onClick={() => {
                    setActiveTabState(item.id as TabType);
                    if (onNavigate) onNavigate();
                  }}
                  isActive={activeTabState === item.id}
                  className={`nav-item ${activeTabState === item.id ? "active-closed" : ""}`}
                >
                  <span className="nav-item-content">
                    <item.icon size={18} className={activeTabState === item.id ? "icon-active" : "icon-inactive"} />
                    <span className="nav-item-label">{item.label}</span>
                  </span>
                </NavLinkWithContextMenu>
              )}

              {item.isExpandable && (
                <div className={`submenu ${
                  submenuStates[item.id as TabType] || (searchTerm.trim() && item.subTabs.some(sub => sub.label.toLowerCase().includes(searchTerm.toLowerCase())))
                    ? "expanded"
                    : "collapsed"
                }`}>
                  {item.subTabs.map((subTab) => (
                    <NavLinkWithContextMenu
                      key={subTab.id}
                      to={`/${userId}/${subTab.id}`}
                      onClick={() => handleSubTabClick(subTab.id as SubTabType, item.id as TabType)}
                      isActive={localActiveSubTab === subTab.id}
                      className={`submenu-item ${localActiveSubTab === subTab.id ? "active" : ""}`}
                    >
                      <subTab.icon size={16} className={localActiveSubTab === subTab.id ? "icon-active-sub" : "icon-inactive-sub"} />
                      <span className="submenu-label">{subTab.label}</span>
                    </NavLinkWithContextMenu>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </nav>

      <style>{`
        .sidebar-nav-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }

        .sidebar-search {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .search-wrapper {
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          padding-right: 36px;
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .search-input:focus {
          background-color: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .search-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .sidebar-nav-menu {
          flex: 1;
          overflow-y: auto;
          padding: 8px 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }

        .sidebar-nav-menu::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-nav-menu::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-nav-menu::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .nav-item-container {
          margin-bottom: 4px;
        }

        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: rgba(255, 255, 255, 0.7);
          background: transparent;
          text-decoration: none;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-item.active-open {
          background: rgba(99, 102, 241, 0.3);
          color: white;
        }

        .nav-item.active-closed {
          background: rgba(99, 102, 241, 0.4);
          color: white;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .nav-item-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-item-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .icon-inactive {
          color: rgba(255, 255, 255, 0.4);
        }

        .icon-active {
          color: white;
        }

        .chevron {
          transition: transform 0.2s;
          color: rgba(255, 255, 255, 0.5);
        }

        .chevron.rotated {
          transform: rotate(180deg);
        }

        .submenu {
          margin-top: 4px;
          margin-left: 16px;
          overflow: hidden;
          transition: max-height 0.3s ease, opacity 0.3s ease;
        }

        .submenu.expanded {
          max-height: 1000px;
          opacity: 1;
        }

        .submenu.collapsed {
          max-height: 0;
          opacity: 0;
        }

        .submenu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          margin-bottom: 2px;
        }

        .submenu-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .submenu-item.active {
          background: rgba(99, 102, 241, 0.2);
          color: white;
        }

        .icon-inactive-sub {
          color: rgba(255, 255, 255, 0.4);
        }

        .icon-active-sub {
          color: rgba(99, 102, 241, 0.8);
        }

        .submenu-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
};
