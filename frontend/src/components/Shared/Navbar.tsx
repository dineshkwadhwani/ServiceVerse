import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/notificationStore';
import { LogOut, Bell, User, Settings } from 'lucide-react';
import { useState } from 'react';
import { COLORS } from '@/utils/theme';

interface NavbarProps {
  onSignInClick?: () => void;
  onProfileClick?: () => void;
}

export function Navbar({ onSignInClick, onProfileClick }: NavbarProps) {
  const navigate = useNavigate();
  const { user, firebaseUser, signOut } = useAuthStore();
  const toast = useToast();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <nav
      className="border-b sticky top-0 z-40"
      style={{
        backgroundColor: COLORS.bg.surface,
        borderColor: COLORS.border.light,
        boxShadow: COLORS.shadow.sm,
      }}
    >
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="text-xl md:text-2xl font-bold"
          style={{ color: COLORS.semantic.info }}
        >
          ServiceVerse
        </button>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Sign In (when not authenticated) */}
          {!firebaseUser && (
            <button
              onClick={onSignInClick}
              className="px-4 py-2 rounded-lg font-medium text-sm transition hover:opacity-80"
              style={{
                backgroundColor: COLORS.semantic.info,
                color: 'white',
              }}
            >
              Sign In
            </button>
          )}

          {/* Authenticated User Menu */}
          {firebaseUser && (
            <>
              {/* Notifications */}
              <button
                className="p-2 rounded-lg transition"
                style={{
                  color: COLORS.text.secondary,
                }}
              >
                <Bell className="w-5 h-5" />
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS.semantic.error }}
                />
              </button>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg transition"
                  style={{
                    color: COLORS.text.primary,
                  }}
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs" style={{ color: COLORS.text.secondary }}>
                      {user?.role || 'Member'}
                    </p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: COLORS.semantic.info }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </button>

                {/* Dropdown */}
                {showProfileMenu && (
                  <div
                    className="fixed right-4 w-48 rounded-lg border z-50"
                    style={{
                      backgroundColor: COLORS.bg.surface,
                      borderColor: COLORS.border.light,
                      boxShadow: COLORS.shadow.lg,
                      top: '64px',
                    }}
                  >
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onProfileClick?.();
                        }}
                        className="w-full text-left px-4 py-2 text-sm rounded flex items-center gap-2 transition hover:bg-opacity-50"
                        style={{
                          color: COLORS.text.primary,
                        }}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-sm rounded flex items-center gap-2 transition"
                        style={{
                          color: COLORS.text.primary,
                        }}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <hr style={{ borderColor: COLORS.border.light }} />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm rounded flex items-center gap-2 transition"
                        style={{
                          color: COLORS.semantic.error,
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
