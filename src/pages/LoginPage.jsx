import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase.js';
import { userApi } from '../../services/userApi.js';
import google1 from '../assets/google.svg';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

      if (response.success) {
        alert('Login successful!');
        navigate('/home');
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

      if (response.success) {
        alert('Google login successful!');
        navigate('/home');
      } else {
        setError(response.message || 'Google login failed');
      }
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <style>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-in {
          animation: slideInFromLeft 0.4s ease-out;
        }
      `}</style>

      {/* Left Panel */}
      <div className="hidden md:flex relative w-[60%] flex-col items-center justify-center overflow-hidden text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/src/assets/shop.png')` }} />
        <div className="absolute inset-0 bg-slate-900/90" />
        <img src="/src/assets/line1.svg" alt="lineTop" className="absolute top-20 w-full h-auto object-cover opacity-40 pointer-events-none " />
        <img src="/src/assets/line2.svg" alt="lineRight" className="absolute xl:right-10 md:right-[-10px]  top-0 h-full w-auto opacity-40 pointer-events-none origin-center" />
        <img src="/src/assets/line3.svg" alt="lineBottom" className="absolute bottom-10 w-full h-auto object-cover opacity-40 pointer-events-none " />
        <img src="/src/assets/ruler.svg" alt="ruler" className="absolute right-0 w-auto h-auto object-cover pointer-events-none " />
        <Link to="/" className="absolute top-6 left-6 z-10  items-center gap-1.5 px-4 py-2 rounded-lg border border-white/25 bg-white/10 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 hover:border-white/40 transition-all no-underline">
          ← Back
        </Link>

        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <img src="/src/assets/jjslogo1.png" alt="JJS Logo" className="w-50 h-44 rounded-full object-contain mb-6  drop-shadow-2xl" />
          <h1 className="text-4xl font-extrabold tracking-wide mb-2 font-playfair">JJS-Track</h1>
          <div className="w-16 border-b border-yellow-400 mb-5 mt-5"></div>
          <p className="text-sm text-thin font-thin opacity-70 tracking-wide ">Where Every Stitch Reflects Quality and Craftsmanship.</p>
        </div>

        <span className="absolute bottom-6 z-10 text-xs opacity-40">© 2026 • DevMinds</span>
      </div>


      {/* Right Panel */}
      <div className="relative  flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[420px] animate-slide-in">
          <div className="mb-8 xl:hidden md:hidden ">
            <button
              onClick={() => navigate('/')}
              className="text-sm font-medium text-gray-400 hover:text-blue-800 transition-colors"
            >
              ← Back to Landing
            </button>
          </div>
          <div className="flex justify-center gap-16 border-b border-gray-200 mb-8 relative">
            <button className="pb-3 text-sm font-semibold text-blue-800 border-b-2 border-blue-800">Login</button>
            <Link to="/signup" className="pb-3 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-blue-800 transition-colors no-underline">Register</Link>
          </div>

          <h2 className="text-5xl sm:text-4xl xl:text-3xl font-bold text-slate-900 mb-1 font-playfair">Welcome back</h2>
          <p className="text-md xl:text-sm text-slate-400 mb-7">Access your account to manage your appointment schedule.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-[3px] border-red-500 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="block text-xs md:text-md font-medium text-gray-600 mb-1.5">Email Address</label>
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
              <label className="block text-xs md:text-md font-medium text-gray-600 mb-1.5">Password</label>
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
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
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
            <img src={google1} alt="Google" className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-600">Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;