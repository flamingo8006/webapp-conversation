# Phase 14: 관리자 그룹 관리

> **브랜치**: `claude/review-progress-ughKp`
> **작성일**: 2026-02-07
> **상태**: 계획 수립 완료

---

## 1. 개요

### 목적
- 관리자를 그룹으로 묶어 **챗봇 공동 관리** 및 **대시보드 공유** 기능 제공
- 슈퍼관리자가 그룹을 생성하고 관리자를 배정
- 그룹관리자(group_admin)가 그룹 내 멤버 추가/제거 가능

### 설계 결정 사항
| 항목 | 결정 | 이유 |
|------|------|------|
| 관리자 그룹 소속 수 | **1개만** | 복잡도 최소화 (Admin 테이블에 groupId 직접 추가) |
| 그룹관리자 권한 | 그룹 내 멤버 추가/제거 가능 | 슈퍼관리자 부담 경감 |
| 그룹 미소속 관리자 | 자기 createdBy 챗봇만 표시 | 기존 동작 유지 (하위 호환) |
| 기존 챗봇 마이그레이션 | "ITC" 그룹 생성 후 배정 | 기존 데이터 보존 |
| 매핑 테이블 | 불필요 (1:1) | Admin.groupId로 충분 |

---

## 2. 스키마 설계

### 2-1. 신규 테이블: AdminGroup

```prisma
model AdminGroup {
  id          String   @id @default(cuid())
  name        String   @unique                    // 그룹명 (예: "ITC", "연구팀")
  description String?                              // 그룹 설명
  isActive    Boolean  @default(true) @map("is_active")

  createdAt   DateTime @default(now()) @map("created_at")
  createdBy   String?  @map("created_by")          // 생성한 슈퍼관리자 ID
  updatedAt   DateTime @updatedAt @map("updated_at")
  updatedBy   String?  @map("updated_by")

  // 관계
  members     Admin[]
  chatbotApps ChatbotApp[]

  @@map("admin_groups")
}
```

### 2-2. Admin 테이블 변경

```diff
model Admin {
  ...existing fields...

+ groupId     String?  @map("group_id")             // 소속 그룹 (nullable)
+ groupRole   String?  @map("group_role")            // 'group_admin' | 'member' (null=미소속)
+
+ group       AdminGroup? @relation(fields: [groupId], references: [id])
}
```

### 2-3. ChatbotApp 테이블 변경

```diff
model ChatbotApp {
  ...existing fields...

+ groupId     String?  @map("group_id")             // 소속 그룹 (nullable)
+
+ group       AdminGroup? @relation(fields: [groupId], references: [id])
}
```

---

## 3. 권한 모델

### 3-1. 역할별 권한 매트릭스

| 역할 | 챗봇 조회 | 챗봇 생성/수정/삭제 | 대시보드 | 멤버 관리 | 그룹 CRUD |
|------|----------|-------------------|---------|----------|----------|
| **super_admin** | 전체 | 전체 | 전체 | 전체 | O |
| **group_admin** | 그룹 + 본인 무소속 | 그룹 + 본인 무소속 | 그룹 통계 | 그룹 내 추가/제거 | X |
| **member** | 그룹 + 본인 무소속 | 그룹 + 본인 무소속 | 그룹 통계 | X | X |
| **미소속 admin** | 본인 createdBy만 | 본인만 | 본인 통계만 | X | X |

### 3-2. 챗봇 조회 로직 (의사코드)

```typescript
function getVisibleApps(admin: Admin): ChatbotApp[] {
  if (admin.role === 'super_admin') {
    return getAllApps() // 전체
  }

  if (admin.groupId) {
    // 그룹 소속: 그룹 챗봇 + 본인이 만든 무소속 챗봇
    return getAppsByGroupId(admin.groupId)
      .concat(getAppsByCreatedBy(admin.id, groupId: null))
  }

  // 미소속: 본인이 만든 챗봇만
  return getAppsByCreatedBy(admin.id)
}
```

### 3-3. 챗봇 생성 시 그룹 배정 로직

```typescript
function createApp(admin: Admin, appData: CreateAppInput): ChatbotApp {
  // super_admin: 그룹 선택 가능 (드롭다운) 또는 미배정
  // group_admin/member: 자동으로 본인 그룹에 배정
  // 미소속 admin: groupId = null (개인 챗봇)

  const groupId = admin.role === 'super_admin'
    ? appData.groupId ?? null
    : admin.groupId ?? null

  return create({ ...appData, groupId, createdBy: admin.id })
}
```

---

## 4. 작업 분할

