import { prisma } from "@/lib/prisma";

// GET — Fetch all employees
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return Response.json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch employees.",
      },
      { status: 500 }
    );
  }
}

// POST — Add a new employee
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      department,
      designation,
      dateOfBirth,
    } = body;

    if (!name || !email) {
      return Response.json(
        {
          success: false,
          message: "Name and email are required.",
        },
        { status: 400 }
      );
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: {
        email,
      },
    });

    if (existingEmployee) {
      return Response.json(
        {
          success: false,
          message: "An employee with this email already exists.",
        },
        { status: 409 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        department: department || null,
        designation: designation || null,
        date_of_birth: dateOfBirth
          ? new Date(`${dateOfBirth}T00:00:00.000Z`)
          : null,
      },
    });

    return Response.json({
      success: true,
      message: "Employee added successfully.",
      employee,
    });
  } catch (error) {
    console.error("Error adding employee:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to add employee.",
      },
      { status: 500 }
    );
  }
}

// DELETE — Remove an employee
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json(
        {
          success: false,
          message: "Employee ID is required.",
        },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!employee) {
      return Response.json(
        {
          success: false,
          message: "Employee not found.",
        },
        { status: 404 }
      );
    }

    await prisma.employee.delete({
      where: {
        id: Number(id),
      },
    });

    return Response.json({
      success: true,
      message: "Employee removed successfully.",
    });
  } catch (error) {
    console.error("Error removing employee:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to remove employee.",
      },
      { status: 500 }
    );
  }
}