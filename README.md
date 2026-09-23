# 🚗 DriveGo — Vehicle Rental & Fleet Management System

**DriveGo** is a modern, responsive frontend application for a **Vehicle Rental & Fleet Management System**, developed to provide a user-friendly interface for customers, drivers, fleet managers, and administrators.

The application is built with **HTML5, CSS3, JavaScript, Bootstrap 5.3.3, Bootstrap Icons, and Chart.js**, and communicates with a Spring Boot REST API backend using JWT-based authentication.

DriveGo provides separate dashboards and workflows for different user roles, covering vehicle management, rentals, payments, invoices, maintenance, inspections, reviews, customer profiles, driver operations, and customer vehicle assistance.

---

## 🌐 Project Overview

DriveGo is the frontend client of a full-stack Vehicle Rental & Fleet Management System.

The application is designed around four main user roles:

* 👑 **Administrator**
* 🚘 **Fleet Manager**
* 👤 **Customer**
* 👨‍✈️ **Driver**

Each role receives a dedicated interface and access to functionality relevant to their responsibilities.

The frontend communicates with the backend through REST APIs and uses JWT access tokens to maintain authenticated sessions.

---

# ✨ Key Features

## 🔐 Authentication & Authorization

DriveGo provides a secure login and role-based navigation system.

### Authentication Features

* User login
* JWT access token handling
* Role-based redirection
* Protected pages
* Logout functionality
* Password visibility toggle
* Login validation
* Loading states
* Error handling
* Local storage based session management

After authentication, users are redirected according to their role:

```text
ADMIN
    ↓
Admin Dashboard

FLEET_MANAGER
    ↓
Fleet Manager Dashboard

CUSTOMER
    ↓
Customer Dashboard

DRIVER
    ↓
Driver Dashboard
```

---

# 👑 Admin Dashboard

The Administrator has access to the main system management features.

### Admin Modules

* Dashboard
* User Management
* Vehicle Management
* Customer Management
* Driver Management
* Rental Management
* Payment Management
* Invoice Management
* Maintenance Management
* Vehicle Documents
* Vehicle Inspections
* Reviews

The dashboard provides a centralized interface for managing the major operations of the rental company.

---

# 🚘 Vehicle Management

DriveGo provides structured fleet management through separate interfaces for:

* Vehicles
* Vehicle Brands
* Vehicle Categories
* Vehicle Models

### Vehicle Management Features

* Add vehicles
* Update vehicles
* View vehicles
* Delete/manage vehicle records
* Vehicle status management
* Brand management
* Category management
* Model management
* Vehicle search/filter functionality

The frontend communicates with the backend vehicle APIs to keep fleet information synchronized.

---

# 👥 Customer Management

The customer management interface allows authorized staff to manage customer records.

### Customer Features

* View customers
* Add customers
* Update customer information
* View customer details
* Manage customer-related account information

Customer data is retrieved from the backend through REST APIs.

---

# 👨‍✈️ Driver Management

The Driver Management module provides interfaces for managing company drivers.

### Features

* View drivers
* Add drivers
* Update driver information
* Driver selection
* Driver profile information
* Driver status management

Drivers also have their own dedicated dashboard and assigned-rental interface.

---

# 🚗 Fleet Manager Dashboard

Fleet Managers have a dedicated dashboard for fleet-related operations.

The Fleet Manager interface includes access to modules such as:

* Dashboard
* Vehicles
* Customers
* Drivers
* Rentals
* Payments
* Invoices
* Maintenance
* Vehicle Documents
* Vehicle Inspections
* Reviews

This provides a focused interface for day-to-day fleet operations.

---

# 👤 Customer Portal

Customers have a dedicated portal designed around their rental experience.

### Customer Pages

* Customer Dashboard
* Browse Vehicles
* My Rentals
* Payments
* My Invoices
* My Reviews
* Profile
* AI Assistant
* Contact Us

---

## 🚘 Browse Vehicles

Customers can browse available vehicle information through a dedicated vehicle interface.

