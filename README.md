# Campus Ride Sharing System - ShareLane

A full-stack campus ride sharing web application built with React, Node.js, Express, MongoDB, and Stripe integration. The platform connects staff (ride providers) with students (ride seekers) for convenient and affordable campus transportation.

## 🚀 Features

### Core Functionality
- **Dual User Roles**: Staff can create and manage rides, students can search and book rides
- **Real-time Notifications**: Live updates using Socket.IO for bookings, payments, and ride updates
- **Secure Payments**: Stripe integration for safe payment processing
- **Rating System**: Post-ride reviews and ratings for both staff and students
- **Responsive Design**: Mobile-first design using Material-UI and Tailwind CSS

### Staff Features
- Create, update, and delete rides
- Manage bookings and view earnings
- Real-time notifications for new bookings
- Payment tracking and refund processing
- Review management

### Student Features
- Search and filter available rides
- Book rides with secure payment
- Track booking status and history
- Rate and review ride experiences
- Payment history and refund tracking

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.IO** for real-time communication
- **Stripe** for payment processing
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **React 18** with functional components and hooks
- **Material-UI (MUI)** for complex UI components
- **Tailwind CSS** for utility styling and layouts
- **React Router** for navigation
- **React Hook Form** for form handling
- **Axios** for API communication
- **Socket.IO Client** for real-time features
- **Stripe Elements** for payment processing

## 📁 Project Structure

```
campus-ride-sharing/
├── backend/
│   ├── controllers/          # API route handlers
│   ├── models/              # MongoDB schemas
│   ├── routes/              # Express routes
│   ├── middleware/          # Custom middleware
│   ├── config/              # Database configuration
│   ├── app.js               # Express app setup
│   └── server.js            # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context providers
│   │   ├── services/        # API service functions
│   │   ├── App.js           # Main app component
│   │   └── index.js         # React entry point
│   └── public/              # Static assets
└── package.json             # Root package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Stripe account (for payment processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campus-ride-sharing
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/campus-ride-sharing
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # Email (Optional)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Server
   PORT=5000
   CLIENT_URL=http://localhost:3000
   
   # Environment
   NODE_ENV=development
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the backend (port 5000) and frontend (port 3000) servers.

### Alternative Setup

**Backend only:**
```bash
cd backend
npm install
npm run dev
```

**Frontend only:**
```bash
cd frontend
npm install
npm start
```

## 🔧 Configuration

### Stripe Setup
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe dashboard
3. Add the keys to your `.env` file
4. Set up webhooks for payment processing

### MongoDB Setup
- **Local**: Install MongoDB locally and run `mongod`
- **Cloud**: Use MongoDB Atlas or another cloud provider
- Update the `MONGODB_URI` in your `.env` file

## 📱 Usage

### For Staff (Ride Providers)
1. Register with staff credentials
2. Create rides with pickup/destination details
3. Manage bookings and confirmations
4. Track earnings and process refunds
5. View and respond to reviews

### For Students (Ride Seekers)
1. Register with student credentials
2. Search for available rides
3. Book rides and make secure payments
4. Track booking status
5. Rate and review completed rides

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Secure payment processing with Stripe

## 🎨 UI/UX Features

- **Material-UI Components**: Tables, forms, modals, date pickers
- **Tailwind CSS**: Responsive layouts, spacing, custom styling
- **Real-time Updates**: Live notifications and status updates
- **Mobile Responsive**: Optimized for all device sizes
- **Dark/Light Theme**: Consistent design system

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set up MongoDB Atlas
2. Configure environment variables
3. Deploy to Heroku, Vercel, or your preferred platform

### Frontend Deployment
1. Build the production bundle
2. Deploy to Netlify, Vercel, or your preferred platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Mobile app development
- Advanced analytics dashboard
- Integration with campus systems
- Automated ride matching
- Route optimization
- Multi-language support

---

**ShareLane** - Making campus transportation simple, safe, and sustainable! 🚗💨
