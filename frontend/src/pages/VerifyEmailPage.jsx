import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userApi } from '../../services/userApi.js';

const VerifyEmailPage = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;

  // Cooldown timer for resend button
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await userApi.verifyEmail({
        email,
        code,
      });

      if (response.success) {
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const response = await userApi.resendVerificationCode({ email });

      if (response.success) {
        setSuccess('Verification code sent! Check your email.');
        setResendCooldown(60);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to resend code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

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

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Left Panel */}
      <div className="hidden md:flex relative w-[60%] flex-col items-center justify-center overflow-hidden text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/src/assets/shop.png')` }} />
        <div className="absolute inset-0 bg-slate-900/90" />
        <img src="/src/assets/line1.svg" alt="lineTop" className="absolute top-20 w-full h-auto object-cover opacity-40 pointer-events-none" />
        <img src="/src/assets/line2.svg" alt="lineRight" className="absolute xl:right-10 md:right-[-10px] top-0 h-full w-auto opacity-40 pointer-events-none origin-center" />
        <img src="/src/assets/line3.svg" alt="lineBottom" className="absolute bottom-10 w-full h-auto object-cover opacity-40 pointer-events-none" />
        <img src="/src/assets/ruler.svg" alt="ruler" className="absolute right-0 w-auto h-auto object-cover pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <img src="/src/assets/jjs logo.png" alt="JJS Logo" className="w-44 h-44 rounded-full object-contain mb-6 drop-shadow-2xl" />
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
            <button
              onClick={() => navigate('/signup')}
              className="text-sm font-medium text-gray-400 hover:text-blue-800 transition-colors"
            >
              ← Back to Sign Up
            </button>
          </div>

          <h2 className="text-5xl sm:text-4xl xl:text-3xl font-bold text-slate-900 mb-2 font-playfair">Verify Email</h2>
          <p className="text-md xl:text-sm text-slate-400 mb-3">
            We sent a 6-digit code to <span className="font-semibold text-slate-600">{email}</span>
          </p>

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

          <form onSubmit={handleVerify}>
            <div className="mb-6">
              <label className="block text-xs md:text-md font-medium text-gray-600 mb-2">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                disabled={loading}
                maxLength="6"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-3xl font-mono font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
              <p className="text-xs text-gray-500 mt-2">Enter the 6-digit code from your email</p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-800/25 hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-slate-800/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Verifying...' : 'Verify Email'} →
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-4">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="w-full py-2.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {resendCooldown > 0 
                ? `Resend in ${resendCooldown}s` 
                : resendLoading 
                ? 'Sending...' 
                : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