Vehicle information is loaded dynamically from the backend API.

The vehicle browsing experience is designed to make it easier for customers to view available fleet options before proceeding with rental operations.

---

# 📋 My Rentals

Customers can view their rental information through the **My Rentals** page.

The page communicates with:

```text
/v1/rental/me
```

and displays customer-specific rental information.

---

# 💳 Customer Payments

Customers can view their payment history through the dedicated Payments page.

The frontend communicates with the payment API and displays information such as:

* Payment reference
* Amount
* Discount
* Balance
* Payment date
* Payment method
* Payment status

---

# 🧾 Customer Invoices

Customers can view their invoices through the **My Invoices** page.

Invoice information is retrieved from the backend through the customer-specific invoice API.

---

# ⭐ Customer Reviews

Customers can manage their reviews through the dedicated Reviews page.

### Review Features

* View submitted reviews
* Submit reviews
* Update reviews
* Delete reviews
* Load customer-specific reviews

The frontend communicates with:

```text
/v1/review/*
```

---

# 👤 Customer Profile

The customer profile interface provides a dedicated area for viewing and updating customer information.

The profile functionality communicates with customer and user profile APIs to manage account-related information.

---

# 🤖 Customer AI Assistant

DriveGo includes a dedicated **AI Assistant** page for customers.

The assistant communicates with the backend AI endpoint:

```text
/v1/ai/chat
```

The AI assistant is designed as a **customer-facing vehicle information feature** that helps customers interact with the system conversationally.

> **Important:** The AI Assistant is a separate customer feature and is **not part of the Admin Dashboard**.

---

# 📍 Contact Us

DriveGo includes a dedicated Customer **Contact Us** page.

The page provides company contact information and location-related information, including:

* Company contact details
* Email communication
* WhatsApp contact
* Google Maps location
* Embedded map
* Rental company location information

This allows customers to easily find and contact the rental company.

---

# 👨‍✈️ Driver Portal

Drivers have their own dedicated interface.

### Driver Pages

* Driver Dashboard
* Driver Profile
* Assigned Rentals

---

## 📋 Assigned Rentals

Drivers can view rentals assigned to them.

The frontend communicates with the backend rental-driver functionality to retrieve driver-specific assignments.

This allows drivers to focus on the rental operations assigned to them.

---

# 🔧 Maintenance Management

The frontend provides maintenance management functionality for fleet operations.

### Features

* View maintenance records
* Add maintenance records
* Update maintenance records
* Maintenance status handling
* Service date information
* Next service information

The frontend communicates with the backend maintenance APIs.

---

# 🔍 Vehicle Inspection Management

DriveGo includes vehicle inspection management interfaces.

### Features

* View inspections
* Add inspection records
* Update inspection information
* Select vehicle inspection records
* Manage inspection-related information

Both general management and Fleet Manager-specific inspection pages are available.

---

# 📄 Vehicle Document Management

The frontend provides a dedicated Vehicle Documents module.

### Features

* View vehicle documents
* Add documents
* Update documents
* Track document status
* View document expiry alerts

The application uses the backend endpoint:

```text
/v1/vehicleDocument/expiry-alerts
```

to retrieve relevant document expiry information.

---

# 💰 Rental Management

The Rental Management interface allows authorized users to manage rental transactions.

### Rental Operations

* View rentals
* Create rentals
* Update rentals
* View rental details
* Manage rental status
* Customer and vehicle selection
* Rental rate integration

The frontend communicates with:

```text
/v1/rental/*
```

---

# 💳 Payment Management

Authorized users can manage rental payments through the Payment Management module.

### Features

* View payments
* Create payments
* Update payments
* Payment status management
* Payment reference management
* Rental association

Backend API:

```text
/v1/payment/*
```

---

# 🧾 Invoice Management

The frontend provides invoice management for rental operations.

### Features

* View invoices
* Create invoices
* Update invoices
* View invoice details
* Customer-specific invoices

Backend API:

```text
/v1/invoice/*
```

---

# ⭐ Review Management

The application includes a review management interface for authorized system operations.

