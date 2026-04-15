# 🎫 Real-Time Ticket Booking System

## 📌 Overview
A comprehensive, high-performance real-time ticket booking system built with **.NET Core**. The project strictly adheres to **Clean Architecture** principles and implements the **CQRS** (Command Query Responsibility Segregation) pattern to ensure massive scalability, maintainability, and enterprise-grade security.

---

##  Architecture & Technologies
- **Backend:** .NET 9 (C#)
- **Architecture:** Clean Architecture (Domain-Driven Design with Rich Models).
- **Design Pattern:** CQRS using **MediatR** & FluentValidation.
- **Real-Time:** **SignalR** (Secured with JWT for live seat locking and notifications).
- **Background Jobs:** **Hangfire** (Automated release of expired locks and waitlist processing).
- **Database:** SQL Server with Entity Framework Core (Optimistic Concurrency).
- **Caching:** **Distributed Redis Cache** (High-speed event discovery & instant invalidation).
- **Security:** ASP.NET Core Identity, JWT (Access + Refresh Tokens), HMAC-SHA256 Digital Signatures, and Anti-IDOR protection.
- **Integrations:** **Paymob** Payment Gateway, QuestPDF, and QRCoder.

---

##  Key Features

### 1.  Enterprise-Grade Security & Authentication
* **Zero-Trust Architecture:** Complete prevention of **IDOR** (Insecure Direct Object Reference) by extracting identities exclusively from secure JWT claims.
* **Advanced Session Management:** Secure JWT flow with short-lived access tokens (15 mins) and long-lived, database-persisted **Refresh Tokens** with explicit revocation.
* **Strict Identity Flow:** Enforced email verification, secure Forgot/Reset password lifecycles, and engineered endpoints that neutralize **Email Enumeration** attacks.
* **Cryptographic Anti-Forgery:** Dynamic QR codes for tickets are digitally signed using **HMAC-SHA256**, making forgery mathematically impossible.

### 2.  Real-Time Operations & High Concurrency
* **SignalR & Redis Synergy:** Live seat statuses are fetched instantly from Redis and broadcasted via SignalR, locking seats instantly upon selection to prevent double-booking.
* **Race Condition Protection:** Utilizes EF Core `RowVersion` for optimistic concurrency, protecting seat booking and wallet balance transactions at the millisecond level.
* **Instant Notifications:** Personalized real-time alerts pushed via SignalR for waitlist updates and system events.

### 3.  SaaS Financials & Multi-Tenant Wallet
* **Multi-Tenant Revenue Splitting:** Organizers manage their own events with isolated dashboards. The platform automatically calculates and immutably splits commissions at the time of transaction.
* **Unified Shopping Cart:** Aggregates multiple seats into a single `Order` for unified checkout, eliminating gateway race conditions.
* **Virtual Wallet & Multi-Currency:** Internal wallet system supporting abstracted exchange rates (EGP, USD, SAR) with immutable historical transaction logs.

### 4.  Automation & Smart Systems
* **Hangfire Optimization:** Unpaid seats are released after 5 minutes. Background jobs are dynamically cancelled upon successful payment to save server resources.
* **Intelligent Waitlist:** FIFO-based queue that fetches the exact number of users matching newly available seats and triggers instant SignalR/Email alerts.
* **VIP Memberships:** Automated subscription tiers (Silver, Gold, VIP) with dynamic discount calculation during the checkout process.

### 5.  User Engagement & Operations
* **Loyalty Points:** Users earn points through purchases and verified reviews (Anti-Spam limited), which autonomously convert to wallet funds.
* **Verified Reviews:** A "Verified Purchase" system ensuring ratings are only possible for attended events.
* **Professional Documents:** Automated generation of PDF Tickets and personalized Fan IDs with QR codes.

---

##  Project Structure
* **Domain:** Core entities, Rich Domain Models, Enums, and Logic.
* **Application:** CQRS Commands/Queries, DTOs, Mapping, and Interfaces.
* **Infrastructure:** EF Core Persistence, SignalR Hubs, Redis, Hangfire, and Third-party Integrations (Paymob/PDF).
* **Api:** Thin Controllers, JWT Middleware, and Global Exception Handling.

---

