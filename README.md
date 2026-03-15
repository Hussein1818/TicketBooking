#  Real-Time Ticket Booking System

## 📌 Overview
A comprehensive, real-time ticket booking system built with **.NET Core**. The project strictly follows **Clean Architecture** principles and implements the **CQRS** (Command Query Responsibility Segregation) pattern to ensure scalability, maintainability, and clear separation of concerns.

##  Architecture & Technologies
- **Backend:** .NET (C#)
- **Architecture:** Clean Architecture (Domain, Application, Infrastructure, API).
- **Design Pattern:** CQRS using **MediatR**.
- **Real-Time Communication:** **SignalR** (Secured with JWT for live seat locking and booking updates).
- **Background Jobs:** **Hangfire** (for releasing unpaid locked seats after a 5-minute timeout).
- **Database:** Entity Framework Core (SQL Server).
- **Authentication:** ASP.NET Core Identity & JWT (JSON Web Tokens).
- **Caching:** **Distributed Cache (Redis)** for high performance and shared state across servers.
- **PDF Generation:** **QuestPDF** & **QRCoder** for professional ticket issuing.
- **Payment Integration:** **Paymob** (with Idempotency and Optimistic Concurrency protection).

---

##  Key Features (Business Logic)

### 1.  Real-Time Seat Booking
- Users can view live seat statuses (Available, Locked, Booked).
- When a user selects a seat, it becomes **Locked** for 5 minutes.
- SignalR broadcasts the lock to all connected clients immediately to prevent double-selection.
- If payment is not completed within 5 minutes, **Hangfire** automatically releases the seat back to `Available` and clears the pending booking.

### 2.  Concurrency & Idempotency Protection
- **Optimistic Concurrency:** Uses `RowVersion` (byte array) to ensure no two users can book the same seat at the exact same millisecond.
- **Payment Idempotency:** Custom logic to handle duplicate notifications from payment gateways (Paymob), ensuring transactions are processed only once even if the network fails or retries.

### 3.  Professional PDF Tickets
- Successful payments trigger the automatic generation of a professional **PDF Ticket** using QuestPDF.
- The ticket is designed with a high-end layout including Event Details, Attendee Name, Venue, and Seat Number.
- The system automatically sends the PDF as an **Email Attachment** to the user immediately after payment confirmation.

### 4.  Secure QR Code System
- Each ticket contains a **Real, Dynamically Generated QR Code**.
- The QR content includes a secure payload: `TICKET|BookingId|Username|SeatNumber`.
- The system uses HMAC SHA-256 hashing to sign ticket data, making ticket forgery or manual tampering impossible.
- Admins can scan and validate tickets at the gate against the system's database.

### 5.  Waitlist System
- If an event is sold out, users can join a digital waitlist.
- If a booking is cancelled or expired, the system automatically triggers an **Email Notification** to waitlisted users on a first-come, first-served basis.

### 6.  Wallet & Payment System
- Integrated with **Paymob** for credit card and mobile wallet payments.
- Internal **Virtual Wallet** system allowing users to keep funds, pay for tickets, or receive refunds.

### 7.  Ticket Transfer
- Users can securely transfer their purchased tickets to other registered users.
- The system logs the transfer in an **Audit Trail** and invalidates the old ticket's QR code.

### 8.  Verified Reviews
- A "Verified Purchase" review system where users can only rate an event **if they actually attended it** (booking confirmed and event date passed).

### 9.  Admin Dashboard
- Advanced analytics for admins: Total Revenue, Seat Fill Rate, Top Selling Events, and Customer behavior.
- Complete system logs for critical actions like wallet transactions and ticket transfers.

---

##  Project Structure

- **`TicketBookingSystem.Domain`**: Core entities (`Event`, `Seat`, `Booking`, etc.), Enums, and **AppConstants**. No external dependencies.
- **`TicketBookingSystem.Application`**: Business rules, CQRS Commands/Queries, DTOs, Validation, and Interfaces (`ITicketPdfService`, `IEmailService`, `IApplicationDbContext`).
- **`TicketBookingSystem.Infrastructure`**: Implementation of interfaces, Redis Cache, SQL Server (EF Core), Identity, SignalR Hubs, and QuestPDF service.
- **`TicketBookingSystem.Api`**: Controllers, JWT Configuration, Global Exception Handling, and API Endpoints.

