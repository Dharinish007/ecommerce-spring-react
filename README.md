# Angadi (ಅಂಗಡಿ) - Full-Stack E-Commerce Learning Platform

A full-stack e-commerce web application built with **Spring Boot 3** and **React 19**, designed to showcase clean, robust engineering patterns for learning and development: secure HttpOnly-cookie JWT authentication, role-based access control (RBAC), authoritative cart and checkout calculations, atomic inventory deduction, Flyway schema migrations, and a responsive modern storefront.

---

## Tech Stack

### Backend
- **Framework:** Spring Boot 3.5.6 (Java 21)
- **Security:** Spring Security 6 with stateless JWT authentication via HttpOnly cookies (`sbecomcookie`)
- **Database & ORM:** MySQL 8+, Spring Data JPA, Hibernate ORM
- **Database Migrations:** Flyway (`src/main/resources/db/migration/`) with `ddl-auto=validate`
- **API Documentation:** SpringDoc OpenAPI 2.8.5 (Swagger UI)
- **Utilities:** ModelMapper, Lombok, JJWT (0.12.6)
- **Testing:** JUnit 5, Mockito, Spring Boot Test

### Frontend
- **Framework & Build:** React 19, TypeScript 5.9, Vite 8
- **State Management:** Redux Toolkit 2 (Auth, Cart, UI toast slices)
- **Routing:** React Router DOM 7
- **Styling:** Tailwind CSS 4, Lucide React icons
- **HTTP Client:** Axios with centralized error extraction and credential cookies enabled
- **Linter & Typecheck:** Oxlint, TypeScript compiler (`tsc`)

---

## Key Features

1. **Authentication & Authorization**
   - Single source of truth authentication using secure `HttpOnly`, `SameSite=Lax` cookies.
   - Zero access token exposure in response bodies or browser `localStorage`.
   - Role-Based Access Control: `ROLE_USER`, `ROLE_SELLER`, and `ROLE_ADMIN`.
   - Protection against privilege escalation, IDOR, and self-demotion by administrators.

2. **Product Catalog & Browsing**
   - Categories, search, and multi-parameter pagination (sort by price, discount, name, date).
   - Real-time discount calculations with special pricing display.
   - Out-of-stock badges and product detail views.

3. **Cart & Shopping Experience**
   - Synchronized server-side cart with stock availability checks.
   - Safe quantity increment, decrement, and removal.
   - Automatic price updates when catalog items change.

4. **Checkout & Order Management**
   - Authoritative backend pricing: subtotal, discount, and standard shipping calculations (free shipping for orders $\ge$ ₹499.00).
   - Atomic inventory deduction upon order placement with optimistic/pessimistic safeguards.
   - Historical snapshots: preserves product name and image snapshot on order items even if catalog records are updated or deleted later.

5. **Demo Payment Workflow**
   - Simulated test payment gateway (`Angadi Pay (Demo)`) and `Cash On Delivery`.
   - Server-verified payment states (`PAID` or simulated failures for testing).

