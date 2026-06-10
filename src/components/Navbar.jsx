import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  MapPin, Sun, Moon, MessageSquare, Compass,
  ChevronDown, Crosshair, MapPinned, Search, Loader2, PlusCircle, Wallet, Home
} from 'lucide-react';
import ProfileDropdown from './ui/ProfileDropdown';
import Logo from './Logo';
import { updateLocalClientLocation } from '../actions/clientSlice';
import { fetchNearbyJobs } from '../actions/freelancerSlice';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const freelancerRadius = useSelector((state) => state.freelancer?.radar?.radiusKm) || 15;

  const { theme, toggleTheme } = useTheme();
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [activeCity, setActiveCity] = useState('Bhopal, MP');
  const [locLoading, setLocLoading] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [manualCityInput, setManualCityInput] = useState('');

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsLocationMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dispatchLocationUpdate = (lat, lng, cityName) => {
    setActiveCity(cityName);
    dispatch(updateLocalClientLocation({ lat, lng, city: cityName }));
    if (user?.role?.toLowerCase() === 'freelancer') {
      dispatch(fetchNearbyJobs({ lat, lng, radiusKm: freelancerRadius }));
    }
    setIsLocationMenuOpen(false);
  };

  const handleAutoLocationFetch = () => {
    if (!('geolocation' in navigator)) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          dispatchLocationUpdate(latitude, longitude, data.city || data.locality || 'Bhopal, MP');
        } catch {
          dispatchLocationUpdate(latitude, longitude, 'Bhopal, MP');
        } finally {
          setLocLoading(false);
        }
      },
      () => { setLocLoading(false); dispatchLocationUpdate(23.2599, 77.4126, 'Bhopal, MP'); }
    );
  };

  const handlePincodeSubmit = async (e) => {
    e.preventDefault();
    if (pincodeInput.length !== 6) return;
    setLocLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincodeInput}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success') {
        const po = data[0].PostOffice[0];
        dispatchLocationUpdate(23.2599, 77.4126, `${po.Name}, ${po.District}`);
        setPincodeInput('');
      }
    } catch (err) { console.error(err); }
    finally { setLocLoading(false); }
  };

  const handleManualSearchSubmit = (e) => {
    e.preventDefault();
    if (!manualCityInput.trim()) return;
    dispatchLocationUpdate(23.2599, 77.4126, manualCityInput.trim());
    setManualCityInput('');
  };

  const isDashboard = location.pathname === '/client/dashboard' || location.pathname === '/freelancer/dashboard';

  return (
    <nav className="sticky top-0 z-50 w-full bg-background border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* LEFT: Logo + Location */}
        <div className="flex items-center gap-4" ref={dropdownRef}>
          <div className="flex items-center cursor-pointer select-none" onClick={() => navigate('/')}>
            <Logo />
          </div>

          <div className="relative">
            <button onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
              className="flex items-center gap-2 bg-accent/40 hover:bg-accent border border-border px-4 py-2.5 rounded-xl text-sm transition-all">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-muted-foreground hidden md:inline">Radar:</span>
              <strong className="text-foreground font-semibold max-w-[140px] truncate">{activeCity}</strong>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isLocationMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLocationMenuOpen && (
              <div className="absolute left-0 mt-2.5 w-80 bg-card border border-border rounded-2xl shadow-2xl p-4 z-50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Set Location</p>

                <button onClick={handleAutoLocationFetch} disabled={locLoading}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-3 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium text-primary transition-all mb-4 group">
                  <div className="flex items-center gap-2.5">
                    {locLoading ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} className="group-hover:rotate-90 transition-transform" />}
                    <span>Use Current GPS</span>
                  </div>
                  <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary uppercase font-bold">GPS</span>
                </button>

                <form onSubmit={handlePincodeSubmit} className="mb-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Pincode</label>
                  <div className="flex bg-accent/40 border border-border rounded-xl px-3 py-2 items-center focus-within:border-primary/40 transition-all">
                    <MapPinned size={15} className="text-muted-foreground mr-2" />
                    <input type="text" maxLength="6" placeholder="e.g. 462001"
                      value={pincodeInput} onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                      className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground font-medium" />
                    {pincodeInput.length === 6 && (
                      <button type="submit" className="text-xs text-primary font-bold hover:underline">Apply</button>
                    )}
                  </div>
                </form>

                <form onSubmit={handleManualSearchSubmit}>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">City / Region</label>
                  <div className="flex bg-accent/40 border border-border rounded-xl px-3 py-2 items-center focus-within:border-primary/40 transition-all">
                    <Search size={15} className="text-muted-foreground mr-2" />
                    <input type="text" placeholder="e.g. MP Nagar, Bhopal"
                      value={manualCityInput} onChange={(e) => setManualCityInput(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground font-medium" />
                    {manualCityInput.trim() && (
                      <button type="submit" className="text-xs text-primary font-bold hover:underline">Go</button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: Nav Links */}
        <div className="flex items-center gap-1 bg-accent/20 p-1 border border-border rounded-xl">
          {user && !isDashboard && (
            <NavLink to={user.role?.toLowerCase() === 'client' ? '/client/dashboard' : '/freelancer/dashboard'} className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive ? 'bg-card text-foreground shadow-md border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
              <Home size={16} /><span>Home</span>
            </NavLink>
          )}
          <NavLink to="/discover" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive ? 'bg-card text-foreground shadow-md border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
            <Compass size={16} /><span>Discover</span>
          </NavLink>
          <NavLink to="/shared/messages" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive ? 'bg-card text-foreground shadow-md border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
            <MessageSquare size={16} /><span>Messages</span>
          </NavLink>
          {user?.role?.toLowerCase() === 'client' ? (
            <NavLink to="/client/post-job" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive ? 'bg-card text-foreground shadow-md border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
              <PlusCircle size={16} className="text-indigo-500" /><span>Post Job</span>
            </NavLink>
          ) : (
            <NavLink to="/freelancer/earnings" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive ? 'bg-card text-foreground shadow-md border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
              <Wallet size={16} className="text-emerald-500" /><span>Earnings</span>
            </NavLink>
          )}
        </div>

        {/* RIGHT: Theme + Profile */}
        <div className="flex items-center gap-3.5">
          <button onClick={toggleTheme}
            className="p-2.5 bg-accent/40 border border-border hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95">
            {theme === 'dark' ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-primary" />}
          </button>
          <div className="h-5 w-px bg-border"></div>
          {user ? (
            <ProfileDropdown />
          ) : (
            <NavLink
              to="/auth"
              className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary/10"
            >
              Log In
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;