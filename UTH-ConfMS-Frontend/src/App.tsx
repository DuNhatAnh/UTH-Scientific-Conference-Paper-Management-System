import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Public/Home';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { Footer } from './components/Footer';
import { PaperDetail } from './pages/Author/PaperDetail';
import { ConferenceDetails } from './components/ConferenceDetails';
import { CallForPapers } from './components/CallForPapers';
import { Program } from './components/Program';
import { AuthorDashboard } from './pages/Author/Dashboard';
import { SubmitPaper } from './pages/Author/SubmitPaper';
import { ReviewerDashboard } from './pages/Reviewer/Dashboard';
import { ChairDashboard } from './pages/Chair/Dashboard';
import { CreateConference } from './pages/Chair/CreateConference';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { UserManagement } from './pages/Admin/UserManagement';
import { SystemConfig } from './pages/Admin/SystemConfig';
import { DataBackup } from './pages/Admin/DataBackup';
import { DecisionNotification } from './components/DecisionNotification';
import { Profile } from './components/Profile';
import { PCMemberManagement } from './pages/Chair/PCMemberManagement';
import { CFPManagement } from './pages/Chair/CFPManagement';
import { PCManagement } from './pages/Chair/PCManagement';
import { AcceptInvitation } from './pages/Public/AcceptInvitation';
import { useAuth, UserRole } from './contexts/AuthContext';
export type ViewState =
  | 'home'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'conference-details'
  | 'call-for-papers'
  | 'program'
  | 'author-dashboard'
  | 'create-conference'
  | 'submit-paper'
  | 'reviewer-dashboard'
  | 'chair-dashboard'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-config'
  | 'admin-backup'
  | 'decision'
  | 'profile'
  | 'pc-members'
  | 'cfp-management'
  | 'pc-management'
  | 'pc-members'
  | 'accept-invitation'
  | 'paper-detail';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [selectedConferenceId, setSelectedConferenceId] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading } = useAuth();

  // Xử lý Deep Link từ Email (ví dụ: /invite/accept?token=...)
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/invite/accept') {
      setCurrentView('accept-invitation');
    }
  }, []);

  // Hàm bảo vệ View: Chỉ render nếu đúng Role
  const renderProtected = (allowedRoles: UserRole[], component: React.ReactNode) => {
    if (isLoading) return <div className="flex h-screen items-center justify-center">Đang tải...</div>;
    if (!isAuthenticated) return <Login onNavigate={setCurrentView} />;
    if (user && !allowedRoles.includes(user.role)) {
      return <div className="p-10 text-center text-red-600 font-bold">Bạn không có quyền truy cập trang này!</div>;
    }
    return component;
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home': return <Home />;
      case 'login': return <Login onNavigate={setCurrentView} />;
      case 'register': return <Register onNavigate={setCurrentView} />;
      case 'forgot-password': return <ForgotPassword onNavigate={setCurrentView} />;
      case 'conference-details': return <ConferenceDetails />;
      case 'call-for-papers': return <CallForPapers onNavigate={setCurrentView} />;
      case 'program': return <Program />;
      case 'author-dashboard': return renderProtected(['author', 'admin', 'chair', 'reviewer'],
        <AuthorDashboard
          onNavigate={setCurrentView}
          onViewPaper={(id) => {
            setSelectedPaperId(id);
            setCurrentView('paper-detail');
          }}
        />
      );
      case 'paper-detail': return renderProtected(['author', 'admin', 'chair', 'reviewer'], <PaperDetail paperId={selectedPaperId} onNavigate={setCurrentView} />);
      case 'submit-paper': return renderProtected(['author', 'admin', 'chair', 'reviewer'], <SubmitPaper onNavigate={setCurrentView} />);
      case 'reviewer-dashboard': return renderProtected(['reviewer', 'admin', 'chair'], <ReviewerDashboard />);
      case 'chair-dashboard': return renderProtected(['chair', 'admin'],
        <ChairDashboard
          onNavigate={setCurrentView}
          onManageConference={(id) => {
            setSelectedConferenceId(id);
            setCurrentView('cfp-management');
          }}
          onManagePC={(id) => {
            setSelectedConferenceId(id);
            setCurrentView('pc-management');
          }}
        />
      );
      case 'create-conference': return renderProtected(['chair', 'admin'], <CreateConference onNavigate={setCurrentView} />);
      case 'admin-dashboard': return renderProtected(['admin'], <AdminDashboard onNavigate={setCurrentView} />);
      case 'admin-users': return renderProtected(['admin'], <UserManagement onNavigate={setCurrentView} />);
      case 'admin-config': return renderProtected(['admin'], <SystemConfig onNavigate={setCurrentView} />);
      case 'admin-backup': return renderProtected(['admin'], <DataBackup onNavigate={setCurrentView} />);
      case 'decision': return <DecisionNotification />;
      case 'profile': return isAuthenticated ? <Profile /> : <Login onNavigate={setCurrentView} />;
      case 'pc-members': return renderProtected(['chair', 'admin'], <PCMemberManagement />);
      case 'cfp-management': return renderProtected(['chair', 'admin'],
        <CFPManagement
          onNavigate={setCurrentView}
          conferenceId={selectedConferenceId || undefined}
        />
      );
      case 'pc-management': return renderProtected(['chair', 'admin'],
        <PCManagement
          onNavigate={setCurrentView}
          conferenceId={selectedConferenceId || undefined}
        />
      );
      case 'accept-invitation': return <AcceptInvitation />;
      default: return <Home />;
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark transition-colors duration-200">
      <Navbar onNavigate={setCurrentView} currentView={currentView} />
      <main className="flex flex-col grow">
        {renderContent()}
      </main>
      <Footer onNavigate={setCurrentView} />
    </div>
  );
};

export default App;