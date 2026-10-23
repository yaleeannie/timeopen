import { NextResponse } from "next/server";

export const MAINTENANCE_MESSAGE =
  "TimeOpen 서비스를 일시 중지 중입니다. 준비가 완료되면 다시 이용해 주세요.";

export function isMaintenanceMode() {
  return process.env.TIMEOPEN_MAINTENANCE_MODE?.trim().toLowerCase() === "true";
}

export function maintenanceApiResponse(message = MAINTENANCE_MESSAGE) {
  return NextResponse.json(
    { error: message },
    { status: 503, headers: { "Retry-After": "3600" } }
  );
}

export function isDatabaseMaintenanceError(error: unknown) {
  if (typeof error === "string") {
    return error.includes("TIMEOPEN_MAINTENANCE_MODE");
  }
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown };
  return (
    candidate.code === "P0001" &&
    typeof candidate.message === "string" &&
    candidate.message.includes("TIMEOPEN_MAINTENANCE_MODE")
  );
}
