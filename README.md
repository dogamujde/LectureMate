# LectureMate

LectureMate is a web application that helps students access and manage their lecture summaries and course materials. It provides an organized interface for viewing and downloading lecture PDFs across different courses and terms.

## Features

- Course organization by terms
- Weekly lecture summaries
- PDF viewing and downloading
- Mobile-friendly interface
- Firebase integration for storage
- Beautiful and modern UI with animations

## Tech Stack

- React
- Firebase (Storage & Hosting)
- Express.js
- Tailwind CSS
- Framer Motion
- Headless UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account and project
- LaTeX installation (for PDF generation)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/LectureMate.git
cd LectureMate
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project
   - Enable Firebase Storage
   - Update the Firebase configuration in `src/firebase.js`

4. Start the development server:
```bash
npm run dev
```

5. Start the backend server:
```bash
node server/index.js
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## Project Structure

- `/src` - React frontend code
- `/server` - Express.js backend
- `/public` - Static assets
- `/transcriptions` - PDF storage (local development)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
