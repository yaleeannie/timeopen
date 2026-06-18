import { createSupabaseServerClient } from "@/lib/supabase/server";
import SplashRedirect from "./SplashRedirect";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const destination = user ? "/owner" : "/login";

  return (
    <main className="flex min-h-screen overflow-x-hidden bg-[#eef6f8] px-4 py-6 text-gray-900">
      <div className="mx-auto flex w-full min-w-0 max-w-lg items-center justify-center">
        <div className="w-full rounded-[32px] bg-[#fbfdfe] px-6 py-16 text-center shadow-[0_20px_60px_rgba(80,145,164,0.14)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#5bd8f2] to-[#24b8df] text-3xl font-black text-white shadow-[0_14px_30px_rgba(40,185,220,0.24)]">
            T
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-[-0.05em]">TimeOpen</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            예약 링크 하나로 끝나는 스케줄링
          </p>
          <div className="mx-auto mt-8 h-1.5 w-24 overflow-hidden rounded-full bg-[#e5f3f6]">
            <div className="h-full w-2/3 rounded-full bg-[#28b9dc]" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-400">잠시만 기다려주세요.</p>
          <SplashRedirect destination={destination} />
        </div>
      </div>
    </main>
  );
}