### Features

* View reviews
* Create reviews
* Update reviews
* Delete reviews
* Customer-specific reviews

---

# 📊 Dashboard & Analytics

DriveGo dashboards provide a centralized overview of important system information.

The project uses **Chart.js** for visual data representation where required.

Dashboard interfaces are separated according to user responsibilities.

---

# 🛠️ Technology Stack

| Technology             | Purpose                     |
| ---------------------- | --------------------------- |
| HTML5                  | Page structure              |
| CSS3                   | Custom styling              |
| JavaScript ES6+        | Application logic           |
| Bootstrap 5.3.3        | Responsive UI               |
| Bootstrap Icons 1.11.3 | Interface icons             |
| Chart.js               | Dashboard charts            |
| Fetch API              | Backend communication       |
| LocalStorage           | Authentication/session data |
| JWT                    | Authentication mechanism    |
| Spring Boot REST API   | Backend integration         |

---

# 🎨 UI & Design

The frontend combines **Bootstrap components** with custom CSS to create a modern rental management interface.

### UI Features

* Responsive layouts
* Sidebar navigation
* Dashboard cards
* Responsive tables
* Forms
* Modals
* Alerts
* Loading indicators
* Empty states
* Error messages
* Status badges
* Mobile-friendly layouts
* Bootstrap Icons
* Custom dashboard styling

The application contains separate CSS files for different modules and user roles.

---

# 📱 Responsive Design

DriveGo is designed to work across different screen sizes.

Responsive behavior is implemented using:

* Bootstrap responsive grid
* Bootstrap utility classes
* Custom media queries
* Responsive sidebars
* Responsive tables
* Flexible dashboard layouts
* Mobile-specific navigation behavior

The UI is structured to support:

```text
Desktop
   ↓
Laptop
   ↓
Tablet
   ↓
Mobile
```

---

# 🔗 Backend Integration

DriveGo communicates with the Spring Boot backend through REST APIs.

The API base URL is configured in:

```text
js/config.js
```

Current development configuration:

```javascript
const API_BASE_URL = "http://localhost:8080";
```

This centralized configuration makes it easier to change the backend server URL when deploying the application.

---

# 🌐 Main API Integration

The frontend currently communicates with backend endpoints including:

### Authentication

```text
POST /v1/user/login
POST /v1/register
```

### Users & Roles

```text
GET    /v1/user/all
POST   /v1/user/save
PUT    /v1/user/update
GET    /v1/user/profile
GET    /v1/role/all
```

### Customers

```text
GET    /v1/customer/all
GET    /v1/customer/me/profile
POST   /v1/customer/save
PUT    /v1/customer/update
```

### Drivers

```text
GET    /v1/driver/all
GET    /v1/driver/me
POST   /v1/driver/save
PUT    /v1/driver/update
```

### Vehicles

```text
GET    /v1/vehicle/all
POST   /v1/vehicle/save
PUT    /v1/vehicle/update
GET    /v1/vehicle/select/{id}
```

### Brands

```text
GET    /v1/brand/all
POST   /v1/brand/save
PUT    /v1/brand/update
```

### Categories

```text
GET    /v1/category/all
POST   /v1/category/save
PUT    /v1/category/update
```

### Models

```text
GET    /v1/model/all
POST   /v1/model/save
PUT    /v1/model/update
```

### Rentals

```text
GET    /v1/rental/all
GET    /v1/rental/me
POST   /v1/rental/save
PUT    /v1/rental/update
```

### Payments

```text
GET    /v1/payment/all
GET    /v1/payment/me
POST   /v1/payment/save
PUT    /v1/payment/update
```

### Invoices

```text
GET    /v1/invoice/all
GET    /v1/invoice/me
POST   /v1/invoice/save
PUT    /v1/invoice/update
```

### Maintenance

```text
GET    /v1/maintenance/all
POST   /v1/maintenance/save
PUT    /v1/maintenance/update
```

### Reviews

```text
GET    /v1/review/all
GET    /v1/review/me
POST   /v1/review/save
PUT    /v1/review/update
```

