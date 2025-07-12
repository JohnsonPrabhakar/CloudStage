import BoostedEvents from "@/components/BoostedEvents";

export const dynamic = 'force-dynamic';

export default function BoostedEventsPage() {
  // Data will now be fetched on the client side from Firestore
  return <BoostedEvents />;
}
