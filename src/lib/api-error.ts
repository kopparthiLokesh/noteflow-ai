import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function handleError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid input",
        issues: error.issues,
      },
      { status: 400 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return NextResponse.json(
          { error: "A record with this value already exists." },
          { status: 409 },
        );

      case "P2025":
        return NextResponse.json(
          { error: "Requested record not found." },
          { status: 404 },
        );

      case "P2003":
        return NextResponse.json(
          { error: "Invalid related record." },
          { status: 400 },
        );
    }
  }

  return NextResponse.json(
    { error: "Internal server error. Please try again." },
    { status: 500 },
  );
}
