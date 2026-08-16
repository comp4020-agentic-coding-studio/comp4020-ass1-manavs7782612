export interface EmployeeRow {
  id: number;
  name: string;
  department: string;
  salary: number;
}

export const HEADER = ["Employee ID", "Name", "Department", "Salary"] as const;

export const ROWS: EmployeeRow[] = [
  { id: 101, name: "Alice Chen", department: "Marketing", salary: 68000 },
  { id: 102, name: "Ben Osei", department: "Finance", salary: 72000 },
  { id: 103, name: "Carla Nguyen", department: "Engineering", salary: 91000 },
  { id: 104, name: "Dev Patel", department: "Engineering", salary: 84000 },
  { id: 105, name: "Ellie Ho", department: "Sales", salary: 65000 },
];

export const EMPLOYEE_GRID_ROWS: string[][] = ROWS.map((row) => [
  String(row.id),
  row.name,
  row.department,
  row.salary.toLocaleString(),
]);
