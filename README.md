# LectureMate

LectureMate is a modern web application designed to help students manage and access their lecture summaries efficiently. Built with React, Firebase, and Express, it provides a seamless experience for organizing and downloading lecture materials.

## 🌟 Features

- **Course Organization**: Easily navigate through different terms and courses
- **Week-by-Week Structure**: Access lecture materials organized by academic weeks
- **PDF Management**: Download or view lecture summaries in PDF format
- **Responsive Design**: Beautiful and functional interface on all devices
- **Real-time Updates**: Instant access to newly added lecture materials
- **Cross-Platform**: Works on all modern browsers and devices

## 🚀 Live Demo

Visit the live application at: [https://lecturemate-ad674.web.app](https://lecturemate-ad674.web.app)

## 🛠️ Technology Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Tailwind CSS
  - Framer Motion
  - Headless UI
  - Vite

- **Backend**:
  - Node.js
  - Express
  - Firebase Storage
  - LaTeX (for PDF generation)

- **Deployment**:
  - Firebase Hosting
  - Firebase Storage
  - Express Server

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm (v7 or higher)
- LaTeX distribution (for PDF generation)
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/LectureMate.git
   cd LectureMate
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

3. **Environment Setup**
   - Create a `.env` file in the root directory
   - Add your Firebase configuration:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

## 🚀 Running the Application

1. **Start the backend server**
   ```bash
   cd server
   node index.js
   ```
   The server will run on http://localhost:3000

2. **Start the frontend development server**
   ```bash
   # In a new terminal, from the project root
   npm run dev
   ```
   The application will be available at http://localhost:5173

## 📦 Building for Production

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## 🏗️ Project Structure

```
LectureMate/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   ├── firebase.ts       # Firebase configuration
│   └── App.tsx          # Main application component
├── server/               # Backend server code
│   └── index.js         # Express server
├── public/              # Static assets
├── transcriptions/      # PDF storage directory
└── dist/                # Production build
```

## 🔒 Security

- Environment variables are used for sensitive data
- Firebase Security Rules are implemented
- CORS is properly configured
- PDF access is controlled and secured

## 🤝 Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- React Team
- Firebase Team
- All contributors and supporters
