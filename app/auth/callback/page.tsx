// app/auth/callback/page.tsx
import CallbackClient from "./CallbackClient";

export default function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; next?: string };
}) {
  const code = searchParams.code ?? null;
  const next = searchParams.next ?? "/owner";

  return <CallbackClient code={code} nextPath={next} />;
}