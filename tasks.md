# Project Milestones

## Phase 1: Project Setup & Infrastructure

- [x] Initialize NestJS project with TypeScript
- [x] Set up PostgreSQL database with Prisma ORM
- [x] Configure ESLint, Prettier, and Husky
- [x] Set up environment configuration (.env)
- [x] Create base module structure

## Phase 2: Authentication & Authorization

- [x] Implement JWT authentication module
- [x] Create password hashing with bcrypt
- [x] Build login/register endpoints
- [x] Implement role-based access control (RBAC)
- [x] Create auth guards for Admin, Teacher, Student, Parent

## Phase 3: Core Entity Management

### Room Management

- [ ] Create Room entity (if not existed)
- [ ] Build Room CRUD endpoints (Admin only)
- [ ] Add capacity validation rules

### Teacher Management

- [ ] Create Teacher entity(if not existed) (extends User)
- [ ] Build Teacher CRUD endpoints (Admin only)
- [ ] Implement teacher deactivation

### Class Management

- [ ] Create Class entity and relations (if not existed)
- [ ] Build Class CRUD endpoints (Admin only)
- [ ] Add capacity tracking and occupancy percentage
- [ ] Implement class schedule validation

## Phase 4: Student Management & Enrollment

- [ ] Create Student entity and StudentProfile (if not existed)
- [ ] Build Student CRUD endpoints (Admin only)
- [ ] Implement enrollment flow
- [ ] Add duplicate enrollment prevention
- [ ] Create student deactivation

## Phase 5: Subscription System

- [ ] Create Enrollment entity with subscription fields (if not existed)
- [ ] Implement manual payment confirmation
- [ ] Build subscription activation logic (+30 days)
- [ ] Create daily cron job for expiration check
- [ ] Implement automatic status update (ACTIVE → EXPIRED)

## Phase 6: Attendance Management

- [ ] Create Attendance entity (if not existed)
- [ ] Build attendance recording endpoints (Teacher only)
- [ ] Implement subscription expiration check before marking attendance
- [ ] Add teacher-class assignment validation
- [ ] Create attendance history retrieval

## Phase 7: Dashboard APIs

### Admin Dashboard

- [ ] Total active students count
- [ ] Total enrolled students count
- [ ] Active classes count
- [ ] Full capacity classes count
- [ ] Expired subscriptions count
- [ ] Monthly revenue calculation

### Student Dashboard

- [ ] Get enrolled classes
- [ ] Get weekly schedule
- [ ] Get subscription status
- [ ] Calculate days remaining

### Parent Dashboard

- [ ] Get student attendance history
- [ ] Get subscription status
