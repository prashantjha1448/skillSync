import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Wallet, Settings, LogOut, 
  ChevronDown, User, Sparkles
} from 'lucide-react';
import { logout } from '../../actions/authSlice';

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const menuRef = useRef(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Smooth outside bound handler for automated window closure
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNavigation = (targetPath) => {
    navigate(targetPath);
    setIsOpen(false);
  };

  const handleLogoutAction = () => {
    dispatch(logout());
    navigate('/auth');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      
      {/* TRIGGER AVATAR BUTTON: Glassmorphic Floating Style */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 p-1.5 pl-2 rounded-xl border transition-all duration-300 select-none active:scale-95 group focus:outline-none ${
          isOpen 
            ? 'bg-accent/80 border-primary/40 shadow-md ring-2 ring-primary/10' 
            : 'bg-accent/20 hover:bg-accent/50 border-border/60'
        }`}
      >
        <div className="relative">
          <img 
            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=prashant"} 
            alt="User Session Trigger" 
            className="w-7 h-7 rounded-lg bg-primary/10 object-cover ring-1 ring-border group-hover:scale-105 transition-transform duration-200"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-background"></span>
        </div>
        
        <span className="hidden sm:block text-xs font-medium text-foreground/90 tracking-wide group-hover:text-foreground transition-colors max-w-[100px] truncate">
          {user?.name || 'Prashant Jha'}
        </span>
        
        <ChevronDown 
          size={14} 
          className={`text-muted-foreground/80 group-hover:text-foreground transition-transform duration-300 ease-out mr-1 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`} 
        />
      </button>

      {/* FLOATING DROPDOWN MENU CARD */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] p-2 z-50 origin-top-right transform transition-all animate-in fade-in zoom-in-95 duration-200 ease-out">
          
          {/* SECTION 1: Dynamic Identity Profile Card (Username + Unique ID Integration) */}
          <div className="px-3.5 py-3 bg-gradient-to-br from-accent/40 to-accent/10 border border-border/40 rounded-xl mb-2 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-300"></div>
            
            {/* Unique Dynamic Username Output Line */}
            <p className="text-[11px] font-bold text-primary dark:text-primary-foreground/90 tracking-wide flex items-center gap-1">
              <Sparkles size={11} className="text-primary fill-current animate-pulse" /> 
              @{user?.username || 'prashant_jha'}
            </p>
            
            {/* Real Full Name display field */}
            <p className="text-sm font-bold text-foreground truncate mt-1 tracking-tight">
              {user?.name || 'Prashant Jha'}
            </p>

            
            {/* Dynamic Role Operational Badge */}
            <span className={`inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase mt-2 tracking-wider border ${
              user?.role === 'client' 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {user?.role || 'Freelancer Mode'}
            </span>
          </div>

          {/* SECTION 2: Architecture Navigation Elements */}
          <div className="space-y-0.5">
            <button 
              onClick={() => handleNavigation(user?.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 text-left font-medium group"
            >
              <LayoutDashboard size={15} className="text-muted-foreground group-hover:text-primary transition-colors" /> 
              <span className="flex-1">{user?.role === 'client' ? 'Client Workspace' : 'Freelancer Dashboard'}</span>
              <span className="text-[9px] bg-accent group-hover:bg-background px-1.5 py-0.5 rounded text-muted-foreground/70 transition-colors">⌘D</span>
            </button>

            {user?.role !== 'client' && (
              <button 
                onClick={() => handleNavigation('/freelancer/earnings')}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 text-left font-medium group"
              >
                <Wallet size={15} className="text-muted-foreground group-hover:text-emerald-500 transition-colors" /> 
                <span>Financial Ledger & Wallet</span>
              </button>
            )}

            <button 
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 text-left font-medium group"
            >
              <User size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" /> 
              <span>Account Profile Shell</span>
            </button>

            <button 
              onClick={() => handleNavigation('/shared/settings')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 text-left font-medium group"
            >
              <Settings size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" /> 
              <span>System Settings</span>
            </button>
          </div>

          {/* Structural Break Line Divider */}
          <div className="h-px bg-border/60 my-1.5 mx-1"></div>

          {/* SECTION 3: System Destructive Action Block */}
          <button 
            onClick={handleLogoutAction}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-red-500/90 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-150 text-left font-semibold group"
          >
            <LogOut size={15} className="text-red-500/70 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" /> 
            <span>Terminate Active Session</span>
          </button>

        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;