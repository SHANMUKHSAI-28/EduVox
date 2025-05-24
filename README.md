# EduVox - Educational Platform

EduVox is a comprehensive educational platform built with React, Tailwind CSS, and Firebase. It provides features for university shortlisting, educational guidance, and student management.

## Features

- 🔐 **Authentication**: Email/password and Google Sign-In
- 👤 **User Management**: Role-based access control (student, admin, consultant)
- 🎓 **University Shortlisting**: Personalized university recommendations (Coming Soon)
- 📊 **Dashboard**: Comprehensive user dashboard with analytics
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🔥 **Firebase Integration**: Authentication, Firestore database

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **Routing**: React Router v6
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EduVox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google providers)
   - Enable Firestore Database
   - Copy your Firebase configuration

4. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. **Deploy Firestore Security Rules**
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Initialize: `firebase init firestore` (select your project)
   - Deploy rules: `firebase deploy --only firestore:rules`

6. **Start the development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── FormInput.jsx
│   │   ├── FormTextarea.jsx
│   │   ├── FormSelect.jsx
│   │   ├── Modal.jsx
│   │   ├── Navbar.jsx
│   │   └── Sidebar.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx   # Authentication context
├── pages/
│   ├── LandingPage.jsx
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── Profile.jsx
│   └── Universities.jsx
├── firebaseConfig.js     # Firebase configuration
├── App.jsx              # Main app component
└── main.jsx            # App entry point
```

## User Roles

- **Student**: Default role, access to basic features
- **Admin**: Full access, can manage user roles
- **Consultant**: Educational consultant features (Future)

## Firestore Schema

### Users Collection
```javascript
{
  "uid": "firebase_auth_uid",        // Document ID = Firebase Auth UID
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoURL": "url_to_photo.jpg",
  "role": "student",                 // 'student', 'admin', 'consultant'
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Modules

- University search and filtering
- Application tracking
- Consultant booking system
- Document management
- Notification system

## License

This project is licensed under the MIT License.

## Support

For support, email support@eduvox.com or create an issue in the repository.
