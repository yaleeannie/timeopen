export type BookingService = {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  bufferMin: number;
  price: number;
};

export const MOCK_SERVICES: BookingService[] = [
  {
    id: "cut",
    name: "Haircut",
    description: "디자인 상담 후 맞춤 커트 진행",
    durationMin: 30,
    bufferMin: 10,
    price: 25000,
  },
  {
    id: "color",
    name: "Hair Color",
    description: "컬러 상담 + 전체 염색 + 마무리 케어",
    durationMin: 90,
    bufferMin: 15,
    price: 90000,
  },
  {
    id: "perm",
    name: "Perm",
    description: "모발 상태 진단 후 맞춤 펌 시술",
    durationMin: 120,
    bufferMin: 20,
    price: 120000,
  },
];