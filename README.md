# My BJJ - Jiu-Jitsu Progress Tracker

A modern, Progressive Web App (PWA) for tracking your Brazilian Jiu-Jitsu journey. Built with React, TypeScript, Tailwind CSS, and Supabase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC)

## ✨ Features

### 🥋 Core Features
- **Training Log**: Track your training sessions with notes, techniques, and duration
- **Progress Tracking**: Monitor your belt progression and degrees
- **Academy Management**: Join academies, manage memberships, and view fellow students
- **Check-in System**: Simple check-in tracking for academy attendance
- **Timer de Rola**: Built-in rolling timer to track your sparring sessions

### 🤖 AI-Powered
- **AI Coach**: Personalized training suggestions powered by Google's Gemini AI
- Analyzes your training history and gives tailored recommendations

### 👥 Multi-Academy Support
- Join multiple academies
- Track which academy each training session belongs to
- Academy owners can manage members and approve join requests

### 📱 Progressive Web App
- Install on mobile devices
- Works offline with local-first architecture
- Automatic sync with Supabase backend
- Fast, responsive interface

### 🔒 Secure
- Row Level Security (RLS) policies for data isolation
- Google OAuth authentication
- Profile photos automatically synced from Google account

### 👨‍💼 Admin Dashboard
- Comprehensive view of all users, academies, and memberships
- Search and filter capabilities
- Real-time statistics

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **VitePWA** - Progressive Web App capabilities

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Row Level Security
- **Python FastAPI** - Facial recognition API
  - DeepFace integration for face detection and recognition
  - Deployed as serverless function on Vercel

### AI
- **Google Gemini 1.5 Flash** - AI training suggestions

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud account (for Gemini AI)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/my-bjj.git
cd my-bjj
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Variables**

Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. **Database Setup**

Run the following scripts in your Supabase SQL Editor (in order):

```bash
# 1. Setup database schema (create tables)
# See Supabase dashboard for schema

# 2. Enable production RLS policies
production-rls-migration.sql

# 3. (Optional) Test RLS policies
test-production-rls.sql
```

5. **Run Development Server**
```bash
npm run dev
```

6. **Build for Production**
```bash
npm run build
```

## 🗄️ Database Schema

### Main Tables
- **profiles** - User profiles with belt, degrees, role
- **academies** - Jiu-Jitsu academies/gyms
- **academy_members** - Membership relationships
- **trainings** - Training session logs

### Row Level Security
The app uses comprehensive RLS policies to ensure:
- Users can only see/edit their own data
- Academy owners can manage their academy
- Profiles and academies are publicly browsable
- Training logs remain private

## 🎨 Features in Detail

### Local-First Architecture
The app uses a local-first approach:
- Data is stored in localStorage for instant access
- Changes sync to Supabase in the background
- Works offline, syncs when online
- No loading states for better UX

### AI Coach
Powered by Google's Gemini 1.5 Flash, the AI coach:
- Analyzes your recent training history
- Considers your belt level
- Suggests specific techniques to focus on
- Provides personalized motivation

### Admin Dashboard
Accessible only to admin users (configurable via email):
- View all users with belt progression
- Manage academies and memberships
- Search and filter functionality
- Real-time member counts

## 🚢 Deployment

### Vercel (Recommended)

#### Frontend Deployment
1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `VITE_GEMINI_API_KEY`: Your Google Gemini API key (optional)
   - `VITE_DEEPFACE_API_URL`: Your deployed API URL (e.g., `https://your-api-project-name.vercel.app/api`)
4. Deploy!

#### Backend API Deployment
1. Create a new Vercel project for the backend
2. Import the same repository
3. Change the Root Directory to `/api` in the Settings
4. Deploy - this will create your facial recognition API endpoint

#### Troubleshooting Common Issues
- **Timeout errors**: Increase timeout values in `src/lib/deepFaceService.ts`
- **Cold start delays**: The first API call may be slow as models load
- **Memory limits**: Vercel's free tier has limited memory; consider upgrading for heavy ML operations
- **Deployment fails**: Check that all dependencies in `backend/requirements.txt` are compatible with Vercel

### Manual Deploy
```bash
npm run build
# Upload the dist/ folder to your hosting provider
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | ⚠️ Optional (AI features) |

## 🛠️ Development

### Project Structure
```
my-bjj/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth, Language)
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utility libraries (Supabase, Gemini)
│   ├── pages/          # Page components
│   ├── types/          # TypeScript types
│   └── locales/        # i18n translations
├── public/             # Static assets
└── sql/                # Database migration scripts
```

### Key Files
- `useLocalStorage.ts` - Local-first data management
- `useSupabaseSync.ts` - Sync logic with Supabase
- `production-rls-migration.sql` - Production RLS policies

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Backend by [Supabase](https://supabase.com/)
- AI by [Google Gemini](https://ai.google.dev/)
- Icons by [Lucide](https://lucide.dev/)

---

Made with ❤️ for the Jiu-Jitsu community
