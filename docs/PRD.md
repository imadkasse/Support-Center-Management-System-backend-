# Support Center Management System (SCMS)
## Product Requirements Document (PRD)
Version: MVP – Single Tutoring Center only backend (API)
---
# 1. Product Overview
SCMS is a web-based platform designed to help a single tutoring center manage its operations digitally.

The system replaces manual tools (paper, Excel, WhatsApp tracking) with a structured platform for:

- Weekly class scheduling
- Student enrollment
- Subscription tracking
- Attendance management
- Basic financial monitoring

This MVP is designed for **one center only (single-tenant)**.

---

# 2. Objectives

## 2.1 Business Objectives

- Digitize center operations
- Reduce administrative workload
- Improve subscription tracking accuracy
- Provide financial visibility

## 2.2 Success Criteria

- Admin can manage classes without errors
- Attendance recording takes < 10 seconds per student
- Subscription expiration is automated
- Monthly revenue is visible on dashboard
- Real center actively uses the system weekly

---

# 3. User Roles

## 3.1 Admin
Full system access:
- Manage classes
- Manage students
- Manage teachers
- View dashboard
- Manage subscriptions
- View attendance

## 3.2 Teacher
Limited access:
- View assigned classes
- View enrolled students
- Record attendance

## 3.3 Student
- View enrolled classes
- View weekly schedule
- View subscription status

## 3.4 Parent (Light Version)
- View attendance history
- View subscription status

---

# 4. Functional Requirements

---

## 4.1 Authentication & Authorization

### Requirements
- Email + password login
- Role-based access control (RBAC)
- Admin creates teacher accounts
- Students can be created by Admin
- Secure password hashing
- JWT-based authentication

---

## 4.2 Room Management

### Admin Can:
- Create room
  - Name
  - Capacity
- Edit room
- Delete room (if not linked to active class)

### System Rules:
- Capacity must be > 0
- Cannot delete room assigned to active class

---

## 4.3 Class Management

### Admin Can:
- Create class
  - Day of week
  - Start time
  - End time
  - Teacher
  - Room
  - Capacity
- Edit class
- Delete class (if no active enrollments)

### System Rules:
- Enrollment blocked when capacity reached
- Occupancy percentage displayed

---

## 4.4 Teacher Management

### Admin Can:
- Create teacher account
- Assign teacher to classes
- Deactivate teacher

### Teacher Can:
- View assigned classes
- View enrolled students
- Record attendance

---

## 4.5 Student Management

### Student Profile Fields:
- Full name
- Phone number
- Parent phone (optional)
- Registration date
- Active status

### Admin Can:
- Add student
- Edit student
- Deactivate student

---

## 4.6 Enrollment & Subscription System

### Subscription Model (MVP)
- Monthly subscription per class

### Enrollment Flow:
1. Admin selects student
2. Admin selects class
3. Admin confirms payment (manual)
4. System sets:
   - subscriptionStart = current date
   - subscriptionEnd = +30 days
   - status = ACTIVE

### System Rules:
- Student cannot enroll if class full
- Student cannot have duplicate active enrollment in same class
- Daily cron job checks expired subscriptions
- Expired subscriptions set status = EXPIRED
- Expired students cannot attend

---

## 4.7 Attendance Management

### Teacher Can:
- Open class session
- Mark each student:
  - PRESENT
  - ABSENT

### System Stores:
- Class ID
- Student ID
- Date
- Status

### Rules:
- Cannot record attendance for expired subscription
- Only assigned teacher can mark attendance

---

## 4.8 Admin Dashboard

### Metrics Displayed:
- Total active students
- Total enrolled students
- Active classes
- Classes at full capacity
- Expired subscriptions count
- Monthly revenue

Optional (Phase 1.1):
- Revenue chart (monthly)
- Student growth chart

---

## 4.9 Student Dashboard

Student Can See:
- Enrolled classes
- Weekly schedule
- Subscription status
- Days remaining before expiration

---

## 4.10 Parent Dashboard (Light Version)

Parent Can See:
- Student attendance history
- Subscription status

---

# 5. Non-Functional Requirements


## 5.1 Security
- Role-based guards
- Teachers cannot access other teachers’ classes
- Students cannot access other students’ data
- Secure password hashing

## 5.2 Reliability
- Daily automated subscription expiration check
- Data persistence with PostgreSQL
- Regular database backup recommended

---

# 6. Database Core Entities

## User
- id
- name
- email
- password
- role (ADMIN, TEACHER, STUDENT, PARENT)
- active
- createdAt

## Room
- id
- name
- capacity

## Class
- id
- dayOfWeek
- startTime
- endTime
- teacherId
- roomId
- capacity

## StudentProfile
- id
- userId
- phone
- parentPhone
- active

## Enrollment
- id
- studentId
- classId
- subscriptionStart
- subscriptionEnd
- status (ACTIVE, EXPIRED)

## Attendance
- id
- classId
- studentId
- date
- status (PRESENT, ABSENT)

---

# 11. Final Objective

This MVP is designed to:

- Replace manual operations
- Improve subscription control
- Provide financial clarity
- Prepare for scalable SaaS transition

The focus is not perfection.
The focus is real-world usage and validation.