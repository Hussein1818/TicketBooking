#  Real-Time Ticket Booking System

## 📌 Overview
A comprehensive, real-time ticket booking system built with **.NET Core**. The project strictly follows **Clean Architecture** principles and implements the **CQRS** (Command Query Responsibility Segregation) pattern to ensure scalability, maintainability, and clear separation of concerns.

##  Architecture & Technologies
- **Backend:** .NET (C#)
- **Architecture:** Clean Architecture (Domain, Application, Infrastructure, API).
- **Design Pattern:** CQRS using **MediatR**.
- **Real-Time Communication:** **SignalR** (for live seat locking and booking updates).
- **Background Jobs:** **Hangfire** (for releasing unpaid locked seats after 5 minutes).
- **Database:** Entity Framework Core (SQL Server).
- **Authentication:** ASP.NET Core Identity & JWT (JSON Web Tokens).
- **Caching:** In-Memory Cache (for fast retrieval of events and seats).
- **Payment Integration:** **Paymob**.
- **Security:** HMAC SHA-256 for QR Code generation and validation.

---

##  Key Features (Business Logic)

### 1.  Real-Time Seat Booking
- Users can view live seat statuses (Available, Locked, Booked).
- When a user selects a seat, it becomes **Locked** for 5 minutes.
- SignalR broadcasts the lock to all connected clients immediately.
- If payment is not completed within 5 minutes, **Hangfire** automatically releases the seat back to `Available` and clears the pending booking.

### 2.  Waitlist System
- If an event is sold out, users can join a waitlist.
- If someone cancels their booking or the admin adds new seats, the system automatically sends an **Email Notification** to waitlisted users.

### 3.  Wallet & Payment System
- Users have an internal virtual wallet.
- Payments can be made via **Paymob** or directly from the User's Wallet.
- Successful payments trigger an HTML Email containing the official ticket details.

### 4.  Promo Codes
- Admins can generate discount promo codes.
- Promo codes have a max usage limit and validation logic before applying the discount to the final price.

### 5.  Ticket Transfer
- Users can transfer their purchased tickets to other registered users in the system securely.

### 6.  QR Code Validation
- Tickets generate a unique string formatted as `TICKET|SeatId|Username`.
- The string is hashed using a Secret Key (HMAC SHA-256) to generate the QR Code, making ticket forgery impossible.
- Admins can scan and validate tickets at the gate.

### 7.  Verified Reviews
- Users can only review an event **if they have attended it** (Ticket booked & Event Date has passed).

### 8.  Admin Dashboard
- Advanced statistics (Total Revenue, Total Booked Seats, Top Events, Top Customers).
- Complete Audit Logging for critical actions (e.g., Ticket Transfers, Wallet purchases).

---

##  Project Structure

- **`TicketBookingSystem.Domain`**: Core entities (`Event`, `Seat`, `Booking`, `User`, etc.) and Enums. No external dependencies.
- **`TicketBookingSystem.Application`**: Business rules, CQRS Commands/Queries, DTOs, Validation, and Interfaces (`IPaymentService`, `IEmailService`).
- **`TicketBookingSystem.Infrastructure`**: Implementation of interfaces, EF Core `ApplicationDbContext`, Identity, Paymob Integration, SignalR Hubs, and Hangfire setup.
- **`TicketBookingSystem.Api`**: Controllers, Middlewares (Global Exception Handling), and `Program.cs`.

---

   git clone [https://github.com/Hussein1818/TicketBooking.git](https://github.com/Hussein1818/TicketBooking.git)
   cd TicketBookingSystem
   git checkout develop