### Vehicle Documents

```text
GET    /v1/vehicleDocument/all
GET    /v1/vehicleDocument/expiry-alerts
POST   /v1/vehicleDocument/save
PUT    /v1/vehicleDocument/update
```

### Vehicle Inspections

```text
GET    /v1/vehicle-inspection/all
POST   /v1/vehicle-inspection/save
PUT    /v1/vehicle-inspection/update
```

### Rental Drivers

```text
GET    /v1/rentalDriver/me
```

### AI Assistant

```text
POST /v1/ai/chat
```

---

# 🔐 Frontend Authentication Flow

The frontend receives authentication information from the backend after successful login.

The application stores authentication-related values in browser `localStorage`.

```text
Login
  ↓
Backend Authentication
  ↓
JWT Token
  ↓
User ID
  ↓
Username
  ↓
Role
  ↓
localStorage
  ↓
Role-based Dashboard
```

Stored authentication values include:

```text
accessToken
userId
username
role
```

The JWT token is then used when accessing protected backend resources.

---

# 📁 Project Structure

```text
vehicle-rental-frontend/
│
├── index.html
│
├── css/
│   ├── style.css
│   ├── common-dashboard.css
│   ├── users.css
│   ├── vehicles.css
│   ├── customers.css
│   ├── drivers.css
│   ├── rentals.css
│   ├── payments.css
│   ├── invoices.css
│   ├── maintenance.css
│   ├── reviews.css
│   ├── documents.css
│   ├── vehicle-inspections.css
│   │
│   ├── customer/
│   ├── driver/
│   └── manager/
│
├── js/
│   ├── auth.js
│   ├── config.js
│   ├── dashboard.js
│   ├── user.js
│   ├── vehicle.js
│   ├── customer.js
│   ├── driver.js
│   ├── rental.js
│   ├── payment.js
│   ├── invoices.js
│   ├── maintenance.js
│   ├── reviews.js
│   ├── documents.js
│   ├── vehicle-inspections.js
│   ├── register.js
│   │
│   ├── customer/
│   ├── driver/
│   └── manager/
│
└── pages/
    ├── dashboard.html
    ├── users.html
    ├── vehicles.html
    ├── customers.html
    ├── drivers.html
    ├── rentals.html
    ├── payments.html
    ├── invoices.html
    ├── maintenance.html
    ├── reviews.html
    ├── documents.html
    ├── vehicle-inspections.html
    ├── register.html
    │
    ├── customer/
    ├── driver/
    └── manager/
```

---

# 📂 Role-Based Page Structure

### Administrator

```text
pages/
├── dashboard.html
├── users.html
├── vehicles.html
├── customers.html
├── drivers.html
├── rentals.html
├── payments.html
├── invoices.html
├── maintenance.html
├── reviews.html
├── documents.html
└── vehicle-inspections.html
```

### Fleet Manager

```text
pages/manager/
├── fleet-manager-dashboard.html
├── vehicles.html
├── customers.html
├── drivers.html
├── rentals.html
├── payments.html
├── invoices.html
├── maintenance.html
├── reviews.html
├── documents.html
└── vehicle-inspections.html
```

### Customer

```text
pages/customer/
├── customer-dashboard.html
├── vehicles.html
├── my-rentals.html
├── payments.html
├── invoices.html
├── reviews.html
├── profile.html
├── ai-chat.html
└── contact.html
```

### Driver

```text
pages/driver/
├── driver-dashboard.html
├── driver-profile.html
└── assigned-rentals.html
```

---

# ⚙️ Getting Started

## 1. Clone the Repository

```bash
git clone <your-frontend-repository-url>
```

Navigate into the project:

```bash
cd vehicle-rental-frontend
```

---

## 2. Configure the Backend URL

Open:

```text
js/config.js
```

Set the backend URL:

```javascript
const API_BASE_URL = "http://localhost:8080";
```

If the backend is deployed to another server, replace the URL accordingly.

---

# ▶️ Running the Frontend

