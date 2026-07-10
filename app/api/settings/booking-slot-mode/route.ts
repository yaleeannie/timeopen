import { NextResponse } from "next/server";
import {
  type BookingSlotIntervalMinutes,
  type BookingSlotMode,
  validateBookingSlotInterval,
  validateBookingSlotMode,
} from "@/features/booking/slotMode";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function logBookingSlotSettingsFailure(
  reason: string,
  details: Record<string, unknown>
) {
  console.error("[booking-slot-settings] failed", {
    reason,
    ...details,
  });
}

function isMissingIntervalColumnError(error: { message?: string; code?: string }) {
  const message = error.message ?? "";

  return (
    message.includes("booking_slot_interval_min") ||
    message.includes("Could not find the 'booking_slot_interval_min' column") ||
    message.includes("schema cache") ||
    error.code === "PGRST204" ||
    error.code === "42703"
  );
}

export async function POST(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (error || !organizationId) {
    logBookingSlotSettingsFailure("owner_context", {
      organizationId,
      error,
    });
    return NextResponse.json(
      { error: error ?? "샵 정보를 찾을 수 없습니다." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const bodyKeys =
    body && typeof body === "object" && !Array.isArray(body) ? Object.keys(body) : [];
  const updates: {
    booking_slot_mode?: BookingSlotMode;
    booking_slot_interval_min?: BookingSlotIntervalMinutes;
  } = {};

  if (body && Object.prototype.hasOwnProperty.call(body, "booking_slot_mode")) {
    const validation = validateBookingSlotMode(body?.booking_slot_mode);

    if (!validation.ok) {
      logBookingSlotSettingsFailure("invalid_mode", {
        organizationId,
        bodyKeys,
        value: body?.booking_slot_mode,
        error: validation.error,
      });
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    updates.booking_slot_mode = validation.value as BookingSlotMode;
  }

  const hasSnakeCaseInterval =
    body && Object.prototype.hasOwnProperty.call(body, "booking_slot_interval_min");
  const hasCamelCaseInterval =
    body && Object.prototype.hasOwnProperty.call(body, "bookingSlotIntervalMin");

  if (hasSnakeCaseInterval || hasCamelCaseInterval) {
    const intervalValue = hasSnakeCaseInterval
      ? body?.booking_slot_interval_min
      : body?.bookingSlotIntervalMin;
    const validation = validateBookingSlotInterval(intervalValue);

    if (!validation.ok) {
      logBookingSlotSettingsFailure("invalid_interval", {
        organizationId,
        bodyKeys,
        value: intervalValue,
        error: validation.error,
      });
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    updates.booking_slot_interval_min = validation.value;
  }

  if (Object.keys(updates).length === 0) {
    logBookingSlotSettingsFailure("empty_updates", {
      organizationId,
      bodyKeys,
    });
    return NextResponse.json({ error: "저장할 예약 설정이 없습니다." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if ("booking_slot_interval_min" in updates) {
    const { error: columnCheckError } = await supabase
      .from("organizations")
      .select("booking_slot_interval_min")
      .eq("id", organizationId)
      .limit(1);

    if (columnCheckError) {
      logBookingSlotSettingsFailure("column_check", {
        organizationId,
        bodyKeys,
        intervalValue: updates.booking_slot_interval_min,
        supabaseCode: columnCheckError.code,
        supabaseMessage: columnCheckError.message,
        supabaseDetails: columnCheckError.details,
        supabaseHint: columnCheckError.hint,
      });

      if (isMissingIntervalColumnError(columnCheckError)) {
        return NextResponse.json(
          {
            error:
              "예약 시간 단위 저장 컬럼이 아직 적용되지 않았어요. 로컬 DB에 최신 마이그레이션을 적용해주세요.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: columnCheckError.message }, { status: 400 });
    }
  }

  const { error: updateError } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", organizationId);

  if (updateError) {
    logBookingSlotSettingsFailure("update", {
      organizationId,
      bodyKeys,
      intervalValue: updates.booking_slot_interval_min,
      modeValue: updates.booking_slot_mode,
      supabaseCode: updateError.code,
      supabaseMessage: updateError.message,
      supabaseDetails: updateError.details,
      supabaseHint: updateError.hint,
    });

    if ("booking_slot_interval_min" in updates && isMissingIntervalColumnError(updateError)) {
      return NextResponse.json(
        {
          error:
            "예약 시간 단위 저장 컬럼이 아직 적용되지 않았어요. 로컬 DB에 최신 마이그레이션을 적용해주세요.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    ...updates,
  });
}
