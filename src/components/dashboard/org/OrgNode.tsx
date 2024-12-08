import { type OrgMember } from '../../../types/org';
import { HighlightText } from './HighlightText';

interface OrgNodeProps {
  member: OrgMember;
  searchTerm: string;
}

export function OrgNode({ member, searchTerm }: OrgNodeProps) {
  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('');

  /**
   * Determines if the search term matches the member's name or role.
   * A match is found if the search term is at least 3 characters long
   * and is present in either the member's name or role, case-insensitively.
   */
  const isMatch = searchTerm.length >= 3 && (
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Renders a visual representation of an organization member node.
   * The node includes the member's initials, name, and role, and highlights
   * if the search term matches the member's name or role.
   *
   * @returns {JSX.Element} A styled div element representing the organization member.
   */
  return (
    <div className={`relative px-4 py-3 rounded-xl shadow-lg border-2 ${member.color} ${isMatch ? 'animate-search-match ribbon' : ''} transition-all duration-200 min-w-[200px] max-w-xs`}>
      <div className="flex items-center gap-3">
        {/* Initials Circle */}
        <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center bg-white/50 ${isMatch ? 'bg-white/70' : ''}`}>
          <span className={`font-medium text-lg text-gray-700 ${isMatch ? 'text-gray-900' : ''}`}>
            {initials}
          </span>
        </div>
        {/* Member Details */}
        <div className="min-w-0">
          <h3 className={`text-base font-medium truncate text-gray-900 ${isMatch ? 'text-gray-900' : ''}`}>
            <HighlightText text={member.name} searchTerm={searchTerm} />
          </h3>
          <p className={`text-sm truncate text-gray-600 ${isMatch ? 'text-gray-800' : ''}`}>
            <HighlightText text={member.role} searchTerm={searchTerm} />
          </p>
        </div>
      </div>
    </div>
  );
}