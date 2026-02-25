export type BookingService = {
  id: string;
  name: string;
  description?: string; // 추가
  durationMin: number;
  bufferMin: number;
  price?: number;
};
export type BookingSelection = {
  serviceId: string | null;
  dateISO: string | null; // YYYY-MM-DD
  time: string | null; // "HH:mm"
};
