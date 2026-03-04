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

- [x] Create Room entity (if not existed)
- [x] Build Room CRUD endpoints (Admin only)
- [x] Add capacity validation rules

### Teacher Management

- [x] Create Teacher entity(if not existed) (extends User)
- [x] Build Teacher CRUD endpoints (Admin only)
- [x] Implement teacher deactivation

### Class Management

- [x] Create Class entity and relations (if not existed)
- [x] Build Class CRUD endpoints (Admin only)
- [x] Add capacity tracking and occupancy percentage
- [x] Implement class schedule validation

## Phase 4: Student Management & Enrollment

- [x] Create Student entity and StudentProfile (if not existed)
- [x] Build Student CRUD endpoints (Admin only)
- [x] Implement enrollment flow
- [x] Add duplicate enrollment prevention
- [x] Create student deactivation

## Phase 5: Subscription System

- [x] Create Enrollment entity with subscription fields (if not existed)
- [x] Implement manual payment confirmation
- [x] Build subscription activation logic (+30 days)
- [x] Create daily cron job for expiration check
- [x] Implement automatic status update (ACTIVE → EXPIRED)

## Phase 6: Attendance Management

- [x] Create Attendance entity (if not existed)
- [x] Build attendance recording endpoints (Teacher only)
- [x] Implement subscription expiration check before marking attendance
- [x] Add teacher-class assignment validation

## Phase 7: Dashboard APIs

### Admin Dashboard

- [x] Total active students count
- [x] Total enrolled students count
- [x] Active classes count
- [x] Full capacity classes count
- [x] Expired subscriptions count
- [x] Monthly revenue calculation

### Student Dashboard

- [x] Get enrolled classes
- [x] Get weekly schedule
- [x] Get subscription status
- [x] Calculate days remaining

### Parent Dashboard

- [x] Get student attendance history
- [x] Get subscription status
