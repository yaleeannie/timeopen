# 비활성/미완료 계정 운영 가이드

이 문서는 베타 운영자가 장기간 사용되지 않거나 설정이 완료되지 않은 TimeOpen 계정을 검토하기 위한 내부 참고 자료입니다.

중요 원칙:

- 이 문서는 자동 삭제 로직이 아닙니다.
- 사용자 또는 조직 데이터를 삭제하기 전에 반드시 수동 검토가 필요합니다.
- `auth.users` 직접 수정, 삭제, 익명화는 Supabase 관리자 권한이 필요한 운영 작업이며 앱 코드나 클라이언트 코드에서 수행하지 않습니다.
- 예약 내역이 있는 계정은 예약 분쟁, 고객 문의, 법령상 보관 필요성을 먼저 확인해야 합니다.
- 탈퇴 요청 계정은 별도 탈퇴/데이터 처리 정책에 따라 검토합니다.
- 고객 예약 데이터는 매장 운영자 계정 데이터와 별도로 취급해야 합니다.

## 미완료 계정의 예

다음 조건은 검토 후보를 찾기 위한 기준입니다. 조건에 해당한다고 해서 즉시 삭제하지 않습니다.

- 이메일 인증이 완료되지 않은 계정
- 온보딩 또는 샵 설정이 완료되지 않은 계정
- 기본 샵 이름인 `내 샵` 상태로 장기간 유지된 계정
- 서비스가 하나도 등록되지 않은 조직
- 예약 링크(handle)가 없거나 공개 예약 링크를 사용한 흔적이 없는 조직
- 예약 내역이 없는 조직

## 베타 운영 기준 제안

- 이메일 미인증 14~30일 경과: 삭제 또는 재안내 검토 후보
- 온보딩/샵 설정 미완료 30일 경과: 리마인드 안내 후보
- 예약 링크 사용 이력 또는 예약 내역 없음 60~90일 경과: 비활성 후보
- 실제 예약 내역이 있는 계정: 자동 삭제 금지, 수동 검토 필수
- 탈퇴 요청 계정: `withdrawal_requested_at`, `disabled_at`, `booking_enabled` 상태를 확인하고 탈퇴 처리 정책에 따름

## 운영 시 주의사항

- 삭제 전 가능하면 이메일 등 적절한 방법으로 사전 안내합니다.
- `organization_members`, `organizations`, `reservations` 관계를 함께 확인합니다.
- 고객 예약 데이터는 예약 관리 및 분쟁 대응 목적이 남아 있는지 별도로 판단합니다.
- 예약 고객 연락처나 예약 데이터는 미완료 owner 계정 정리 대상 선정에 사용하지 않습니다.
- 아래 SQL은 운영자가 Supabase SQL Editor 등 관리자 환경에서 참고할 수 있는 예시입니다. 자동화 작업으로 등록하지 않습니다.

## SQL 예시

### 서비스가 없는 조직

```sql
select
  o.id,
  o.name,
  o.handle,
  o.created_at,
  o.booking_enabled,
  o.withdrawal_requested_at,
  o.disabled_at
from public.organizations o
left join public.services s
  on s.organization_id = o.id
group by o.id
having count(s.id) = 0
order by o.created_at asc;
```

### 예약 내역이 없는 조직

```sql
select
  o.id,
  o.name,
  o.handle,
  o.created_at
from public.organizations o
left join public.reservations r
  on r.organization_id = o.id
group by o.id
having count(r.id) = 0
order by o.created_at asc;
```

### 기본 샵 이름이 유지된 조직

```sql
select
  id,
  name,
  handle,
  created_at,
  booking_enabled
from public.organizations
where name in ('내 샵', '내 매장')
order by created_at asc;
```

### 예약 링크가 아직 없는 조직

```sql
select
  id,
  name,
  handle,
  created_at,
  booking_enabled
from public.organizations
where handle is null
   or btrim(handle) = ''
order by created_at asc;
```

### 온보딩 동의는 있으나 설정이 거의 없는 멤버/조직 후보

`organization_members`에 법적 동의 시각이 저장되어 있는 경우의 참고 쿼리입니다.

```sql
select
  om.user_id,
  om.organization_id,
  om.role,
  om.terms_agreed_at,
  om.privacy_agreed_at,
  o.name,
  o.handle,
  o.created_at
from public.organization_members om
join public.organizations o
  on o.id = om.organization_id
where (o.handle is null or btrim(o.handle) = '')
   or o.name in ('내 샵', '내 매장')
order by o.created_at asc;
```

### 이메일 인증이 완료되지 않은 사용자 후보

`auth.users`는 관리자 환경에서만 조회합니다. 앱 클라이언트나 일반 서버 코드에서 이 쿼리를 사용하지 않습니다.

```sql
select
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
from auth.users
where email_confirmed_at is null
order by created_at asc;
```

### 탈퇴 요청 또는 비활성 처리된 조직

```sql
select
  id,
  name,
  handle,
  booking_enabled,
  withdrawal_requested_at,
  disabled_at,
  withdrawal_reason
from public.organizations
where withdrawal_requested_at is not null
   or disabled_at is not null
   or booking_enabled = false
order by coalesce(withdrawal_requested_at, disabled_at, created_at) desc;
```

## 향후 자동화 전 체크리스트

자동 삭제나 익명화 작업을 구현하기 전에는 다음이 필요합니다.

- 삭제/익명화 대상 기준 확정
- 사전 안내 이메일/알림 절차
- 예약 내역이 있는 조직 제외 또는 별도 처리 기준
- 법령상 보관 기간 검토
- 운영자 승인 절차
- dry-run 리포트
- 복구 불가능 작업에 대한 감사 로그