### Phase 14-1: DB 스키마 + Repository (위험도: 낮음)

**목표**: AdminGroup 테이블 생성, Admin/ChatbotApp 스키마 변경, Repository 생성

**작업 내용**:
1. `prisma/schema.prisma` 수정
   - AdminGroup 모델 추가
   - Admin에 `groupId`, `groupRole` 필드 추가 + relation
   - ChatbotApp에 `groupId` 필드 추가 + relation
2. Prisma 마이그레이션 생성
3. `lib/repositories/admin-group.ts` 생성
   - `createGroup()` - 그룹 생성
   - `updateGroup()` - 그룹 수정
   - `deleteGroup()` - 그룹 삭제 (소프트 삭제)
   - `getGroupById()` - 그룹 조회
   - `listGroups()` - 그룹 목록
   - `addMember()` - 멤버 추가 (Admin.groupId 업데이트)
   - `removeMember()` - 멤버 제거 (Admin.groupId = null)
   - `listMembers()` - 그룹 멤버 목록
   - `updateMemberRole()` - 멤버 역할 변경

**영향**: 신규 파일만 생성, 기존 코드 변경 최소

---

### Phase 14-2: API 라우트 (위험도: 중간)

**목표**: 그룹 CRUD API + 멤버 관리 API + 기존 API 수정

**신규 API**:
```
POST   /api/admin/groups           - 그룹 생성 (super_admin)
GET    /api/admin/groups           - 그룹 목록 (super_admin, group_admin은 본인 그룹만)
GET    /api/admin/groups/[groupId] - 그룹 상세
PATCH  /api/admin/groups/[groupId] - 그룹 수정 (super_admin)
DELETE /api/admin/groups/[groupId] - 그룹 삭제 (super_admin)

POST   /api/admin/groups/[groupId]/members           - 멤버 추가 (super_admin, group_admin)
DELETE /api/admin/groups/[groupId]/members/[adminId]  - 멤버 제거 (super_admin, group_admin)
PATCH  /api/admin/groups/[groupId]/members/[adminId]  - 멤버 역할 변경 (super_admin)
```

**기존 API 수정**:
```
GET  /api/admin/apps              - 챗봇 목록: createdBy → groupId 기반 필터
POST /api/admin/apps              - 챗봇 생성: groupId 자동/수동 배정
GET  /api/admin/stats/overview    - 대시보드: 그룹별 통계
GET  /api/admin/stats/trend       - 트렌드: 그룹별 필터
GET  /api/admin/activity          - 활동 내역: 그룹별 필터
```

**권한 체크 헬퍼**:
```typescript
// lib/admin-auth.ts에 추가
export async function requireGroupAdminOrSuper(
  request: Request,
  groupId: string
): Promise<AdminPayload>

export function getAdminVisibleAppFilter(
  admin: AdminPayload & { groupId?: string }
): Prisma.ChatbotAppWhereInput
```

---

### Phase 14-3: 그룹 관리 UI (위험도: 낮음)

**목표**: 그룹 CRUD 페이지 + 멤버 관리 UI

**신규 페이지**:
```
app/(admin)/admin/groups/page.tsx              - 그룹 목록
app/(admin)/admin/groups/new/page.tsx          - 그룹 생성 폼
app/(admin)/admin/groups/[groupId]/edit/page.tsx - 그룹 수정 폼 + 멤버 관리
```

**그룹 목록 페이지**:
- 그룹명, 설명, 멤버 수, 챗봇 수 표시
- 생성/수정/삭제 버튼 (super_admin만)

**그룹 수정 페이지**:
- 그룹 정보 편집 (이름, 설명)
- 멤버 관리 섹션
  - 현재 멤버 목록 (역할 표시)
  - 멤버 추가: 미소속 관리자 드롭다운에서 선택
  - 멤버 제거: 목록에서 제거 버튼
  - 역할 변경: group_admin ↔ member 토글 (super_admin만)

**사이드바 수정**:
- `app/(admin)/admin/layout.tsx`에 "그룹 관리" 메뉴 추가

---

### Phase 14-4: 기존 UI 수정 (위험도: 중간)

**목표**: 챗봇 관리/대시보드에 그룹 개념 반영

**챗봇 관리 수정**:
- 챗봇 생성 폼: 그룹 선택 드롭다운 추가
  - super_admin: 전체 그룹 선택 가능 + "미배정" 옵션
  - group_admin/member: 본인 그룹 자동 선택 (비활성)
  - 미소속 admin: 그룹 선택 없음 (개인 챗봇)
