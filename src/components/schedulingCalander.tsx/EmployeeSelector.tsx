// components/EmployeeSelector.tsx
"use client";
export type Employee = {
  id: string;
  name: string;
  avatarUrl?: string;
};

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployeeIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

const EmployeeSelector = ({
  employees,
  selectedEmployeeIds,
  onSelectionChange,
}: EmployeeSelectorProps) => {
  const toggleEmployee = (id: string) => {
    if (selectedEmployeeIds.includes(id)) {
      onSelectionChange(selectedEmployeeIds.filter((empId) => empId !== id));
    } else {
      onSelectionChange([...selectedEmployeeIds, id]);
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Team Members</h3>
      <div className="flex flex-wrap gap-2">
        {employees.map((employee) => (
          <button
            key={employee.id}
            onClick={() => toggleEmployee(employee.id)}
            className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
              selectedEmployeeIds.includes(employee.id)
                ? "bg-blue-100 text-blue-800 border-blue-300"
                : "bg-gray-100 text-gray-800 border-gray-200"
            } border`}
          >
            {employee.avatarUrl ? (
              <img
                src={employee.avatarUrl}
                alt={employee.name}
                className="w-5 h-5 rounded-full mr-2"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-300 mr-2 flex items-center justify-center text-xs text-gray-600">
                {employee.name.charAt(0)}
              </div>
            )}
            {employee.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmployeeSelector;