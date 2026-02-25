import { BookingService } from "./types";

export const MOCK_SERVICES: BookingService[] = [
  {
    id: "cut",
    name: "커트",
    description: "디자인 상담 후 맞춤 커트 진행",
    durationMin: 30,
    bufferMin: 10,
    price: 25000,
  },
  {
    id: "color",
    name: "염색",
    description: "컬러 상담 + 전체 염색 + 마무리 케어",
    durationMin: 90,
    bufferMin: 15,
    price: 90000,
  },
  {
    id: "perm",
    name: "펌",
    description: "모발 상태 진단 후 맞춤 펌 시술",
    durationMin: 120,
    bufferMin: 20,
    price: 120000,
  },
];

export const MOCK_AVAILABLE_TIMES: string[] = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];
