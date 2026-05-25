import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userApi } from '../../services/userApi.js';
import img from '../assets/img.js'

const VerifyEmailPage = () => {
  const [codeDigits, setCodeDigits] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const codeInputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const code = codeDigits.join('');

  const email = location.state?.email;
  const [codeExpiresIn, setCodeExpiresIn] = useState(() => {
    const expiresAt = location.state?.expiresAt ? new Date(location.state.expiresAt).getTime() : null;
    if (expiresAt) return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    return Number(location.state?.expiresIn || 60);
  });

  // Code expiry timer. After 60s, user must request a fresh code.
  useEffect(() => {
    let interval;
    if (codeExpiresIn > 0) {
      interval = setInterval(() => {
        setCodeExpiresIn((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [codeExpiresIn]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setCodeDigits((prev) => {
      const nextDigits = [...prev];
      nextDigits[index] = digit;
      return nextDigits;
    });
    setError('');

    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      codeInputRefs.current[index - 1]?.focus();
    }

    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pastedCode = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedCode) return;

    setCodeDigits(Array.from({ length: 6 }, (_, index) => pastedCode[index] || ''));
    setError('');
    const nextFocusIndex = Math.min(pastedCode.length, 5);
    codeInputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    if (codeExpiresIn <= 0) {
      setError('Verification code expired after 60 seconds. Please request a new one.');
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
        setCodeDigits(Array(6).fill(''));
        codeInputRefs.current[0]?.focus();
        setCodeExpiresIn(Number(response.expiresIn || 60));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to resend code');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Sending the email took too long. Please check your connection and try again.');
      } else if (!err.response) {
        setError('Cannot reach the server right now. Please make sure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
      }
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
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img.shop})` }} />
        <div className="absolute inset-0 bg-slate-900/90" />
        <img src={img.line1} alt="lineTop" className="absolute top-20 w-full h-auto object-cover opacity-40 pointer-events-none" />
        <img src={img.line2} alt="lineRight" className="absolute xl:right-10 md:right-[-10px] top-0 h-full w-auto opacity-40 pointer-events-none origin-center" />
        <img src={img.line3} alt="lineBottom" className="absolute bottom-10 w-full h-auto object-cover opacity-40 pointer-events-none" />
        <img src={img.ruler} alt="ruler" className="absolute right-0 w-auto h-auto object-cover pointer-events-none" />

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
              <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleCodePaste}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    ref={(element) => { codeInputRefs.current[index] = element }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    value={codeDigits[index]}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    disabled={loading || codeExpiresIn <= 0}
                    maxLength={1}
                    aria-label={`Verification code digit ${index + 1}`}
                    className="aspect-square w-full rounded-xl border-2 border-gray-300 bg-white text-center text-2xl font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-slate-400 sm:text-3xl"
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {codeExpiresIn > 0
                  ? `Enter the 6-digit code from your email. Expires in ${codeExpiresIn}s.`
                  : 'Code expired. Please resend a new code.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6 || codeExpiresIn <= 0}
              className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-800/25 hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-slate-800/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Verifying...' : 'Verify Email'} →
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-4">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resendLoading || codeExpiresIn > 0}
              className="w-full py-2.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {codeExpiresIn > 0
                ? `Resend in ${codeExpiresIn}s`
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