6. **Customer Account & Admin Consoles**
   - Multi-address management with street, city, state, and pincode validation.
   - Order history with item breakdowns and status badges (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
   - Admin management consoles for products, categories, orders, and user role assignments.

---

## Project Structure

```
ecommerce-spring-react/
├── Ecom-backend/
│   ├── src/main/java/com/ecommerce/project/
│   │   ├── config/              # App & OpenAPI configuration
│   │   ├── controller/          # REST controllers (Auth, Products, Orders, Admin, etc.)
│   │   ├── exception/           # Global exception handler & custom exceptions
│   │   ├── model/               # JPA entities (User, Product, Order, Cart, Address, etc.)
│   │   ├── payload/             # Request/Response DTOs & API models
│   │   ├── repositories/        # Spring Data JPA repositories
│   │   ├── security/            # SecurityFilterChain, JWT filter & utils, user details
│   │   ├── service/             # Business logic interfaces & implementations
│   │   └── util/                # AuthUtil, SortUtils
│   ├── src/main/resources/
│   │   ├── db/migration/        # Flyway SQL migrations (V1__init_schema.sql)
│   │   └── application.properties # Spring configuration & environment placeholders
│   ├── src/test/java/           # Unit & integration tests
│   ├── mvnw / mvnw.cmd          # Maven wrapper
│   └── pom.xml                  # Backend dependencies & plugins
├── Ecom-frontend/
│   ├── src/
│   │   ├── api/                 # Axios client & typed API service modules
│   │   ├── components/          # Reusable UI components (buttons, modals, cards, skeletons)
│   │   ├── pages/
│   │   │   ├── account/         # Profile, addresses, checkout, order history
│   │   │   ├── admin/           # Admin dashboard, products, categories, orders, users
│   │   │   ├── auth/            # Login and register pages
│   │   │   └── public/          # Home, catalog, product details, cart, 404
│   │   ├── store/               # Redux store & state slices
│   │   ├── types/               # TypeScript interfaces & DTO definitions
│   │   └── utils/               # Currency & date formatters, image URL helpers
│   ├── package.json             # Frontend dependencies & scripts
│   ├── vite.config.ts           # Vite configuration
│   └── tsconfig.json            # TypeScript configuration
└── README.md                    # Project documentation
```

---

## Database Setup

The application uses **MySQL 8+** and manages schema versioning with **Flyway**:

1. Ensure MySQL is running locally on port `3306`.
2. Create the target database (or let MySQL create it on connection):
   ```sql
   CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Flyway migration `V1__init_schema.sql` executes automatically on the first backend run, creating all required tables, foreign keys, unique constraints, and indexes.
4. Hibernate runs in `ddl-auto=validate` mode to safeguard against unintended schema modifications.

---

## Environment Variables

Configure these environment variables or accept the default local development values in `application.properties`:

| Variable | Description | Default Development Value |
|---|---|---|
| `SPRING_DATASOURCE_URL` | JDBC connection string | `jdbc:mysql://localhost:3306/ecommerce_db?...` |
| `SPRING_DATASOURCE_USERNAME` | MySQL username | `root` |
| `SPRING_DATASOURCE_PASSWORD` | MySQL password | `root` |
| `JWT_SECRET` | 256-bit secret key for HMAC signing | Safe local development fallback |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `SEED_ADMIN_PASSWORD` | Initial password for seeded `admin` user | `Admin@123` |

---

## How to Run Locally

### Prerequisites
- **Java 21** JDK installed
- **Node.js 18+** & `npm` installed
- **MySQL 8.0+** running

### 1. Run Backend
```bash
cd Ecom-backend

# On Windows (PowerShell / Command Prompt)
.\mvnw.cmd spring-boot:run

# On Linux / macOS
./mvnw spring-boot:run
```
The API server starts on **`http://localhost:8080`**.

### 2. Run Frontend
```bash
cd Ecom-frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The client application starts on **`http://localhost:5173`**.

---

## Demo Accounts & Seed Data

On initial boot, the application seeds standard roles and baseline demo accounts if they do not exist:

| Role | Username | Email | Default Password | Permissions |
|---|---|---|---|---|
| **Admin** | `admin` | `admin@example.com` | `Admin@123` | Full admin console, catalog, categories, user roles |
| **Seller** | `seller` | `seller@example.com` | `Seller@123` | Product and inventory management |
| **Customer** | `user` | `user@example.com` | `User@123` | Storefront browsing, cart, checkout, address book |

> **Security Note:** In production, provide strong passwords via `SEED_ADMIN_PASSWORD` or register a new admin and disable default seeds.

---

## API Documentation & Swagger

Once the backend is running, explore and test the REST endpoints interactively:
- **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON Spec:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

## Testing & Quality Checks

### Frontend Checks
```bash
cd Ecom-frontend
npm run lint    # Runs oxlint
npm run build   # Typechecks with tsc and builds production assets
```

### Backend Tests
```bash
cd Ecom-backend
.\mvnw.cmd test # Runs JUnit 5 test suite (Cart, Orders, Auth, Security, Exceptions)
```

---

## Important Project Limitations

Because this repository is designed as a focused learning project:
- **Simulated Payment Gateway:** Payment flows use a simulated `Angadi Pay (Demo)` authorization mechanism rather than live bank integration (Stripe, Razorpay, or PayPal).
- **Local File Storage:** Uploaded product images are stored locally under the backend `images/` directory rather than on a remote cloud storage provider (e.g. AWS S3).
- **Monolithic Setup:** Architecture is kept intentionally simple and monolithic for straightforward local execution without Docker, Kubernetes, microservices, or external message queues.
