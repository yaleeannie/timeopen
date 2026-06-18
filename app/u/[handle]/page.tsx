import PublicBookingPage from "@/features/booking/components/PublicBookingPage";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function UserBookingPage({ params }: Props) {
  const { handle } = await params;

  return <PublicBookingPage handle={handle} />;
}
