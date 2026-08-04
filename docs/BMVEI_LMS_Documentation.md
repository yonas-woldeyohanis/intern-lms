# Bishoftu Motor Vehicle Engineering Industry (BMVEI)
## Comprehensive Library Management System Documentation

---

## 1. Introduction and Business Context

The Bishoftu Motor Vehicle Engineering Industry (BMVEI) maintains an internal library filled with specialized technical manuals, automotive engineering textbooks, and operational guides. In the past, managing this library meant dealing with physical logbooks. Librarians had to manually write down who borrowed what, and tracking down overdue books or knowing exactly how many copies of a book were actually on the shelf was a time-consuming challenge. 

To solve these problems, we built this Library Management System (LMS). This platform is a fully digital, highly automated solution tailored specifically for BMVEI's needs. It empowers librarians to manage inventory effortlessly while giving employees a modern interface to browse the catalog, see what's available, and even reserve books that are currently checked out. 

The primary goal of this documentation is to explain exactly how this system works under the hood, breaking down the architecture, database, and step-by-step workflows in plain, understandable language.

---

## 2. Technical Architecture

We chose a modern, robust, and scalable technology stack to ensure the system runs smoothly for years to come. 

### The Frontend (User Interface)
The part of the system that users interact with is built using **React**, a popular library for building user interfaces. We used a tool called **Vite** to set it up, which makes the application incredibly fast to load.
* **Styling:** We used **Tailwind CSS**, which allows us to design a beautiful, responsive interface that looks great on both desktop computers and mobile devices.
* **State Management:** To keep track of data (like whether a user is logged in or what books they are viewing), we use **Zustand** for local application state and **React Query** to efficiently fetch and cache data from the server.

### The Backend (Server and Logic)
The backend is the brain of the application. It is built with **Node.js** and the **Express** framework. 
To keep the code clean and easy to maintain, we structured it into specific layers:
1. **Routes:** This is the entry point. It receives requests from the frontend (like "borrow this book") and directs them to the right place.
2. **Middleware:** Before a request goes through, middleware checks for security. For example, it verifies if the user is actually logged in and has the right permissions (like checking if the user is a librarian before letting them add a new book).
3. **Controllers:** Controllers act as traffic directors. They take the incoming data, pass it to the services, and then send a response back to the frontend.
4. **Services:** This is where the actual business rules live. If a user tries to borrow a book, the service layer checks if they are allowed to borrow it, if the book is in stock, and handles the transaction.
5. **Repositories:** This layer is strictly responsible for talking to the database. It handles the raw SQL queries.

### The Database
All information is securely stored in a **MySQL 8.0** relational database. We chose a relational database because it guarantees data integrity (meaning we won't accidentally end up with ghost records or missing information). 

---

## 3. Database Structure Explained

Our database is carefully organized into several interconnected tables. Here is a step-by-step breakdown of what each table does:

* **Users Table:** This stores every person who can log into the system. It holds their name, email, department, and role (whether they are a standard employee, a librarian, or an admin). Passwords are never stored as plain text; they are securely encrypted (hashed).
* **Books Table:** This is the catalog. It tracks every book's title, author, category, and ISBN. Importantly, it tracks two specific numbers: `total_copies` (how many physical books BMVEI owns) and `available_copies` (how many are currently sitting on the shelf).
* **Borrow Records Table:** Every time a book leaves the library, a record is created here. It links the user, the book, the date it was borrowed, and the date it is due back. It also tracks the current status (e.g., 'borrowed', 'returned', or 'overdue').
* **Reservations Table:** If a book has zero available copies, a user can reserve it. This table puts them in a virtual line. When the book is returned, the reservation can be fulfilled.
* **Audit Logs Table:** This is a security feature. Every major action taken in the system (like adding a book or returning one) is permanently recorded here so administrators can see exactly who did what and when.

---

## 4. Step-by-Step System Workflows

To truly understand the system, it helps to walk through the most common actions step-by-step.

### 4.1 How Authentication (Logging In) Works
1. A user types their email and password into the login screen.
2. The frontend sends this securely to the backend.
3. The backend database retrieves the user's encrypted password and compares it to the password that was typed in.
4. If they match, the server generates two special digital keys (called JWTs).
   * **Access Token:** A short-lived key (lasts 15 minutes) used to access the system.
   * **Refresh Token:** A longer-lived key (lasts 7 days) stored securely in the browser. When the Access Token expires, the system uses this Refresh Token to silently get a new one without forcing the user to log in again.

### 4.2 How Borrowing a Book Works
Borrowing a book is one of the most critical parts of the system because we must ensure two people don't accidentally borrow the exact same copy at the same millisecond.
1. The librarian scans or selects the book and the user's ID.
2. The system checks the rules: Does this user already have the maximum allowed books checked out? Do they already have a copy of this specific book?
3. The system essentially "locks" the book's record in the database for a fraction of a second. 
4. It checks if `available_copies` is greater than zero.
5. If yes, it creates a new "Borrow Record" with today's date and calculates the due date.
6. It then subtracts 1 from the `available_copies` in the Books table.
7. Finally, it unlocks the record and tells the frontend the process was a success.

### 4.3 How Reservations Work
Sometimes an employee desperately needs a manual, but all copies are currently borrowed.
1. The employee clicks "Reserve" on the book's page.
2. The system verifies that there are zero copies available on the shelf.
3. A "Pending" reservation is created in the database.
4. Later, when another employee returns a copy of that manual, the librarian sees the pending reservation.
5. The librarian clicks "Fulfill Reservation".
6. The system automatically converts that reservation into an active Borrow Record (meaning the book is now officially checked out to the person who reserved it) and updates the employee's dashboard to say "In Your Hands".

### 4.4 Automated Overdue Tracking
In the past, librarians had to manually check logbooks to see who was late returning a book. Now, the system does it automatically while everyone is sleeping.
1. Every night at midnight, a hidden background task wakes up on the server.
2. It looks at all active Borrow Records.
3. If it finds a record where the `due_date` was yesterday or earlier, and the book hasn't been returned, it automatically changes the status of that record to "Overdue".
4. This ensures that when the librarian opens the system in the morning, the overdue reports are completely accurate and up to date.

---

## 5. Security Measures

Protecting BMVEI's data and ensuring the system cannot be tampered with is a top priority. Here is how we secure the application:

* **Preventing Unauthorized Access:** The system uses Role-Based Access Control (RBAC). This means that even if a standard employee tries to access a librarian-only page, the server will block them. 
* **Database Protection (SQL Injection Prevention):** Hackers sometimes try to type malicious database commands into search bars. Our system strictly sanitizes all inputs and uses "Prepared Statements". This forces the database to treat all input strictly as text, making it impossible to inject malicious commands.
* **Brute-Force Protection:** If someone tries to guess a password and fails multiple times in a row, the system temporarily locks them out (Rate Limiting) to prevent automated attacks.

---

## 6. Conclusion

The BMVEI Library Management System completely transforms how technical literature is managed within the organization. By automating complex workflows like borrowing concurrency, reservation fulfillment, and overdue tracking, the system frees up valuable time for librarians. Simultaneously, it provides a highly secure, modern, and user-friendly experience for all employees, ensuring they always have access to the knowledge they need to do their jobs effectively.
