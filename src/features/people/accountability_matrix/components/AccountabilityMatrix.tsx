import { Session } from "@supabase/supabase-js";
import React, { useState, useEffect } from "react";
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";
import { getAllEmployees } from "../../../../services/useUser";
import { UserData } from "../../../../services/useUser";
import Select, { StylesConfig, components } from 'react-select';
import { 
  createAccountability, 
  getCompanyAccountabilities, 
  updateAccountability, 
  deleteAccountability,
  AccountabilityData 
} from '../services/useAccountability';
import '../styles/AccountabilityMatrix.css';

interface AccountabilityMatrixProps {
  session: Session;
}

interface SelectOption {
  value: string;
  label: string;
  profilePic?: string;
}

const AccountabilityMatrix: React.FC<AccountabilityMatrixProps> = ({ session }) => {
  const { userInfo, companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);
  const [rows, setRows] = useState<AccountabilityData[]>([]);
  const [employees, setEmployees] = useState<UserData[]>([]);
  const [newRow, setNewRow] = useState<Omit<AccountabilityData, 'id' | 'company_id' | 'created_by' | 'created_at' | 'updated_at'>>({
    task: '',
    accountable_person: '',
    team_involved: [],
    dependency: '',
    frequency: ''
  });
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (companyInfo?.id) {
        try {
          const employeeData = await getAllEmployees(companyInfo.id);
          setEmployees(employeeData);
        } catch (error) {
          console.error('Failed to fetch employees:', error);
        }
      }
    };

    fetchEmployees();
  }, [companyInfo?.id]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (companyInfo?.id) {
        try {
          const tasks = await getCompanyAccountabilities(companyInfo.id);
          setRows(tasks);
        } catch (error) {
          console.error('Failed to fetch tasks:', error);
        }
      }
    };

    fetchTasks();
  }, [companyInfo?.id]);

  const handleAddRow = async () => {
    if (!newRow.task || !newRow.accountable_person || newRow.team_involved.length === 0 || !newRow.dependency || !newRow.frequency) {
      alert('Please fill all fields');
      return;
    }

    try {
      console.log('Creating accountability with:', {
        companyId: companyInfo?.id,
        userId: userInfo?.id,
        payload: newRow
      });

      const createdTask = await createAccountability(
        companyInfo?.id || '',
        userInfo?.id || '',
        newRow
      );

      console.log('Response from createAccountability:', createdTask);
      
      setRows(prevRows => [...prevRows, createdTask]);

      // Reset form
      setNewRow({
        task: '',
        accountable_person: '',
        team_involved: [],
        dependency: '',
        frequency: ''
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  // Convert employees to select options, filtering only active employees
  const employeeOptions: SelectOption[] = employees
    .filter((employee) => employee.Is_Employed === true)
    .map((employee) => ({
      value: employee.id,
      label: `${employee.first_name} ${employee.last_name}`,
      profilePic: employee.profile_pic_url
    }));

  // Custom Option component to display profile pictures
  const CustomOption = (props: any) => {
    const { data, innerRef, innerProps } = props;
    return (
      <div ref={innerRef} {...innerProps} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
        {data.profilePic ? (
          <img 
            src={data.profilePic} 
            alt={data.label}
            className="w-8 h-8 rounded-full mr-3 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full mr-3 bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">
              {data.label.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-gray-900">{data.label}</span>
      </div>
    );
  };

  // Custom SingleValue component for selected value
  const CustomSingleValue = (props: any) => {
    const { data } = props;
    return (
      <div className="flex items-center">
        {data.profilePic ? (
          <img 
            src={data.profilePic} 
            alt={data.label}
            className="w-6 h-6 rounded-full mr-2 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-6 h-6 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 text-xs font-medium">
              {data.label.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-gray-900">{data.label}</span>
      </div>
    );
  };

  // Custom MultiValue component for multi-select
  const CustomMultiValue = (props: any) => {
    const { data, removeProps } = props;
    return (
      <div className="flex items-center bg-blue-100 rounded-full px-2 py-1 mr-1 mb-1">
        {data.profilePic ? (
          <img 
            src={data.profilePic} 
            alt={data.label}
            className="w-5 h-5 rounded-full mr-1 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-5 h-5 rounded-full mr-1 bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 text-xs font-medium">
              {data.label.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-blue-800 text-sm mr-1">{data.label}</span>
        <button
          {...removeProps}
          className="text-blue-600 hover:text-blue-800 ml-1"
        >
          ×
        </button>
      </div>
    );
  };

  // Custom styles for the Select components to ensure dropdowns are visible
  const selectStyles: StylesConfig<SelectOption, true> = {
    menu: (base) => ({
      ...base,
      position: 'absolute',
      zIndex: 1000,
      maxHeight: '200px',
      overflow: 'hidden'
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '200px',
      overflowY: 'auto',
      overflowX: 'hidden',
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px'
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '4px'
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px',
        '&:hover': {
          background: '#555'
        }
      },
      scrollbarWidth: 'thin'
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 1000
    }),
    container: (base) => ({
      ...base,
      zIndex: 100,
      width: '100%',
      minWidth: '150px'
    }),
    control: (base) => ({
      ...base,
      minHeight: '38px'
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 8px',
      maxHeight: '80px',
      overflowY: 'hidden',
      overflowX: 'hidden'
    }),
    multiValue: (base) => ({
      ...base,
      margin: '2px'
    }),
    option: (base) => ({
      ...base,
      padding: '8px 12px'
    })
  };

  const handleEditRow = (rowId: string) => {
    const rowToEdit = rows.find(row => row.id === rowId);
    if (rowToEdit) {
      setEditingRowId(rowId);
      setNewRow({
        task: rowToEdit.task,
        accountable_person: rowToEdit.accountable_person,
        team_involved: rowToEdit.team_involved,
        dependency: rowToEdit.dependency,
        frequency: rowToEdit.frequency
      });
    }
  };

  const handleUpdateRow = async () => {
    if (!editingRowId) return;

    try {
      const updatedTask = await updateAccountability(
        editingRowId,
        companyInfo?.id || '',
        newRow
      );

      setRows(prevRows => 
        prevRows.map(row => row.id === editingRowId ? updatedTask : row)
      );
      
      setEditingRowId(null);
      setNewRow({
        task: '',
        accountable_person: '',
        team_involved: [],
        dependency: '',
        frequency: ''
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (confirm('Are you sure you want to delete this row?')) {
      try {
        await deleteAccountability(rowId, companyInfo?.id || '');
        setRows(prevRows => prevRows.filter(row => row.id !== rowId));
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  // Replace the formatTeamMembers function with this new component
  const TeamMemberLabels: React.FC<{ teamMemberIds: string[] }> = ({ teamMemberIds }) => {
    return (
      <div className="team-members-container">
        {teamMemberIds.map(teamMemberId => {
          const employee = employees.find(emp => emp.id === teamMemberId);
          return employee ? (
            <span key={teamMemberId} className="team-member-label">
              {`${employee.first_name} ${employee.last_name}`}
            </span>
          ) : null;
        })}
      </div>
    );
  };

  if (isLoadingCompany) {
    return <div>Loading...</div>;
  }

  return (
    <div className="accountability-matrix">
      <div className="matrix-header">
        <h1 className="matrix-title">Accountability Matrix</h1>
        {companyInfo?.name && (
          <span className="company-name">{companyInfo.name}</span>
        )}
      </div>

      <div className="table-container">
        <table className="matrix-table">
          <thead>
            <tr className="table-header">
              <th className="table-cell" style={{ width: '20%' }}>
                <div className="matrix-title">TASK/PROCESS</div>
              </th>
              <th className="table-cell" style={{ width: '15%' }}>
                <div className="matrix-title">ACCOUNTABLE</div>
                <div className="header-subtitle">Function/person</div>
              </th>
              <th className="table-cell" style={{ width: '25%' }}>
                <div className="matrix-title">THE TEAM</div>
                <div className="header-subtitle">Who else is involved</div>
              </th>
              <th className="table-cell" style={{ width: '15%' }}>
                <div className="matrix-title">DEPENDENCY</div>
                <div className="header-subtitle">Who we rely on?</div>
              </th>
              <th className="table-cell" style={{ width: '15%' }}>
                <div className="matrix-title">FREQUENCY</div>
                <div className="header-subtitle">How often?</div>
              </th>
              <th className="table-cell" style={{ width: '10%' }}>
                <div className="matrix-title">ACTIONS</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="table-cell">
                  {editingRowId === row.id ? (
                    <input
                      type="text"
                      className="input-field"
                      value={newRow.task}
                      onChange={(e) => setNewRow({ ...newRow, task: e.target.value })}
                      placeholder="Enter task/process"
                    />
                  ) : (
                    row.task
                  )}
                </td>
                <td className="table-cell">
                  {editingRowId === row.id ? (
                    <Select
                      className="w-full"
                      options={employeeOptions}
                      value={employeeOptions.find(option => option.value === newRow.accountable_person)}
                      onChange={(option) => setNewRow({ 
                        ...newRow, 
                        accountable_person: (option as unknown as SelectOption)?.value || '' 
                      })}
                      placeholder="Select accountable person"
                      isClearable
                      isSearchable
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      components={{
                        Option: CustomOption,
                        SingleValue: CustomSingleValue
                      }}
                      filterOption={(option, inputValue) => {
                        return option.label.toLowerCase().includes(inputValue.toLowerCase());
                      }}
                    />
                  ) : (
                    `${employees.find(emp => emp.id === row.accountable_person)?.first_name} ${employees.find(emp => emp.id === row.accountable_person)?.last_name}`
                  )}
                </td>
                <td className="table-cell">
                  {editingRowId === row.id ? (
                    <Select<SelectOption, true>
                      options={employeeOptions}
                      isMulti
                      value={employeeOptions.filter(option => 
                        newRow.team_involved.includes(option.value)
                      )}
                      onChange={(options) => setNewRow({ 
                        ...newRow, 
                        team_involved: options ? options.map(option => option.value) : [] 
                      })}
                      placeholder="Select team members"
                      isSearchable
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      closeMenuOnSelect={false}
                      components={{
                        Option: CustomOption,
                        MultiValue: CustomMultiValue
                      }}
                      filterOption={(option, inputValue) => {
                        return option.label.toLowerCase().includes(inputValue.toLowerCase());
                      }}
                    />
                  ) : (
                    <TeamMemberLabels teamMemberIds={row.team_involved} />
                  )}
                </td>
                <td className="table-cell">
                  {editingRowId === row.id ? (
                    <input
                      type="text"
                      className="input-field"
                      value={newRow.dependency}
                      onChange={(e) => setNewRow({ ...newRow, dependency: e.target.value })}
                      placeholder="Enter dependencies"
                    />
                  ) : (
                    row.dependency
                  )}
                </td>
                <td className="table-cell">
                  {editingRowId === row.id ? (
                    <input
                      type="text"
                      className="input-field"
                      value={newRow.frequency}
                      onChange={(e) => setNewRow({ ...newRow, frequency: e.target.value })}
                      placeholder="Enter frequency"
                    />
                  ) : (
                    row.frequency
                  )}
                </td>
                <td className="table-cell">
                  <div className="button-container">
                    {editingRowId === row.id ? (
                      <button
                        onClick={handleUpdateRow}
                        className="button-success"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditRow(row.id)}
                        className="button-primary"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="button-danger"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!editingRowId && (
              <tr>
                <td className="table-cell">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter task/process"
                    value={newRow.task}
                    onChange={(e) => setNewRow({ ...newRow, task: e.target.value })}
                  />
                </td>
                <td className="table-cell">
                  <Select
                    className="w-full"
                    options={employeeOptions}
                    value={employeeOptions.find(option => option.value === newRow.accountable_person)}
                    onChange={(option) => setNewRow({ 
                      ...newRow, 
                      accountable_person: (option as unknown as SelectOption)?.value || '' 
                    })}
                    placeholder="Select accountable person"
                    isClearable
                    isSearchable
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    components={{
                      Option: CustomOption,
                      SingleValue: CustomSingleValue
                    }}
                    filterOption={(option, inputValue) => {
                      return option.label.toLowerCase().includes(inputValue.toLowerCase());
                    }}
                  />
                </td>
                <td className="table-cell">
                  <Select<SelectOption, true>
                    options={employeeOptions}
                    isMulti
                    value={employeeOptions.filter(option => 
                      newRow.team_involved.includes(option.value)
                    )}
                    onChange={(options) => setNewRow({ 
                      ...newRow, 
                      team_involved: options ? options.map(option => option.value) : [] 
                    })}
                    placeholder="Select team members"
                    isSearchable
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    closeMenuOnSelect={false}
                    components={{
                      Option: CustomOption,
                      MultiValue: CustomMultiValue
                    }}
                    filterOption={(option, inputValue) => {
                      return option.label.toLowerCase().includes(inputValue.toLowerCase());
                    }}
                  />
                </td>
                <td className="table-cell">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter dependencies"
                    value={newRow.dependency}
                    onChange={(e) => setNewRow({ ...newRow, dependency: e.target.value })}
                  />
                </td>
                <td className="table-cell">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter frequency"
                    value={newRow.frequency}
                    onChange={(e) => setNewRow({ ...newRow, frequency: e.target.value })}
                  />
                </td>
                <td className="table-cell">
                  <div className="button-container">
                    <button
                      onClick={handleAddRow}
                      className="button-primary"
                    >
                      Add Row
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountabilityMatrix;
