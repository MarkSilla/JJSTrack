import React, { useState, useEffect, useContext } from 'react';
import { Eye, EyeOff, AlertCircle, X, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { toast } from 'sonner';
import { auth, googleProvider } from '../../config/firebase.js';
import { userApi } from '../../services/userApi.js';
import img from '../assets/img.js';
import GoogleProfileModal from '../components/GoogleProfileModal.jsx';
import { AuthContext } from '../context/Context.jsx';
import { AuthLoadingScreen } from '../components/AuthLoadingScreen.jsx';

// Smooth Alert Component with CSS Grid height animation & fade-in/out transitions
const SmoothAlert = ({ show, onClose, type = 'error', title, children }) => {
  const [shouldRender, setShouldRender] = useState(show)
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      const rAF = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimated(true))
      })
      return () => cancelAnimationFrame(rAF)
    } else {
      setIsAnimated(false)
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!shouldRender) return null

  const colorStyles = {
    error: 'border-red-200/90 bg-red-50/90 text-red-700',
    success: 'border-green-200/90 bg-green-50/90 text-green-700',
    amber: 'border-amber-200/90 bg-amber-50/90 text-amber-700',
  }

  const iconColors = {
    error: 'text-red-500',
    success: 'text-green-500',
    amber: 'text-amber-500',
  }

  const IconComponent =
    type === 'success' ? CheckCircle : type === 'amber' ? AlertTriangle : AlertCircle

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`grid transition-all duration-300 ease-out ${
        isAnimated ? 'grid-rows-[1fr] opacity-100 mb-5' : 'grid-rows-[0fr] opacity-0 mb-0 pointer-events-none'
      }`}
    >
      <div className="overflow-hidden">
        <div
          className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm shadow-sm transition-all duration-300 ${
            colorStyles[type] || colorStyles.error
          } ${isAnimated ? 'translate-y-0 scale-100' : '-translate-y-1 scale-[0.98]'}`}
        >
          <IconComponent size={18} className={`mt-0.5 shrink-0 ${iconColors[type]}`} />
          <div className="flex-1 min-w-0">
            {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
            <div className="font-medium text-xs sm:text-sm leading-relaxed">{children}</div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss message"
              className="shrink-0 p-0.5 opacity-70 hover:opacity-100 transition-opacity rounded-md"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionReplaced, setSessionReplaced] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showAuthLoader, setShowAuthLoader] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const handleTabSwitch = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 260);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1') {
      setSessionExpired(true);
      window.history.replaceState({}, '', '/login');
    } else if (params.get('session_replaced') === '1') {
      setSessionReplaced(true);
      window.history.replaceState({}, '', '/login');
    } else if (params.get('logged_out') === '1') {
      setLoggedOut(true);
      window.history.replaceState({}, '', '/login');
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await userApi.login(formData);

      if (response.success && response.token) {
        login(response.user, response.token, formData.remember);
        toast.success('Login successful!');
        setShowAuthLoader(true);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const response = await userApi.googleAuth({
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
      });

      if (response.success && response.token) {
        login(response.user, response.token);
        setShowAuthLoader(true);
      } else {
        setError(response.message || 'Google login failed');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSuccess = () => {
    toast.success('Profile completed successfully!');
    setShowAuthLoader(true);
  };

  return (
    <div className="flex min-h-screen">
      <style>{`
        @keyframes tabEnter {
          0% {
            opacity: 0;
            transform: translate3d(0, 14px, 0) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        
        .animate-tab-enter {
          animation: tabEnter 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Left Panel - Fixed h-screen & sticky to prevent logo shifting */}
      <div className="hidden md:flex sticky top-0 h-screen w-[60%] shrink-0 flex-col items-center justify-center overflow-hidden text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img.front})` }} />
        <div className="absolute inset-0 bg-slate-900/90" />
        <img src={img.line1} alt="lineTop" className="absolute top-20 w-full h-auto object-cover opacity-40 pointer-events-none " />
        <img src={img.line2} alt="lineRight" className="absolute xl:right-10 md:right-[-10px]  top-0 h-full w-auto opacity-40 pointer-events-none origin-center" />
        <img src={img.line3} alt="lineBottom" className="absolute bottom-10 w-full h-auto object-cover opacity-40 pointer-events-none " />
        <img src={img.ruler} alt="ruler" className="absolute right-0 w-auto h-auto object-cover pointer-events-none " />
        <Link to="/" className="absolute top-6 left-6 z-10  items-center gap-1.5 px-4 py-2 rounded-lg border border-white/25 bg-white/10 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 hover:border-white/40 transition-all no-underline">
          ← Back
        </Link>

        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <img src={img.jjslogo1} alt="JJS Logo" className="w-50 h-44 rounded-full object-contain mb-6  drop-shadow-2xl" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">JJS-Track</h1>
          <div className="w-16 border-b border-yellow-400 mb-5 mt-5"></div>
          <p className="text-sm text-thin font-thin opacity-70 tracking-wide ">Where Every Stitch Reflects Quality and Craftsmanship.</p>
        </div>

        <span className="absolute bottom-6 z-10 text-xs opacity-40">© 2026 • DevMinds</span>
      </div>


      {/* Right Panel - Scrollable container */}
      <div className="relative flex-1 flex flex-col justify-center items-center bg-white px-6 py-12 min-h-screen overflow-y-auto">
        <div className={`w-full max-w-[420px] my-auto transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${
          isExiting ? 'opacity-0 translate-y-3 scale-[0.985] pointer-events-none' : 'animate-tab-enter'
        }`}>
          <div className="mb-6 md:hidden">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Back to landing page"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:ring-offset-1 transition-all duration-200"
            >
              <ArrowLeft size={16} className="text-slate-500 shrink-0" />
              <span>Back to Landing</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-16 border-b border-gray-200 mb-8 relative">
            <button type="button" className="pb-3 text-sm font-semibold text-blue-800 border-b-2 border-blue-800 transition-all duration-200">Login</button>
            <button
              type="button"
              onClick={() => handleTabSwitch('/signup')}
              className="pb-3 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-blue-800 transition-all duration-200 cursor-pointer"
            >
              Register
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1.5">Welcome back</h2>
          <p className="text-xs lg:text-sm text-slate-500 mb-6">Access your account to manage your appointment schedule.</p>

          {/* Smooth Alert Notifications */}
          <SmoothAlert show={loggedOut} onClose={() => setLoggedOut(false)} type="success" title="Logged out successfully">
            You have been signed out. Sign in again to continue.
          </SmoothAlert>

          <SmoothAlert show={sessionExpired} onClose={() => setSessionExpired(false)} type="amber" title="Session Expired">
            Your session has expired due to inactivity. Please sign in again to continue.
          </SmoothAlert>

          <SmoothAlert show={sessionReplaced} onClose={() => setSessionReplaced(false)} type="amber" title="Signed out from this device">
            This account was signed in on another device. Please sign in again to continue here.
          </SmoothAlert>

          <SmoothAlert show={Boolean(error)} onClose={() => setError('')} type="error">
            {error}
          </SmoothAlert>

          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline no-underline">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-800/25 hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-slate-800/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'} →
            </button>
          </form>
          {/*  
          <div>
            <div className=" flex flex-col  mt-3 flex justify-between items-center text-gray text-xs">
              <ul className="flex space-x-6">
                <li><a href="#" className="text-slate-500 hover:text-blue-400">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-400">Terms of Use</a></li>
              </ul>
            </div>
          </div>
          */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">Or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-600 flex items-center justify-center gap-2.5 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
          >
            <img src={img.google} alt="Google" className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-600">Continue with Google</span>
          </button>
        </div>
      </div>

      {/* Google Profile Completion Modal */}
      <GoogleProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSuccess={handleProfileSuccess}
      />

      {showAuthLoader && (
        <AuthLoadingScreen onComplete={() => navigate('/home', { replace: true })} />
      )}
    </div>
  );
};

export default LoginPage;
