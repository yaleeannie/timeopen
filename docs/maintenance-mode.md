# TimeOpen 일시 중지 및 재개 안내

이 기능은 서로 다른 세 가지 제어를 사용합니다.

| 설정 | 역할 | 영향 |
| --- | --- | --- |
| `TIMEOPEN_MAINTENANCE_MODE` (Vercel) | 웹 화면과 앱 API의 일시 중지 안내 | 공개 예약 페이지와 앱 신규 생성 API를 막고 공개 경로에 안내를 표시합니다. 기존 로그인, 예약 관리, 고객 취소 경로는 유지합니다. |
| `timeopen_private.service_control.maintenance_mode` (Supabase DB) | DB 쓰기 최종 차단 | 켜면 PostgREST 직접 INSERT와 RPC가 실행하는 `reservations`, `organizations` INSERT를 거부합니다. 기존 행의 UPDATE와 DELETE에는 적용하지 않습니다. |
| `TIMEOPEN_SMS_ENABLED` (Vercel) | 문자 발송 별도 허용 | 값이 정확히 `true`가 아니면 모든 앱 문자 전송을 생략합니다. 유지보수 모드에서는 `true`여도 전송하지 않습니다. |

세 설정은 자동 동기화되지 않습니다. 예약과 매장 생성의 확실한 차단에는 DB 마이그레이션 적용 및 DB 상태 변경이 필요합니다. 이 저장소의 마이그레이션 파일은 준비되어 있지만, 작성 작업 중에는 운영 DB에 적용하지 않았습니다.

## 일시 중지할 때