- 챗봇 목록: 그룹명 컬럼 추가, 그룹별 필터

**대시보드 수정**:
- 통계 조회: 그룹 기반 필터링 적용
- 그룹명 표시 (어떤 그룹 기준 통계인지)

**관리자 관리 수정**:
- 관리자 목록: 소속 그룹 컬럼 추가
- 관리자 생성/수정 폼: 그룹 선택 드롭다운 추가

---

### Phase 14-5: 시드 데이터 + 마이그레이션 (위험도: 낮음)

**목표**: 기존 데이터를 그룹 구조로 마이그레이션

**작업 내용**:
1. `prisma/seed.ts` 수정
   - "ITC" 그룹 생성
   - superadmin 계정을 ITC 그룹의 group_admin으로 배정
2. 마이그레이션 스크립트
   - 기존 ChatbotApp의 `groupId`를 ITC 그룹으로 업데이트
   - 기존 Admin의 `groupId`를 ITC 그룹으로 업데이트
3. 시드 스크립트 실행 확인

---

## 5. 커밋 전략

```
Phase 14-1 → 커밋 1: feat: add AdminGroup schema and repository
Phase 14-2 → 커밋 2: feat: add group management API routes and update existing APIs
Phase 14-3 → 커밋 3: feat: add group management UI pages
Phase 14-4 → 커밋 4: feat: update chatbot and dashboard UI for group support
Phase 14-5 → 커밋 5: feat: add ITC group seed data and migration
```

문제 발생 시 `git revert <커밋해시>`로 개별 롤백 가능

---

## 6. 영향 받는 파일 목록

### 신규 생성 (약 10개)
```
lib/repositories/admin-group.ts
app/api/admin/groups/route.ts
app/api/admin/groups/[groupId]/route.ts
app/api/admin/groups/[groupId]/members/route.ts
app/api/admin/groups/[groupId]/members/[adminId]/route.ts
app/(admin)/admin/groups/page.tsx
app/(admin)/admin/groups/new/page.tsx
app/(admin)/admin/groups/[groupId]/edit/page.tsx
```

### 수정 필요 (약 15개)
```
prisma/schema.prisma
prisma/seed.ts
lib/repositories/chatbot-app.ts
lib/repositories/usage-stats.ts
lib/repositories/admin.ts
lib/admin-auth.ts
app/api/admin/apps/route.ts
app/api/admin/apps/[appId]/route.ts
app/api/admin/stats/overview/route.ts
app/api/admin/stats/trend/route.ts
app/api/admin/activity/route.ts
app/(admin)/admin/layout.tsx
app/(admin)/admin/apps/new/page.tsx
app/(admin)/admin/apps/[appId]/edit/page.tsx
app/(admin)/admin/admins/new/page.tsx
app/(admin)/admin/admins/[id]/edit/page.tsx
app/(admin)/admin/page.tsx (대시보드)
```

---

## 7. 다국어 키 추가 (i18n)

```typescript
// admin 관련 번역 키 추가 필요
groups: {
  title: '그룹 관리' / 'Group Management',
  name: '그룹명' / 'Group Name',
  description: '설명' / 'Description',
  members: '멤버' / 'Members',
  chatbots: '챗봇 수' / 'Chatbots',
  addMember: '멤버 추가' / 'Add Member',
  removeMember: '멤버 제거' / 'Remove Member',
  groupAdmin: '그룹 관리자' / 'Group Admin',
  member: '멤버' / 'Member',
  noGroup: '미소속' / 'No Group',
  selectGroup: '그룹 선택' / 'Select Group',
}
```

---

## 8. 테스트 체크리스트

### 기능 테스트
- [ ] 그룹 생성/수정/삭제 (super_admin)
- [ ] 멤버 추가/제거/역할변경
- [ ] 그룹관리자의 멤버 추가/제거
- [ ] 그룹 소속 관리자 → 그룹 챗봇 + 본인 무소속 챗봇 표시
- [ ] 미소속 관리자 → 본인 챗봇만 표시
- [ ] 챗봇 생성 시 그룹 자동/수동 배정
- [ ] 대시보드 그룹별 통계 표시
- [ ] 기존 챗봇이 ITC 그룹으로 마이그레이션 확인

### 권한 테스트
- [ ] member가 멤버 관리 API 호출 → 403
- [ ] 미소속 admin이 다른 그룹 챗봇 접근 → 필터링됨
- [ ] group_admin이 다른 그룹 멤버 제거 시도 → 403
- [ ] group_admin이 멤버 역할 변경 시도 → 403 (super_admin만)
