import React, { useState } from 'react';
import { useAuth, type UserRole } from '../contexts/AuthContext';

const RoleSwitcher: React.FC = () => {
  const { user, switchRole, hasRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleSwitch = async (conferenceId: string, roleName: UserRole) => {
    try {
      setIsSwitching(true);
      await switchRole(conferenceId, roleName);
      setIsOpen(false);
      // Optionally refresh the page or navigate
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch role:', error);
      alert('Failed to switch role. Please try again.');
    } finally {
      setIsSwitching(false);
    }
  };

  if (!user || !user.availableContexts || user.availableContexts.length <= 1) {
    return null; // Don't show switcher if user has only one role
  }

  const getRoleColor = (roleName: UserRole) => {
    switch (roleName) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'chair':
        return 'bg-purple-100 text-purple-800';
      case 'reviewer':
        return 'bg-blue-100 text-blue-800';
      case 'author':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (roleName: UserRole) => {
    switch (roleName) {
      case 'admin':
        return '👑';
      case 'chair':
        return '🎯';
      case 'reviewer':
        return '📝';
      case 'author':
        return '✍️';
      default:
        return '👤';
    }
  };

  return (
    <div className="relative">
      {/* Current Role Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${getRoleColor(
          user.activeRole?.roleName || 'author'
        )} hover:opacity-80`}
      >
        <span className="text-xl">{getRoleIcon(user.activeRole?.roleName || 'author')}</span>
        <div className="text-left">
          <div className="font-semibold text-sm">
            {user.activeRole?.roleDisplayName || 'Author'}
          </div>
          {user.activeRole?.conferenceName && (
            <div className="text-xs opacity-75">
              {user.activeRole.conferenceName}
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Switch Role</h3>
            <p className="text-xs text-gray-500 mt-1">
              Select a different role and conference
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {user.availableContexts?.map((context) => {
              const isActive =
                context.conferenceId === user.activeRole?.conferenceId &&
                context.roleName === user.activeRole?.roleName;

              return (
                <button
                  key={`${context.conferenceId}-${context.roleName}`}
                  onClick={() => {
                    if (!isActive && context.conferenceId) {
                      handleRoleSwitch(context.conferenceId, context.roleName);
                    }
                  }}
                  disabled={isActive || isSwitching}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    isActive ? 'bg-blue-50' : ''
                  } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getRoleIcon(context.roleName)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getRoleColor(
                            context.roleName
                          )}`}
                        >
                          {context.roleDisplayName}
                        </span>
                        {isActive && (
                          <span className="text-xs text-blue-600 font-medium">✓ Active</span>
                        )}
                      </div>
                      {context.conferenceName && (
                        <div className="mt-1">
                          <div className="text-sm font-medium text-gray-900">
                            {context.conferenceName}
                          </div>
                          {context.conferenceCode && (
                            <div className="text-xs text-gray-500">
                              Code: {context.conferenceCode}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {isSwitching && (
            <div className="p-3 text-center text-sm text-gray-600 border-t border-gray-200">
              Switching role...
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default RoleSwitcher;
