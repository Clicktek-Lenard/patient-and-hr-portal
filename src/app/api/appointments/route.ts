import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Since there's no CMS appointment module, this uses the portal DB for appointment bookings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Return upcoming appointments for this user
    const appointments = await prisma.portalAppointment.findMany({
      where: { userId: session.user.id },
      orderBy: { appointmentDate: "asc" },
    });

    // Available slots — generate for next 14 days (static example, replace with real CMS slots)
    const slots = generateAvailableSlots();

    return NextResponse.json({ data: { appointments, slots } });
  } catch (error) {
    console.error("[GET_APPOINTMENTS]", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { appointmentDate, appointmentTime, packageType, branch, notes } = body;

    if (!appointmentDate || !appointmentTime) {
      return NextResponse.json({ error: "Date and time are required" }, { status: 400 });
    }

    const appointment = await prisma.portalAppointment.create({
      data: {
        userId: session.user.id,
        appointmentDate: new Date(`${appointmentDate}T${appointmentTime}:00`),
        packageType: packageType ?? "General Check-up",
        branch: branch ?? "Main Branch",
        notes: notes ?? null,
        status: "confirmed",
      },
    });

    return NextResponse.json({ data: appointment });
  } catch (error) {
    console.error("[POST_APPOINTMENT]", error);
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}

function generateAvailableSlots() {
  const slots = [];
  const packages = ["Annual PE", "CBC Panel", "Lipid Panel", "Urinalysis", "General Check-up"];
  const times = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

  for (let d = 1; d <= 14; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends
    const dateStr = date.toISOString().split("T")[0];

    for (const time of times.slice(0, 3)) {
      slots.push({
        id:          `${dateStr}-${time}`,
        date:        dateStr,
        time,
        packageType: packages[Math.floor(Math.random() * packages.length)],
        available:   Math.floor(Math.random() * 5) + 1,
        total:       5,
      });
    }
  }

  return slots.slice(0, 12);
}
