import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userApi } from '../../services/userApi.js';
import img from '../assets/img.js'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await userApi.forgotPassword({ email });

      if (response.success) {
        setSuccess('Reset code sent! Check your email for the 6-digit code.');
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 2000);
      } else {
        setError(response.message || 'Failed to send reset code');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Email address not found');
      } else {
        setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <style>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-in {
          animation: slideInFromRight 0.4s ease-out;
        }
      `}</style>

      {/* Left Panel */}
      <div className="hidden md:flex relative w-[60%] flex-col items-center justify-center overflow-hidden text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img.shop})` }} />
        <div className="absolute inset-0 bg-slate-900/90" />
        <img src={img.line1} alt="lineTop" className="absolute top-20 w-full h-auto object-cover opacity-40 pointer-events-none" />
        <img src={img.line2} alt="lineRight" className="absolute xl:right-10 md:right-[-10px] top-0 h-full w-auto opacity-40 pointer-events-none origin-center" />
        <img src={img.line3} alt="lineBottom" className="absolute bottom-10 w-full h-auto object-cover opacity-40 pointer-events-none" />
        <img src={img.ruler} alt="ruler" className="absolute right-0 w-auto h-auto object-cover pointer-events-none" />

        <Link to="/" className="absolute top-6 left-6 z-10 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/25 bg-white/10 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 hover:border-white/40 transition-all no-underline">
          ← Back
        </Link>

        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <img src={img.jjsLogo} alt="JJS Logo" className="w-44 h-44 rounded-full object-contain mb-6 drop-shadow-2xl" />
          <h1 className="text-4xl font-extrabold tracking-wide mb-2 font-playfair">JJS-Track</h1>
          <div className="w-16 border-b border-yellow-400 mb-5 mt-5"></div>
          <p className="text-sm font-thin opacity-70 tracking-wide">Where Every Stitch Reflects Quality and Craftsmanship.</p>
        </div>

        <span className="absolute bottom-6 z-10 text-xs opacity-40">© 2026 • DevMinds</span>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[420px] animate-slide-in">
          <div className="mb-8">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-400 hover:text-blue-800 transition-colors no-underline"
            >
              ← Back to Login
            </Link>
          </div>

          <h2 className="text-5xl sm:text-4xl xl:text-3xl font-bold text-slate-900 mb-2 font-playfair">Reset Password</h2>
          <p className="text-md xl:text-sm text-slate-400 mb-7">Enter your email to receive a password reset code</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-[3px] border-red-500 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border-l-[3px] border-green-500 text-green-600 rounded-md text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-xs md:text-md font-medium text-gray-600 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={handleChange}
                placeholder="Enter your registered email"
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-800/25 hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-slate-800/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Sending...' : 'Send Reset Code'} →
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-blue-600 font-semibold hover:text-blue-800 transition-colors no-underline"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
