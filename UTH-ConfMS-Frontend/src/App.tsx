import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
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
import { SubmissionManagement } from './pages/Chair/SubmissionManagement';
import { AcceptInvitation } from './pages/Public/AcceptInvitation';
import { ConferenceList } from './pages/Public/ConferenceList';
import { AboutUs } from './pages/Public/AboutUs';
import InvitationDetail from './pages/Public/InvitationDetail';
import { useAuth, UserRole } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext'; // Added
import { NotificationToast } from './components/NotificationToast'; // Added

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
  | 'submission-management'
  | 'accept-invitation'
  | 'submission-management'
  | 'accept-invitation'
  | 'paper-detail'
  | 'conference-list'
  | 'about-us';

const App: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Helper function to navigate using ViewState (backwards compatibility)
  const handleNavigate = (view: ViewState) => {
    const routeMap: Record<ViewState, string> = {
      'home': '/',
      'login': '/login',
      'register': '/register',
      'forgot-password': '/forgot-password',
      'conference-details': '/conferences',
      'call-for-papers': '/call-for-papers',
      'program': '/program',
      'author-dashboard': '/author/dashboard',
      'submit-paper': '/author/submit',
      'paper-detail': '/author/papers',
      'reviewer-dashboard': '/reviewer/dashboard',
      'chair-dashboard': '/chair/dashboard',
      'create-conference': '/chair/create-conference',
      'cfp-management': '/chair/cfp',
      'pc-management': '/chair/pc',
      'pc-members': '/chair/pc-members',
      'submission-management': '/chair/submissions',
      'admin-dashboard': '/admin/dashboard',
      'admin-users': '/admin/users',
      'admin-config': '/admin/config',
      'admin-backup': '/admin/backup',
      'decision': '/decision',
      'profile': '/profile',
      'accept-invitation': '/invite/accept',
      'conference-list': '/conferences',
      'about-us': '/about'
    };
    navigate(routeMap[view] || '/');
  };

  // Hàm bảo vệ View: Chỉ render nếu đúng Role
  const renderProtected = (allowedRoles: UserRole[], component: React.ReactNode) => {
    if (isLoading) return <div className="flex h-screen items-center justify-center">Đang tải...</div>;
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    // Check if user has ANY of the allowed roles
    if (user && !user.roles.some(role => allowedRoles.includes(role))) {
      return <div className="p-10 text-center text-red-600 font-bold">Bạn không có quyền truy cập trang này!</div>;
    }
    
    return component;
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark transition-colors duration-200">
      <NotificationProvider> {/* Added Provider */}
        <Navbar onNavigate={handleNavigate} currentView="home" />
        <main className="flex flex-col grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home onNavigate={handleNavigate} />} />
            <Route path="/login" element={<Login onNavigate={handleNavigate} />} />
            <Route path="/register" element={<Register onNavigate={handleNavigate} />} />
            <Route path="/forgot-password" element={<ForgotPassword onNavigate={handleNavigate} />} />
            <Route path="/conferences" element={<ConferenceList onNavigate={handleNavigate} onSelectConference={() => { }} />} />
            <Route path="/conferences/:id" element={<ConferenceDetailsWrapper onNavigate={handleNavigate} />} />
            <Route path="/call-for-papers" element={<CallForPapers onNavigate={handleNavigate} />} />
            <Route path="/program" element={<Program />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/invite/accept" element={<AcceptInvitation />} />
            <Route path="/invitation/:token" element={<InvitationDetail />} />
            {/* Author Routes */}
            <Route path="/author/dashboard" element={renderProtected(['author', 'admin', 'chair', 'reviewer'],
              <AuthorDashboard
                onNavigate={handleNavigate}
                onViewPaper={(id) => navigate(`/author/papers/${id}`)}
                onEditPaper={(id) => navigate(`/author/submit/${id}`)}
                onViewDecision={(id) => navigate(`/author/decision/${id}`)}
              />
            )} />
            <Route path="/author/submit" element={renderProtected(['author', 'admin', 'chair', 'reviewer'],
              <SubmitPaper onNavigate={handleNavigate} editMode={false} />
            )} />
            <Route path="/author/submit/:id" element={renderProtected(['author', 'admin', 'chair', 'reviewer'],
              <SubmitPaperWrapper onNavigate={handleNavigate} />
            )} />
            <Route path="/author/papers/:id" element={renderProtected(['author', 'admin', 'chair', 'reviewer'],
              <PaperDetailWrapper onNavigate={handleNavigate} />
            )} />
            <Route path="/author/decision/:id" element={renderProtected(['author', 'admin', 'chair', 'reviewer'],
              <DecisionNotificationWrapper />
            )} />

            {/* Reviewer Routes */}
            <Route path="/reviewer/dashboard" element={renderProtected(['reviewer', 'admin', 'chair'],
              <ReviewerDashboard />
            )} />

            {/* Chair Routes */}
            <Route path="/chair/dashboard" element={renderProtected(['chair', 'admin'],
              <ChairDashboard
                onNavigate={handleNavigate}
                onSelectConference={() => { }}
                onManageConference={(id) => navigate(`/chair/cfp/${id}`)}
                onManagePC={(id) => navigate(`/chair/pc/${id}`)}
                onManageSubmissions={(id) => navigate(`/chair/submissions/${id}`)}
              />
            )} />
            <Route path="/chair/create-conference" element={renderProtected(['chair', 'admin'],
              <CreateConference onNavigate={handleNavigate} />
            )} />
            <Route path="/chair/cfp/:id" element={renderProtected(['chair', 'admin'],
              <CFPManagementWrapper onNavigate={handleNavigate} />
            )} />
            <Route path="/chair/pc/:id" element={renderProtected(['chair', 'admin'],
              <PCManagementWrapper onNavigate={handleNavigate} />
            )} />
            <Route path="/chair/submissions/:id" element={renderProtected(['chair', 'admin'],
              <SubmissionManagementWrapper onNavigate={handleNavigate} />
            )} />
            <Route path="/chair/pc-members" element={renderProtected(['chair', 'admin'],
              <PCMemberManagement />
            )} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={renderProtected(['admin'],
              <AdminDashboard onNavigate={handleNavigate} />
            )} />
            <Route path="/admin/users" element={renderProtected(['admin'],
              <UserManagement onNavigate={handleNavigate} />
            )} />
            <Route path="/admin/config" element={renderProtected(['admin'],
              <SystemConfig onNavigate={handleNavigate} />
            )} />
            <Route path="/admin/backup" element={renderProtected(['admin'],
              <DataBackup onNavigate={handleNavigate} />
            )} />

            {/* Profile */}
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Login onNavigate={handleNavigate} />} />
          </Routes>
        </main>
        <NotificationToast /> {/* Added Toast */}
        <Footer onNavigate={handleNavigate} />
      </NotificationProvider>
    </div>
  );
};

// Wrapper components to extract params
const ConferenceDetailsWrapper: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  return <ConferenceDetails conferenceId={id} onNavigate={onNavigate} />;
};

const PaperDetailWrapper: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  return <PaperDetail paperId={id || null} onNavigate={onNavigate} />;
};

const SubmitPaperWrapper: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  return <SubmitPaper onNavigate={onNavigate} editMode={true} submissionId={id} />;
};

const CFPManagementWrapper: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  return <CFPManagement onNavigate={onNavigate} conferenceId={id} />;
};

const PCManagementWrapper: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  return <PCManagement onNavigate={onNavigate} conferenceId={id} />;
};

const SubmissionManagementWrapper: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  return <SubmissionManagement onNavigate={onNavigate} conferenceId={id} />;
};

const DecisionNotificationWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <DecisionNotification paperId={id || null} />;
};

export default App;