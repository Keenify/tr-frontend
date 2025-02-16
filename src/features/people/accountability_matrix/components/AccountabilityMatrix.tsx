import { Session } from "@supabase/supabase-js";
import React, { useState, useEffect } from "react";
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";
import { getAllEmployees } from "../../../../services/useUser";
import { UserData } from "../../../../services/useUser";
import Select, { StylesConfig } from 'react-select';
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

  // Convert employees to select options
  const employeeOptions: SelectOption[] = employees.map((employee) => ({
    value: employee.id,
    label: `${employee.first_name} ${employee.last_name}`
  }));

  // Custom styles for the Select components to ensure dropdowns are visible
  const selectStyles: StylesConfig<SelectOption, true> = {
    menu: (base) => ({
      ...base,
      position: 'absolute',
      zIndex: 9999,
      maxHeight: '200px',
      overflowY: 'auto'
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999
    }),
    container: (base) => ({
      ...base,
      zIndex: 100,
      width: '300px'
    }),
    control: (base) => ({
      ...base,
      minHeight: '38px'
    }),
    valueContainer: (base) => ({
      ...base,
      flexWrap: 'wrap',
      maxHeight: '80px',
      overflowY: 'auto'
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

      <div className="overflow-x-auto">
        <table className="matrix-table">
          <thead>
            <tr className="table-header">
              <th className="table-cell">
                <div className="matrix-title">TASK/PROCESS</div>
              </th>
              <th className="table-cell">
                <div className="matrix-title">ACCOUNTABLE</div>
                <div className="header-subtitle">Function/person</div>
              </th>
              <th className="table-cell">
                <div className="matrix-title">THE TEAM</div>
                <div className="header-subtitle">Who else is involved</div>
              </th>
              <th className="table-cell">
                <div className="matrix-title">DEPENDENCY</div>
                <div className="header-subtitle">Who we rely on?</div>
              </th>
              <th className="table-cell">
                <div className="matrix-title">FREQUENCY</div>
                <div className="header-subtitle">How often does this happen?</div>
              </th>
              <th className="table-cell">
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
                      styles={selectStyles}
                      menuPortalTarget={document.body}
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
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      closeMenuOnSelect={false}
                    />
                  ) : (
                    row.team_involved.map(teamMemberId => {
                      const employee = employees.find(emp => emp.id === teamMemberId);
                      return `${employee?.first_name} ${employee?.last_name}`;
                    }).join(', ')
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
                    styles={selectStyles}
                    menuPortalTarget={document.body}
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
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    closeMenuOnSelect={false}
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
