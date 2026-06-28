import connectDb from "@/lib/dbConnect";
import Match from "@/models/Match";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function HomePage() {
  await connectDb();

  const liveMatches = await Match.find({ status: "live" }).lean();
  const completedMatches = await Match.find({ status: "completed" }).lean();

  const initialLiveMatches = JSON.parse(JSON.stringify(liveMatches));
  const initialCompletedMatches = JSON.parse(JSON.stringify(completedMatches));

  return (
    <DashboardClient
      initialLiveMatches={initialLiveMatches}
      initialCompletedMatches={initialCompletedMatches}
    />
  );
}