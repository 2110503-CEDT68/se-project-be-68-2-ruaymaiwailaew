# Dentist Booking
This project is final project in Software Development Practice class

## Project Requirements
- The system shall allow a user to register by specitying the name, telephone number, email, and password.
- After registration, the user becomes a registered user, and the system shall allow the user to log in to use the system by specifying the email and password. The system shall allow a registered user to log out.
- After login, the system shall allow the registered user to book only ONE session by specifying the date and the preferred dentist. The dentist list is also provided to the user. A dentist information includes the dentist's name, years of experience, and area of expertise.
- The system shall allow the registered user to view his booking.
- The system shall allow the registered user to edit his booking.
- The system shall allow the registered user to delete his booking.
- The system shall allow the admin to view any bookings.
- The system shall allow the admin to edit any bookings.
- The system shall allow the admin to delete any bookings.

## Getting the Source Code
### Prerequisites
Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* npm (comes with Node.js)
* MongoDB (Local instance or MongoDB Atlas)

### Installation & Setup
1. **Clone the repository to your local machine**:
``` bash
cd ${WORKDIR}
git clone https://github.com/2110503-CEDT68/be-project-68-gofiber.git
cd be-project-68-gofiber
```
2. **Install dependencies**:
This will install all required packages (like express, mongoose, dotenv, etc.) listed in package.json.
``` bash
npm install
```
3. **Environment Variables Configuration**:
Create a config.env file inside the config directory (as per our dotenv setup):
``` bash
cp config/config.env.example config/config.env
```
4. **Try to run the application**:
``` bash
# For development mode (if nodemon is installed)
npm run dev
# For production mode
npm start
```

5. **Test in postman**:
Import postman.json in project to postman and try to test api

## Project Team
- [6833295221 Auraion Pinsiri](https://github.com/bmybest)
- [6833085821 Natpakan Sainam](https://github.com/EnxFad)
- [6833063021 Thitipong Phuangphet](https://github.com/Thitipong-PP)