
import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Public/Home';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { Footer } from './components/Footer';
import { ConferenceDetails } from './components/ConferenceDetails';
import { CallForPapers } from './components/CallForPapers';
import { Program } from './components/Program';
import { AuthorDashboard } from './pages/Author/Dashboard';
import { SubmitPaper } from './pages/Author/SubmitPaper';
import { ReviewerDashboard } from './pages/Reviewer/Dashboard';
import { ChairDashboard } from './pages/Chair/Dashboard';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { DecisionNotification } from './components/DecisionNotification';
import { Profile } from './components/Profile';
import { AuthProvider } from './contexts/AuthContext';

export type ViewState = 
  | 'home' 
  | 'login' 
  | 'register' 
  | 'conference-details' 
  | 'call-for-papers' 
  | 'program' 
  | 'author-dashboard' 
  | 'submit-paper' 
  | 'reviewer-dashboard' 
  | 'chair-dashboard' 
  | 'admin-dashboard'
  | 'decision' 
  | 'profile';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');

  const renderContent = () => {
    switch (currentView) {
      case 'home': return <Home />;
      case 'login': return <Login onNavigate={setCurrentView} />;
      case 'register': return <Register onNavigate={setCurrentView} />;
      case 'conference-details': return <ConferenceDetails />;
      case 'call-for-papers': return <CallForPapers onNavigate={setCurrentView} />;
      case 'program': return <Program />;
      case 'author-dashboard': return <AuthorDashboard onNavigate={setCurrentView} />;
      case 'submit-paper': return <SubmitPaper onNavigate={setCurrentView} />;
      case 'reviewer-dashboard': return <ReviewerDashboard />;
      case 'chair-dashboard': return <ChairDashboard />;
      case 'admin-dashboard': return <AdminDashboard />;
      case 'decision': return <DecisionNotification />;
      case 'profile': return <Profile />;
      default: return <Home />;
    }
  };

  return (
    <AuthProvider>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark transition-colors duration-200">
        <Navbar onNavigate={setCurrentView} currentView={currentView} />
        <main className="flex flex-col grow">
          {renderContent()}
        </main>
        <Footer onNavigate={setCurrentView} />
      </div>
    </AuthProvider>
  );
};

export default App;