1. **문자 발송을 먼저 차단합니다.** Vercel 프로젝트의 `Settings → Environment Variables`에서 `TIMEOPEN_SMS_ENABLED`를 `false`로 설정(또는 삭제)하고 Production을 포함한 사용 환경을 선택합니다. 적용하려면 새 배포가 필요합니다. 바로 차단해야 하는 긴급 상황이면 Solapi에서 해당 API 키를 비활성화하는 방법도 있지만, 키를 다시 쓸 수 없게 될 수 있으므로 복구 가능한 새 키 발급 여부를 먼저 확인하세요. 이 코드의 `sendSms`는 설정 확인 후 전화번호/메시지 로그와 Solapi 요청 전에 중단합니다.
2. **신규 회원가입을 끕니다.** Supabase Dashboard에서 프로젝트의 `Authentication → Sign In / Providers` 또는 `Authentication → Settings` 안에 있는 `Allow new users to sign up`(표기가 다를 수 있음)을 끕니다. 기존 사용자의 로그인은 계속 허용됩니다. 앱 미들웨어만으로는 공개 Supabase Auth 엔드포인트에 직접 보내는 `signUp` 요청을 차단할 수 없으므로 이 단계가 반드시 필요합니다. [Supabase Auth 설정 문서](https://supabase.com/docs/guides/auth/general-configuration)
3. **DB 마이그레이션을 별도 검토 후 적용합니다.** 먼저 스테이징에서 이 저장소의 `supabase/migrations/20261023090000_add_timeopen_maintenance_insert_guards.sql`을 검토·적용하고 아래 검증을 통과시킵니다. 운영 적용은 담당자가 승인한 절차로 진행하세요. 이 문서는 마이그레이션을 실행하지 않았습니다.
4. **DB 차단 상태를 켭니다.** Supabase SQL Editor에서 다음 문장을 한 트랜잭션으로 실행합니다.

   ```sql
   begin;
   select pg_catalog.pg_advisory_xact_lock(
     pg_catalog.hashtextextended('timeopen:maintenance-state', 0)
   );
   update timeopen_private.service_control
      set maintenance_mode = true,
          updated_at = now()
    where singleton is true;
   commit;
   ```

   결과가 `UPDATE 1`인지 확인하세요. `UPDATE 0`이면 설정 행이 없는 것이므로 진행하지 말고 담당 개발자에게 확인하세요. 잠금은 실행 중인 INSERT가 끝날 때까지 기다리게 하여, 중지 시점과 동시에 시작된 입력이 상태 검사와 엇갈릴 가능성을 낮춥니다.
5. **웹 안내를 켭니다.** Vercel `Settings → Environment Variables`에서 `TIMEOPEN_MAINTENANCE_MODE=true`로 설정하고 Production 및 해당 Preview 환경을 선택합니다. `TIMEOPEN_SMS_ENABLED=false`도 확인하세요. 변경을 반영하려면 해당 환경에 새 배포가 필요합니다. 코드 변경·환경 변수 설정만으로 자동 배포될지 여부는 프로젝트의 Vercel Git 설정에 따라 다릅니다.

이미 배포된 코드가 현재 코드와 다른 경우, 위 환경 변수만으로 서버의 SMS 중앙 차단 기능이 생기지는 않습니다. 이 변경 코드와 마이그레이션이 검토되고 배포된 뒤에 중지 절차를 진행해야 합니다.

## 기존 사용자와 데이터 영향

- 예약·매장 행은 삭제 또는 수정하지 않습니다. DB 상태 행 하나만 갱신합니다.
- 예약 및 매장의 새 INSERT는 앱 API뿐 아니라 직접 PostgREST와 기존 SECURITY DEFINER RPC에서도 트리거가 검사합니다.
- 트리거는 INSERT만 대상으로 하므로 기존 예약 조회·변경·취소와 사장님 로그인/예약 관리는 이 기능으로 막지 않습니다. 다만 이 요청과 무관한 기존 RLS 또는 애플리케이션 권한은 그대로 적용됩니다.
- 취소/변경/확정은 계속 저장될 수 있으나 문자는 `skipped`로 보고됩니다. 예약 변경 자체는 문자 실패 때문에 취소되지 않습니다.
- `bootstrap_owner` 신규 조직 생성을 막으면 이미 인증된 신규 사용자가 조직 생성 직전 상태에 머물 수 있습니다. Auth 신규 가입을 먼저 끄면 새 계정 유입도 막을 수 있습니다.

## 재개할 때

재개는 데이터를 복구하거나 마이그레이션을 되돌리는 작업이 아닙니다.

1. 신규 매장/예약을 받을 준비가 되었는지 확인합니다.
2. Supabase SQL Editor에서 동일한 advisory lock을 잡고 DB 상태를 끕니다.

   ```sql
   begin;
   select pg_catalog.pg_advisory_xact_lock(
     pg_catalog.hashtextextended('timeopen:maintenance-state', 0)
   );
   update timeopen_private.service_control
      set maintenance_mode = false,
          updated_at = now()
    where singleton is true;
   commit;
   ```

   `UPDATE 1`을 확인하세요. 이 상태를 끄면 DB 트리거가 예약·매장 INSERT를 다시 허용하며 트리거나 데이터는 제거되지 않습니다.
3. Vercel Production에서 `TIMEOPEN_MAINTENANCE_MODE`를 `false`로 변경하거나 삭제하고 새 배포를 실행합니다. 앱의 기본값은 꺼짐입니다. 변경 후 공개 예약 링크와 API를 확인하세요.
4. 기존 계정 로그인이 되는지 확인합니다. 신규 회원가입은 계속 닫혀 있습니다. 새 가입을 다시 열 시점에 Supabase의 `Allow new users to sign up`을 켭니다. 기존 로그인과 신규 가입 허용은 별개 설정입니다.
5. 문자 발신 번호와 Solapi 설정을 확인하기 전까지 `TIMEOPEN_SMS_ENABLED=false`(또는 삭제) 상태로 둡니다. 새로 유효한 발신 번호와 API 설정을 검증한 뒤에만 Vercel에서 `TIMEOPEN_SMS_ENABLED=true`로 바꾸고 재배포하세요. 기본값은 꺼짐입니다.

## 스테이징 검증 체크리스트

운영 자료를 대상으로 INSERT/UPDATE/DELETE 검증을 하지 마세요. 별도의 스테이징 프로젝트와 폐기 가능한 테스트 자료를 사용합니다.

1. 마이그레이션 적용 전 스테이징의 기존 트리거, 테이블 소유자, `timeopen_private` 스키마 존재 여부를 확인합니다. 이미 같은 이름/스키마가 있으면 이름 충돌이나 소유권을 확인하고 적용을 멈춥니다.
2. DB 상태를 `true`로 설정한 뒤 `create_reservation_by_handle`, `create_owner_reservation` RPC 및 `POST /rest/v1/reservations` 직접 요청이 모두 거부되는지 봅니다. 예약 INSERT를 수행하는 모든 RPC는 테이블 트리거를 타야 합니다.
3. `POST /rest/v1/organizations`, 앱의 직접 조직 INSERT, `bootstrap_owner`의 신규 조직 생성이 모두 거부되는지 확인합니다.
4. `reservations`와 `organizations`에 대해 INSERT 전용 트리거 하나씩만 추가되었고 기존 트리거와 함께 예상 순서로 실행되는지 확인합니다. 이 마이그레이션이 RLS 정책 또는 기존 RPC EXECUTE 권한을 변경하지 않았는지도 `pg_policies`, `information_schema.routine_privileges`로 비교합니다.
5. 스테이징의 폐기 가능한 기존 예약으로 조회·수정·취소와 사장님 로그인/예약 관리가 되는지 확인합니다. SMS가 비활성화된 상태에서는 Solapi 요청이 발생하지 않고 API 결과의 SMS 상태가 `skipped`인지 확인합니다.
6. DB 상태를 `false`로 바꾸고, 스테이징에서 폐기 가능한 자료로 신규 예약·매장 RPC가 다시 동작하는지 확인합니다. 필요하면 트랜잭션 롤백/테스트 전용 조직으로 검증하며 운영 데이터에는 적용하지 않습니다.

저장소 테스트는 코드와 마이그레이션 파일의 정적 구조 및 SMS 요청 차단을 확인합니다. 실제 Supabase의 트리거 동작, 현재 운영 DB 권한/트리거 목록, Auth Dashboard 가입 설정, Vercel 환경 설정은 스테이징 또는 운영 담당자가 별도로 확인해야 합니다.
