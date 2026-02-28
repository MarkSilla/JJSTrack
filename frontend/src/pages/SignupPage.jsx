import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase.js';
import { userApi } from '../../services/userApi.js';
import img from '../assets/img.js'

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    agreedToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmedPassword, setConfirmedPassword] = useState(false)
  const navigate = useNavigate();

  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.firstName &&
      formData.lastName &&
      formData.phone &&
      formData.address &&
      formData.agreedToTerms &&
      formData.password.length >= 8 &&
      formData.password === formData.confirmPassword
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName || !formData.address || !formData.phone) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.phone.length < 11) {
      setError('Phone number must be at least 11 digits');
      return false;
    }

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('Starting Firebase signup for:', formData.email);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      console.log('User created successfully:', user.uid);

      const signupData = {
        uid: user.uid,
        email: formData.email,
        fullName: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
      };

      try {
        const response = await userApi.register(signupData);
        if (response.success || user) {
          // Navigate to verification page with email
          navigate('/verify-email', { state: { email: formData.email } });
        } else {
          setError(response.message || 'Sign up failed');
        }
      } catch (backendErr) {
        console.warn('Backend registration warning:', backendErr);
        // Still navigate to verification even if backend has issues
        navigate('/verify-email', { state: { email: formData.email } });
      }
    } catch (err) {
      console.error('Signup error details:', {
        code: err.code,
        message: err.message,
        email: formData.email,
        fullError: err,
      });

      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use. Please try another email.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled. Please contact support.');
      } else {
        setError(err.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const response = await userApi.googleAuth({
        uid: user.uid,
        email: user.email,
        //leave ko muna to diko alam cchange HAHAHAH
        fullName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
      });

      if (response.success) {
        alert('Google signup successful!');
        navigate('/dashboard');
      } else {
        setError(response.message || 'Google signup failed');
      }
    } catch (err) {
      setError(err.message || 'Google signup failed. Please try again.');
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
          <img src={img.jjslogo1} alt="JJS Logo" className="w-50 h-44 rounded-full object-contain mb-6 drop-shadow-2xl" />
          <h1 className="text-4xl font-extrabold tracking-wide mb-2 font-playfair">JJS-Track</h1>
          <div className="w-16 border-b border-yellow-400 mb-5 mt-5"></div>
          <p className="text-sm font-thin opacity-70 tracking-wide">Where Every Stitch Reflects Quality and Craftsmanship.</p>
        </div>

        <span className="absolute bottom-6 z-10 text-xs opacity-40">© 2026 • DevMinds</span>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-4">
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
            <Link to="/login" className="pb-3 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-blue-800 transition-colors no-underline">Login</Link>
            <button className="pb-3 text-sm font-semibold text-blue-800 border-b-2 border-blue-800">Register</button>
          </div>

          <h2 className="text-5xl sm:text-4xl xl:text-3xl font-bold text-slate-900 mb-1 font-playfair">Create account</h2>
          <p className="text-md xl:text-sm text-slate-400 mb-7">Join JJS Track — create your account today.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-[3px] border-red-500 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup}>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs md:text-md font-medium text-gray-600 mb-1.5">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs md:text-md font-medium text-gray-600 mb-1.5">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                />
              </div>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className=" block text-sm md:text-md font-medium text-gray-600 mb-1.5 ">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Phone number"
                  disabled={loading}
                  maxLength={11}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, '');
                  }}
                  className="w-[140px] px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                />
              </div>
              <div className="flex-1">
                <label className=" block text-sm md:text-md font-medium text-gray-600 mb-1.5">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Address"
                  disabled={loading}
                  className="w-[270px] px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                />
              </div>
            </div>


            <div className="mb-4">
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

            <div className="mb-4">
              <label className="block text-xs md:text-md font-medium text-gray-600 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password (min 6 characters)"
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
              <div className="relative">
                <label className="block text-xs md:text-md font-medium text-gray-600 mb-1.5">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password (min 8 characters)"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 bottom-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs md:text-md font-medium text-gray-600 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmedPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                />
                <button
                  type="button"
                  onClick={() => setConfirmedPassword(!showConfirmedPassword)}
                  className="absolute right-3 bottom-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showConfirmedPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex mb-6 mt-6 justify-center ">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600">By using this app, you agree to our <span className="underline hover:text-blue-600 transition-colors cursor-pointer">Privacy Policy</span> and <span className="underline hover:text-blue-600 transition-colors cursor-pointer">Terms of Use</span>.</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-800/25 hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-slate-800/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Creating Account...' : 'Sign Up'} →
            </button>
          </form>


          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">Or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-2.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-600 flex items-center justify-center gap-2.5 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
          >
            <img src={img.google} alt="Google" className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-600">Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;