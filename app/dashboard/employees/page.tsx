"use client";

import { useEffect, useState } from "react";

type Employee = {
  id: number;
  name: string;
  email: string;
  department: string | null;
  designation: string | null;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);

      const response = await fetch("/api/employees");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load employees.");
      }

      setEmployees(data.employees);
    } catch (error) {
      console.error(error);
      alert("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }

  function toggleEmployee(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((employeeId) => employeeId !== id)
        : [...current, id]
    );
  }

  function selectAll() {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map((employee) => employee.id));
    }
  }

  async function addEmployee() {
    if (!name.trim() || !email.trim()) {
      alert("Name and email are required.");
      return;
    }

    try {
      setAdding(true);

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          department: department.trim(),
          designation: designation.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add employee.");
      }

      alert("Employee added successfully.");

      setName("");
      setEmail("");
      setDepartment("");
      setDesignation("");
      setShowAddForm(false);

      await loadEmployees();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to add employee."
      );
    } finally {
      setAdding(false);
    }
  }

  async function removeEmployee(id: number) {
    const employee = employees.find((item) => item.id === id);

    if (!employee) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${employee.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/employees", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to remove employee.");
      }

      setEmployees((current) =>
        current.filter((item) => item.id !== id)
      );

      setSelectedIds((current) =>
        current.filter((employeeId) => employeeId !== id)
      );

      alert("Employee removed successfully.");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to remove employee."
      );
    }
  }

  function handleContinue() {
    if (selectedIds.length === 0) {
      alert("Please select at least one employee.");
      return;
    }

    localStorage.setItem(
      "selectedEmployeeIds",
      JSON.stringify(selectedIds)
    );

    window.location.href = "/dashboard/ai-generation";
  }

  const filteredEmployees = employees.filter((employee) => {
    const searchText = search.toLowerCase();

    return (
      employee.name.toLowerCase().includes(searchText) ||
      employee.email.toLowerCase().includes(searchText) ||
      (employee.department || "")
        .toLowerCase()
        .includes(searchText) ||
      (employee.designation || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold">
              Select Employees
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Choose employees who should receive the event email.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
          >
            + Add Employee
          </button>

        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-8 py-10">

        {/* Search and controls */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none focus:border-blue-500 md:flex-1"
            />

            <div className="flex gap-3">

              <span className="rounded-full bg-blue-600/20 px-5 py-3 text-blue-400">
                {selectedIds.length} selected
              </span>

              <span className="rounded-full bg-slate-800 px-5 py-3 text-slate-300">
                {employees.length} employees
              </span>

              <button
                type="button"
                onClick={selectAll}
                className="rounded-lg bg-slate-700 px-5 py-3 font-medium hover:bg-slate-600"
              >
                {selectedIds.length === employees.length
                  ? "Clear All"
                  : "Select All"}
              </button>

            </div>
          </div>
        </div>

        {/* Employee table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-800">

                <tr>
                  <th className="px-6 py-5 text-left">
                    Select
                  </th>

                  <th className="px-6 py-5 text-left">
                    Employee
                  </th>

                  <th className="px-6 py-5 text-left">
                    Email
                  </th>

                  <th className="px-6 py-5 text-left">
                    Department
                  </th>

                  <th className="px-6 py-5 text-left">
                    Designation
                  </th>

                  <th className="px-6 py-5 text-left">
                    Action
                  </th>
                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-slate-400"
                    >
                      Loading employees...
                    </td>
                  </tr>

                ) : filteredEmployees.length === 0 ? (

                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-slate-400"
                    >
                      No employees found.
                    </td>
                  </tr>

                ) : (

                  filteredEmployees.map((employee) => (

                    <tr
                      key={employee.id}
                      className="border-t border-slate-800 hover:bg-slate-800/50"
                    >

                      <td className="px-6 py-5">

                        <input
                          type="checkbox"
                          checked={selectedIds.includes(employee.id)}
                          onChange={() =>
                            toggleEmployee(employee.id)
                          }
                          className="h-5 w-5 cursor-pointer"
                        />

                      </td>

                      <td className="px-6 py-5 font-medium">
                        {employee.name}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {employee.email}
                      </td>

                      <td className="px-6 py-5">

                        {employee.department ? (
                          <span className="rounded-full bg-blue-600/20 px-4 py-2 text-blue-400">
                            {employee.department}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            —
                          </span>
                        )}

                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {employee.designation || "—"}
                      </td>

                      <td className="px-6 py-5">

                        <button
                          type="button"
                          onClick={() =>
                            removeEmployee(employee.id)
                          }
                          className="rounded-lg bg-red-600/20 px-4 py-2 font-medium text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          Remove
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>
        </div>

        {/* Continue */}
        <div className="mt-6 flex justify-end">

          <button
            type="button"
            onClick={handleContinue}
            className="rounded-lg bg-blue-600 px-10 py-4 text-lg font-semibold hover:bg-blue-500"
          >
            Continue
          </button>

        </div>

      </section>

      {/* Add Employee Modal */}
      {showAddForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-bold">
                  Add Employee
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Add a new employee to the MySQL database.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-2xl text-slate-400 hover:text-white"
              >
                ×
              </button>

            </div>

            <div className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Employee Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter employee name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Department
                </label>

                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="IT, HR, Finance..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Designation
                </label>

                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Software Developer"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <div className="mt-8 flex gap-3">

              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg bg-slate-700 py-3 font-semibold hover:bg-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addEmployee}
                disabled={adding}
                className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Employee"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}