This project is a static frontend application and does not require a Node.js build process.

You can run it using a local development server.

### VS Code

Install the **Live Server** extension and open:

```text
index.html
```

Then select:

```text
Open with Live Server
```

The application will open in the browser.

---

# 🔌 Backend Requirement

The frontend requires the Vehicle Rental & Fleet Management Spring Boot backend to be running.

Default backend URL:

```text
http://localhost:8080
```

Make sure:

1. MySQL is running
2. Backend application is running
3. Backend API is accessible
4. CORS configuration allows frontend requests
5. The frontend `API_BASE_URL` matches the backend URL

---

# 🧪 Testing

The frontend can be tested by logging in using accounts configured in the backend.

### Recommended Testing Flow

```text
Open DriveGo
      ↓
Login
      ↓
JWT Authentication
      ↓
Role Detection
      ↓
Role-specific Dashboard
      ↓
Access Authorized Modules
      ↓
Perform CRUD Operations
      ↓
Backend API
      ↓
Updated UI
```

Different user roles should be tested independently to verify role-based navigation and authorization.

---

# 🔒 Security Considerations

The frontend relies on the backend for actual authentication and authorization.

The frontend:

* Stores the JWT access token locally
* Sends authentication information with protected requests
* Uses role-based page access
* Redirects users according to their role
* Prevents unauthorized UI access through frontend checks

However, frontend authorization should not be considered a replacement for backend authorization. The Spring Boot backend remains responsible for enforcing secure API access.

---

# 📱 Browser Compatibility

The application is designed for modern browsers supporting:

* ES6 JavaScript
* Fetch API
* LocalStorage
* CSS3
* Bootstrap 5

Recommended browsers:

* Google Chrome
* Microsoft Edge
* Mozilla Firefox
* Safari

---

# 🧩 External Libraries

DriveGo uses the following external frontend libraries:

### Bootstrap

Used for responsive layouts, forms, buttons, cards, tables, utilities, and other UI components.

### Bootstrap Icons

Used throughout the application for navigation and interface icons.

### Chart.js

Used for dashboard data visualization.

---

# 🗺️ Application Flow

The overall frontend flow can be represented as:

```text
                    ┌──────────────┐
                    │    Login     │
                    └──────┬───────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ JWT + Role Data │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
       ADMIN        FLEET MANAGER       CUSTOMER
          │                │                │
          ▼                ▼                ▼
      Admin UI         Manager UI      Customer UI
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                    Spring Boot API
                           │
                           ▼
                        MySQL
```

Drivers follow their own dedicated Driver Dashboard and assigned-rental workflow.

---

# 🔄 Full-Stack Architecture

DriveGo is part of a full-stack application:

```text
┌───────────────────────────────────────┐
│              DriveGo UI               │
│       HTML / CSS / JavaScript         │
│            Bootstrap 5.3.3            │
└───────────────────┬───────────────────┘
                    │
                    │ REST API + JWT
                    ▼
┌───────────────────────────────────────┐
│         Spring Boot Backend            │
│       Controller / Service / JPA       │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│                MySQL                  │
└───────────────────────────────────────┘
```

---

# 🚀 Future Improvements

Possible future enhancements for the frontend include:

* Progressive Web App capabilities
* Advanced dashboard analytics
* Improved filtering and sorting
* Enhanced accessibility
* Pagination for large datasets
* More advanced notification components
* Improved production deployment configuration
* Centralized frontend API/service utilities
* Automated frontend testing
* UI performance optimization

---

# 📌 Project Status

**Status:** Development / Academic Project

The DriveGo frontend currently provides role-specific interfaces and REST API integration for the major operations of the Vehicle Rental & Fleet Management System.

It is designed to work together with the corresponding Spring Boot backend.

---

# 👩‍💻 Author

**Hashini Emalsha**

Higher Diploma in Software Engineering
Institute of Java & Software Engineering (IJSE)

---

# 📄 License

This project was developed as an academic software engineering project.

If you plan to reuse, modify, or distribute this project, please contact the author for permission.
