import BookingScreen from "@/features/booking/components/BookingScreen";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function UserBookingPage({ params }: Props) {
  const { handle } = await params;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef6f8] px-3 py-4 text-gray-900 sm:px-5 sm:py-7">
      <div className="mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] bg-[#fbfdfe] shadow-[0_20px_60px_rgba(80,145,164,0.14)] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-6 sm:px-6 sm:pb-9 sm:pt-8">
          <header className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#5bd8f2] to-[#24b8df] text-2xl font-black text-white shadow-[0_12px_26px_rgba(40,185,220,0.22)]">T</div>
            <div className="mt-4 text-sm font-bold text-[#28b9dc]">TimeOpen</div>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">예약하기</h1>
            <p className="mt-2 text-sm leading-5 text-gray-500">서비스와 방문 시간을 선택해주세요.</p>
          </header>

          <BookingScreen handle={handle} />
        </div>
      </div>
    </main>
  );
}
