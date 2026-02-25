import BookingScreen from "@/features/booking/components/BookingScreen";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function UserBookingPage({ params }: Props) {
  const { handle } = await params;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-10">
        <BookingScreen handle={handle} />
      </div>
    </main>
  );
}