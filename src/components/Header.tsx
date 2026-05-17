import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Home, User, LogOut, Settings } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'agent':
        return 'Agent';
      case 'public':
        return 'Buyer';
      case 'vendor':
        return 'Seller';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };

  const handleHomeClick = () => {
    if (user?.role === 'agent') {
      navigate('/agent-dashboard');
    } else if (user?.role === 'vendor') {
      navigate('/vendor/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      <div className="max-w-full px-4 py-3 md:px-6 flex items-center justify-between h-16">
        {/* Left: Logo/Home */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleHomeClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-white hidden sm:inline">VALORY</span>
          </button>
        </div>

        {/* Right: Role + Profile */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* Role badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700">
              <span className="text-xs font-medium text-slate-300">
                {getRoleLabel(user.role)}
              </span>
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600">
                  <Avatar className="h-8 w-8 border border-slate-700">
                    <AvatarFallback className="bg-amber-600/20 text-amber-500 font-semibold text-xs">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-slate-200 truncate max-w-[120px]">
                    {user.name || 'Profile'}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-700">
                {/* User info */}
                <div className="px-3 py-2 border-b border-slate-700">
                  <p className="text-sm font-medium text-slate-100">{user.name}</p>
                  <p className="text-xs text-slate-400">{getRoleLabel(user.role)}</p>
                </div>

                {/* Role-specific items */}
                {user.role === 'agent' && (
                  <>
                    <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Agent Profile</span>
                    </DropdownMenuItem>
                  </>
                )}

                {user.role === 'public' && (
                  <>
                    <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                  </>
                )}

                {user.role === 'vendor' && (
                  <>
                    <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Seller Profile</span>
                    </DropdownMenuItem>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-slate-700" />

                {/* Logout */}
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button
            onClick={() => navigate('/')}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700"
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
