export async function fetchExceptionForDate(params: {
  organizationId: string;
  dateISO: string;
}) {
  const res = await fetch("/api/fetchException", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) return null;

  const json = await res.json();
  return json?.data ?? null;
}