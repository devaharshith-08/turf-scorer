import { NextResponse } from "next/server";
import connectDb from "@/lib/dbConnect";
import Match from "@/models/Match";

export async function GET() {
  await connectDb();

  const liveMatches = await Match.find({ status: "live" }).lean();
  const completedMatches = await Match.find({ status: "completed" }).lean();

  return NextResponse.json({ liveMatches, completedMatches });
}