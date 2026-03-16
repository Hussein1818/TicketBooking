#  Real-Time Ticket Booking System

## 📌 Overview
A comprehensive, real-time ticket booking system built with **.NET Core**. The project strictly follows **Clean Architecture** principles and implements the **CQRS** (Command Query Responsibility Segregation) pattern to ensure scalability, maintainability, and clear separation of concerns.

## 🛠️ Architecture & Technologies
- **Backend:** .NET (C#)
- **Architecture:** Clean Architecture (Rich Domain Models, Application, Infrastructure, API).
- **Design Pattern:** CQRS using **MediatR** & **FluentValidation**.
- **Real-Time Communication:** **SignalR** (Secured with JWT for live seat locking and booking updates).
- **Background Jobs:** **Hangfire** (for releasing unpaid locked seats after a 5-minute timeout).
- **Database:** Entity Framework Core (SQL Server) with EF Core Migrations.
- **Authentication & Security:** ASP.NET Core Identity, JWT, **Anti-IDOR protection**, and **HMAC-SHA256 Digital Signatures**.
- **Caching:** **Distributed Cache (Redis)** for high-performance event listing and instant cache invalidation upon bookings.
- **PDF Generation:** **QuestPDF** & **QRCoder** for professional ticket and Fan ID issuing.
- **Payment Integration:** **Paymob** (with Idempotency and Optimistic Concurrency protection).

---

##  Key Features (Business Logic)

### 1.  Real-Time Seat Booking & Caching
- Users can view live seat statuses (Available, Locked, Booked) fetched instantly from **Redis Cache**.
- When a user selects a seat, it becomes **Locked** for 5 minutes.
- SignalR broadcasts the lock to all connected clients immediately to prevent double-selection.
- Redis cache is automatically invalidated and refreshed to guarantee data consistency.

### 2.  Strict Concurrency & Race Condition Protection
- **Seat Concurrency:** Uses EF Core `RowVersion` to ensure no two users can book the same seat at the exact same millisecond.
- **Wallet Double-Spend Protection:** The `User` wallet is heavily protected using a Concurrency Token (`Version`), preventing balance deduction errors during rapid duplicate requests.
- **Payment Idempotency:** Custom logic to handle duplicate notifications from payment gateways (Paymob), ensuring transactions are processed only once.

### 3.  Professional PDF Tickets & Fan ID
- **Official Tickets:** Successful payments trigger the automatic generation of a professional PDF Ticket using QuestPDF, which is instantly emailed to the user.
- **Fan ID Generation:** Users can complete their profiles (National ID, Photo Uploads) to dynamically generate and download a personalized **Fan ID PDF** with an embedded QR code.
- *Note:* File uploading is strictly decoupled from the Application layer to maintain Clean Architecture compliance (using Streams instead of `IFormFile`).

### 4.  Secure QR Code System & Anti-Forgery
- Each ticket contains a dynamically generated QR Code.
- The system uses **HMAC SHA-256 cryptographic hashing** to sign ticket data (`TICKET|SeatId|Username`).
- The generated signature is embedded inside the QR code, making ticket forgery or manual tampering mathematically impossible.
- Gate scanners can instantly validate the signature and the owner's identity.

### 5.  Smart Waitlist System
- If an event is sold out, users can join a digital waitlist.
- When new seats are added or existing bookings are cancelled, the system handles the queue intelligently.
- It fetches the **exact number of users** matching the available seats (First-In-First-Out) and triggers an Email Notification to them, without flushing the entire queue.

### 6.  Wallet & Payment System (with Hangfire Optimization)
- Integrated with **Paymob** for credit card and mobile wallet payments.
- Internal **Virtual Wallet** system allowing users to keep funds and pay for tickets seamlessly.
- **Resource Optimization:** If a user pays successfully within the 5-minute lock window, the scheduled Hangfire release job is dynamically tracked and **cancelled** to save server CPU and memory resources.

### 7.  Ticket Transfer & Security (IDOR Prevention)
- Users can securely transfer their purchased tickets to other registered users.
- **Zero-Trust API:** All sensitive endpoints (Transfer, Cancel, Wallet Pay) extract the identity directly from the secure JWT claims. Route and body parameters for Usernames/IDs are ignored to completely eliminate **IDOR (Insecure Direct Object Reference)** vulnerabilities.

### 8.  Verified Reviews
- A "Verified Purchase" review system where users can only rate an event **if they actually attended it** (booking confirmed and event date passed).

### 9.  Admin Dashboard & System Logs
- Advanced, fail-safe analytics for admins: Total Revenue (handles empty states dynamically), Seat Fill Rate, Top Selling Events, and exact Customer tracking.
- Complete Audit Trail logging for critical actions like wallet transactions and ticket transfers.

### 10.  Role-Based Access Control (RBAC) & Gate Scanning
- Implemented strict RBAC with distinct roles: **Customer, Staff, and Admin**.
- Dedicated **Staff** role created exclusively for gate security personnel, provisioned solely by Admins to prevent unauthorized registrations.
- Staff members have restricted access to the ticket validation scanner endpoints, ensuring they cannot access dashboards, financial data, or administrative operations.

### 11.  VIP Memberships & Automated Discounts
- Users can upgrade their accounts to premium subscription tiers (**Silver, Gold, VIP**) using their virtual wallet funds.
- The system dynamically calculates and applies automated discounts (e.g., 10%, 20%, 30%) during the checkout process based on the user's active tier and its expiration date.
- Centralized pricing logic ensures discounts are consistently enforced across all payment methods, including the internal Wallet and external gateways like Paymob.

### 12.  Multi-Currency Support & Dynamic Exchange Rates
- The system supports seamless international transactions by accepting multiple currencies (e.g., EGP, USD, SAR) during the checkout process.
- Exchange rates are dynamically converted via an abstracted `ICurrencyConverterService` and immutably stored within each booking record to preserve historical financial accuracy.
- **Fail-Safe Analytics:** The Admin Dashboard aggregates revenue intelligently by mathematically unifying all disparate currencies back to the base currency (EGP) using the exact exchange rate captured at the time of transaction, absolutely preventing multi-currency aggregation bugs.

### 13.  Shopping Cart & Unified Checkout
- **Cart Aggregation:** Users can lock multiple seats across different events and seamlessly add them to a unified shopping cart.
- **Order Entity Pattern:** The system intelligently aggregates multiple independent `Booking` entities under a single parent `Order` entity to streamline the checkout process.
- **Gateway Synchronization:** Provides a single, unified checkout session for external payment gateways (e.g., Paymob), completely eliminating race conditions and ensuring atomic transactions for multi-item purchases.
- **Proportional Financial Distribution:** Upon successful payment, the system accurately distributes the total paid amount—including any applied VIP discounts or promo codes—proportionally across all individual bookings within the cart.

---

##  Project Structure

- **`TicketBookingSystem.Domain`**: Core entities with **Rich Domain Models** (encapsulated collections and private setters), Enums, and AppConstants. Zero external dependencies.
- **`TicketBookingSystem.Application`**: Business rules, CQRS Commands/Queries, DTOs, Validation behaviors, and abstract Interfaces (`ITicketPdfService`, `IEmailService`, `IApplicationDbContext`).
- **`TicketBookingSystem.Infrastructure`**: Implementation details, Redis Cache configurations, SQL Server (EF Core), Identity, SignalR Hubs, Hangfire Jobs, Paymob integration, and QuestPDF generation.
- **`TicketBookingSystem.Api`**: Thin Controllers (relying purely on MediatR), JWT Configuration, Global Exception Handling middleware, and Rate Limiting policies.
