import { useDirectory } from '../hooks/useDirectory';
import { SearchBar } from '../components/SearchBar';
import { EmployeeCard } from '../components/EmployeeCard';
import { AddTeammateButton } from '../components/AddTeammateButton';

export const Directory = ({ companyId }: { companyId: string }) => {
  const { employees, isLoading, error, filters, setFilters } = useDirectory(companyId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Directory</h1>
        <p className="text-gray-600">
          Share your directory with your whole team to help them get to know each other.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <SearchBar 
            value={filters.searchQuery}
            onChange={(value) => setFilters({ ...filters, searchQuery: value })}
          />
        </div>
        <div className="flex gap-4">
          <select
            className="px-4 py-2 border rounded-md bg-white"
            value={filters.sortOrder}
            onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
          >
            <option value="asc">Name (A to Z)</option>
            <option value="desc">Name (Z to A)</option>
          </select>
          <AddTeammateButton />
        </div>
      </div>

      {/* Employee Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {employees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}
    </div>
  );
}; 