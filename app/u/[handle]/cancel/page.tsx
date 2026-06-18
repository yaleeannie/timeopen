import Link from "next/link";

type Props = {
  params: { handle: string };
};

export default function Page({ params }: Props) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef6f8] px-3 py-4 text-gray-900 sm:px-5 sm:py-7">
      <div className="mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] bg-[#fbfdfe] shadow-[0_20px_60px_rgba(80,145,164,0.14)] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-8 text-center sm:px-6 sm:pb-9 sm:pt-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef9fb] text-3xl font-black text-[#4d9caf]">
            ···
          </div>
          <div className="mt-5 text-sm font-bold text-[#28b9dc]">TimeOpen</div>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
            예약 취소 화면은 준비 중입니다
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            현재 이 화면에서는 예약을 취소할 수 없습니다.
          </p>

          <div className="mt-6 rounded-[24px] border border-[#e5f3f6] bg-white p-5 text-left shadow-sm">
            <div className="text-base font-black">안내</div>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              예약 변경이나 취소가 필요하면 예약한 매장에 직접 문의해주세요.
            </p>
          </div>

          <Link
            href={`/u/${params.handle}`}
            className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#28b9dc] px-4 py-3 text-base font-black text-white shadow-sm transition hover:bg-[#20afd2]"
          >
            예약 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
