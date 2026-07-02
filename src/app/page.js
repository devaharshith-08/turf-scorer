import connectDb from "@/lib/dbConnect";
import Match from "@/models/Match";
import DashboardClient from "@/components/dashboard/DashboardClient";

// This page reads live data straight from MongoDB via Mongoose (not
// fetch()), so Next.js can't auto-detect it as dynamic and may cache the
// rendered output (Full Route Cache) and/or serve a stale copy on
// client-side navigations (Router Cache). That staleness is exactly what
// was causing a genuinely live match to vanish from Live Matches after
// navigating away and back. Forcing dynamic rendering makes this page
// re-run fresh on every request/navigation.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Any 'live' match with no ball scored in the last 30 minutes is treated
// as abandoned. Checked on every dashboard load (no cron available on
// Vercel) — cheap because it only touches matches that are actually
// stale, and reuses the existing 'completed' + TTL-delete pipeline.
const ABANDON_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

async function sweepAbandonedMatches() {
  const cutoff = new Date(Date.now() - ABANDON_THRESHOLD_MS);

  await Match.updateMany(
    { status: "live", updatedAt: { $lt: cutoff } },
    {
      $set: {
        status: "completed",
        result: "Match Abandoned",
        completedAt: new Date(),
      },
    }
  );
}

export default async function HomePage() {
  await connectDb();

  await sweepAbandonedMatches();

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