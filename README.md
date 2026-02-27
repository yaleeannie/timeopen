This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

<!-- 아래부터 TimeOpen MVP 문서 -->


# TimeOpen MVP 사용 시나리오 (검증용)

TimeOpen은 “캘린더/미팅 스케줄러”가 아니라  
인스타 기반 1인 사업자를 위한 **시술/작업 예약 자동화 도구**다.

핵심은 슬롯을 저장하지 않고,
**duration + buffer 기반으로 예약 가능 시작시간을 항상 계산**하는 것이다.

---

## 1) 사업자(판매자) 사용 흐름

1. `/owner` 접속
2. **영업시간 설정으로 이동** → `/settings/availability`
   - 요일별 work/break 규칙을 저장한다. (Weekly Availability)
3. (선택) 특정 날짜에만 예외 설정
   - Exception Day는 특정 날짜에 대해 **단일 override**다.
   - 휴무 처리 또는 시간대 변경이 가능하다.
4. 고객에게 예약 링크 공유
   - 예: `http://localhost:3000/u/demo`

---

## 2) 고객 사용 흐름

1. 예약 링크 접속 (`/u/demo`)
2. 날짜/서비스 선택
3. 시스템이 계산한 “예약 가능 시작시간” 중 하나를 선택
4. 예약 완료

> 예약 가능 시작시간은 DB에 저장된 값이 아니라,
> 매번 계산으로 생성되는 값이다.

---

## 3) 사업자 예약 확인 흐름 (Debug View)

1. `/reservations?handle=demo` 접속
2. 예약 목록을 텍스트로 확인한다.
   - date, start_time, end_time, status

⚠️ `/reservations`는 관리 도구가 아니라 **시스템 동작 검증용 관찰 창(Debug View)**이다.  
수정/삭제/필터/검색/캘린더 UI 등으로 절대 확장하지 않는다.

---

## TimeOpen이 저장하는 것 / 저장하지 않는 것

### 저장하는 것
- Weekly Availability 규칙
- Exception Day 규칙 (특정 날짜 단일 override)
- Reservation (확정된 예약 데이터)

### 저장하지 않는 것
- Available Start Times (예약 가능 시작시간)
- Daily Schedule (일일 계산 결과)
- Slot 데이터
- 계산 결과 캐시

---

## 데모 재실행 체크리스트 (한 번 끝까지)

1) Availability 새로 설정  
2) 테스트 예약 1건 생성  
3) `/reservations?handle=demo` 새로고침 → 방금 예약이 보이면 종료  

문제가 없으면 **더 이상 수정하지 않는다.**
이 시점부터 TimeOpen은 “개발”이 아니라 “검증” 단계다.

## Demo Data Rule (중요)

- handle=demo 는 반드시 하나의 organization에만 매핑되어야 한다.
- Availability / Booking / Reservation 모든 동작은 이 동일 organization 기준으로 수행된다.

## Demo Flow (How TimeOpen is Used)

### Owner (사업자)
1. /owner 접속
2. 영업시간 설정 (Weekly Availability)
3. 고객에게 예약 링크 전달
4. /reservations 에서 예약 확인

### Customer (고객)
1. 예약 링크 접속
2. 서비스 선택
3. 날짜 선택
4. 가능한 시간 선택
5. 예약 완료

## Product Principles

TimeOpen은 다음만 저장한다:

- Weekly 영업시간 규칙
- 특정 날짜 예외(Exception)
- 예약(Reservation)

TimeOpen은 가능한 시간(Start Time)을 저장하지 않는다.

모든 가능한 시간은 요청 시점에 계산된다.