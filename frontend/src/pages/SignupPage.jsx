import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { toast } from 'sonner';
import { auth, googleProvider } from '../../config/firebase.js';
import { userApi } from '../../services/userApi.js';
import img from '../assets/img.js';
import { regions, provinces, cities, barangays } from 'select-philippines-address';

const TOTAL_STEPS = 2;
const NAME_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s]+$/;

const SignupPage = () => {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    regionCode: '',
    regionName: '',
    provinceCode: '',
    provinceName: '',
    cityCode: '',
    cityName: '',
    brgyCode: '',
    brgyName: '',
    zipCode: '',
    agreedToTerms: false,
  });

  const [regionList, setRegionList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [brgyList, setBrgyList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameErrors, setNameErrors] = useState({ firstName: '', lastName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmedPassword, setConfirmedPassword] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState(null);

  const navigate = useNavigate();
  useEffect(() => {
    regions().then(res => setRegionList(res || []));
  }, []);

  const handleRegionChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData(prev => ({
      ...prev,
      regionCode: code,
      regionName: code ? name : '',
      provinceCode: '',
      provinceName: '',
      cityCode: '',
      cityName: '',
      brgyCode: '',
      brgyName: '',
      zipCode: ''
    }));
    if (code) provinces(code).then(res => setProvinceList(res || []));
    else setProvinceList([]);
    setCityList([]);
    setBrgyList([]);
    setError('');
  };

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData(prev => ({
      ...prev,
      provinceCode: code,
      provinceName: code ? name : '',
      cityCode: '',
      cityName: '',
      brgyCode: '',
      brgyName: ''
    }));
    if (code) cities(code).then(res => setCityList(res || []));
    else setCityList([]);
    setBrgyList([]);
    setError('');
  };

  const handleCityChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData(prev => ({
      ...prev,
      cityCode: code,
      cityName: code ? name : '',
      brgyCode: '',
      brgyName: ''
    }));
    if (code) barangays(code).then(res => setBrgyList(res || []));
    else setBrgyList([]);
    setError('');
  };

  const handleBarangayChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData(prev => ({
      ...prev,
      brgyCode: code,
      brgyName: code ? name : ''
    }));
    setError('');
  };

  const legalDocuments = {
    privacy: { title: 'Privacy Policy', href: '/privacy-policy' },
    terms: { title: 'Terms of Use', href: '/terms-of-use' },
  };
  const openLegalModal = (docKey) => setActiveLegalDoc(docKey);
  const closeLegalModal = () => setActiveLegalDoc(null);
  const selectedDocument = activeLegalDoc ? legalDocuments[activeLegalDoc] : null;

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') closeLegalModal(); };
    if (activeLegalDoc) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [activeLegalDoc]);

  // Validation
  const isStep1Valid = () =>
    formData.firstName &&
    NAME_REGEX.test(formData.firstName) &&
    formData.lastName &&
    NAME_REGEX.test(formData.lastName) &&
    /^09\d{9}$/.test(formData.phone) &&
    formData.email &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword;

  const isStep2Valid = () =>
    formData.street &&
    formData.regionCode &&
    formData.provinceCode &&
    formData.cityCode &&
    formData.brgyCode &&
    formData.zipCode &&
    formData.agreedToTerms;

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'firstName' || name === 'lastName') {
      const cleaned = value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s]/g, '');
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      setNameErrors((prev) => ({
        ...prev,
        [name]: value !== cleaned ? 'Letters only' : '',
      }));
      setError('');
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.firstName || !NAME_REGEX.test(formData.firstName)) {
      setError('First name must contain letters only');
      return;
    }
    if (!formData.lastName || !NAME_REGEX.test(formData.lastName)) {
      setError('Last name must contain letters only');
      return;
    }
    if (!/^09\d{9}$/.test(formData.phone)) {
      setError('Phone number must be an 11-digit PH mobile number starting with 09');
      return;
    }
    if (!isStep1Valid()) { setError('Please fill in all fields correctly.'); return; }
    setError('');
    setStep(2);
  };

  const handleBack = () => { setError(''); setStep(1); };

  const buildFullAddress = () => {
    const parts = [
      formData.street,
      formData.brgyName,
      formData.cityName,
      formData.provinceName,
      formData.regionName,
      formData.zipCode ? `${formData.zipCode}, Philippines` : 'Philippines'
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isStep2Valid()) { setError('Please fill in all address fields.'); return; }

    setLoading(true);
    try {
      const response = await userApi.register({
        email: formData.email,
        password: formData.password,
        fullName: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: buildFullAddress(),
        street: formData.street,
        regionCode: formData.regionCode,
        regionName: formData.regionName,
        provinceCode: formData.provinceCode,
        provinceName: formData.provinceName,
        cityCode: formData.cityCode,
        cityName: formData.cityName,
        brgyCode: formData.brgyCode,
        brgyName: formData.brgyName,
        zipCode: formData.zipCode,
      });

      if (response.success) {
        navigate('/verify-email', {
          state: {
            email: response.email || formData.email,
            expiresIn: response.expiresIn || 60,
            expiresAt: response.expiresAt,
          },
        });
      } else {
        setError(response.message || 'Sign up failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Sign up failed. Please try again.');
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
        fullName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
      });
      if (response.success) { toast.success('Google signup successful!'); navigate('/home', { replace: true }); }
      else setError(response.message || 'Google signup failed');
    } catch (err) {
      setError(err.message || 'Google signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition bg-white';

  const inputErrCls =
    'w-full px-3.5 py-2.5 border border-red-400 rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-red-500 focus:ring-[3px] focus:ring-red-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed transition bg-white';

  return (
    <div className="flex min-h-screen">
      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slideInFromRight 0.35s ease-out; }
      `}</style>

      {/* Left Panel */}
      <div className="hidden md:flex relative w-[60%] flex-col items-center justify-center overflow-hidden text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img.front})` }} />
        <div className="absolute inset-0 bg-slate-900/90" />
        <img src={img.line1} alt="" className="absolute top-20 w-full h-auto object-cover opacity-40 pointer-events-none" />
        <img src={img.line2} alt="" className="absolute xl:right-10 md:right-[-10px] top-0 h-full w-auto opacity-40 pointer-events-none" />
        <img src={img.line3} alt="" className="absolute bottom-10 w-full h-auto object-cover opacity-40 pointer-events-none" />
        <img src={img.ruler} alt="" className="absolute right-0 w-auto h-auto object-cover pointer-events-none" />

        <Link to="/" className="absolute top-6 left-6 z-10 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/25 bg-white/10 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 hover:border-white/40 transition-all no-underline">
          ← Back
        </Link>

        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <img src={img.jjslogo1} alt="JJS Logo" className="w-50 h-44 rounded-full object-contain mb-6 drop-shadow-2xl" />
          <h1 className="text-4xl font-extrabold tracking-wide mb-2 font-playfair">JJS-Track</h1>
          <div className="w-16 border-b border-yellow-400 mb-5 mt-5" />
          <p className="text-sm font-thin opacity-70 tracking-wide">Where Every Stitch Reflects Quality and Craftsmanship.</p>
        </div>

        <span className="absolute bottom-6 z-10 text-xs opacity-40">© 2026 • DevMinds</span>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-8">
        <div className="w-full max-w-[420px]">

          {/* Mobile back */}
          <div className="mb-6 xl:hidden md:hidden">
            <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-400 hover:text-blue-800 transition-colors">
              ← Back to Landing
            </button>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-16 border-b border-gray-200 mb-8">
            <Link to="/login" className="pb-3 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-blue-800 transition-colors no-underline">Login</Link>
            <button className="pb-3 text-sm font-semibold text-blue-800 border-b-2 border-blue-800">Register</button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-7">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === s ? 'bg-blue-800 text-white shadow-md shadow-blue-800/30'
                    : step > s ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                    }`}>
                    {step > s ? '✓' : s}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${step === s ? 'text-blue-800' : step > s ? 'text-green-500' : 'text-gray-400'
                    }`}>
                    {s === 1 ? 'Personal Info' : 'Address'}
                  </span>
                </div>
                {s < TOTAL_STEPS && (
                  <div className={`flex-1 h-0.5 rounded transition-all duration-500 ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-[3px] border-red-500 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-slide-in">
              <h2 className="text-3xl font-bold text-slate-900 mb-1 font-playfair">Personal Info</h2>
              <p className="text-sm text-slate-400 mb-6">Tell us a bit about yourself.</p>

              <form onSubmit={handleNext}>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      disabled={loading}
                      className={nameErrors.firstName ? inputErrCls : inputCls}
                    />
                    {nameErrors.firstName && (
                      <p className="text-[11px] text-red-500 mt-1 leading-tight">{nameErrors.firstName}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      disabled={loading}
                      className={nameErrors.lastName ? inputErrCls : inputCls}
                    />
                    {nameErrors.lastName && (
                      <p className="text-[11px] text-red-500 mt-1 leading-tight">{nameErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone Number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="09XXXXXXXXX" disabled={loading} maxLength={11}
                    onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, ''); }}
                    className={inputCls} />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="Enter your email" disabled={loading} className={inputCls} />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                      onChange={handleChange} placeholder="Min 8 characters" disabled={loading} className={inputCls} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmedPassword ? 'text' : 'password'} name="confirmPassword"
                      value={formData.confirmPassword} onChange={handleChange}
                      placeholder="Confirm password" disabled={loading} className={inputCls} />
                    <button type="button" onClick={() => setConfirmedPassword(!showConfirmedPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirmedPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading || !isStep1Valid()}
                  className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-800/25 hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                  Next: Address →
                </button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 whitespace-nowrap">Or continue with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button onClick={handleGoogleSignup} disabled={loading}
                className="w-full py-2.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-600 flex items-center justify-center gap-2.5 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                <img src={img.google} alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-slide-in lg:pb-40">
              <h2 className="text-3xl font-bold text-slate-900 mb-1 font-playfair">Your Address</h2>
              <p className="text-sm text-slate-400 mb-6">Where should we deliver your orders?</p>

              <form onSubmit={handleSignup}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Street / Building No.</label>
                  <input type="text" name="street" value={formData.street} onChange={handleChange}
                    placeholder="e.g. 123 Rizal St." disabled={loading} className={inputCls} />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Region</label>
                  <select value={formData.regionCode} onChange={handleRegionChange}
                    disabled={loading} className={inputCls}>
                    <option value="">Select Region</option>
                    {regionList.map((r) => (
                      <option key={r.region_code} value={r.region_code}>{r.region_name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Province</label>
                  <select value={formData.provinceCode} onChange={handleProvinceChange}
                    disabled={loading || !formData.regionCode} className={inputCls}>
                    <option value="">{formData.regionCode ? 'Select Province' : 'Select a region first'}</option>
                    {provinceList.map((p) => (
                      <option key={p.province_code} value={p.province_code}>{p.province_name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">City / Municipality</label>
                  <select value={formData.cityCode} onChange={handleCityChange}
                    disabled={loading || !formData.provinceCode} className={inputCls}>
                    <option value="">{formData.provinceCode ? 'Select City / Municipality' : 'Select a province first'}</option>
                    {cityList.map((m) => (
                      <option key={m.city_code} value={m.city_code}>{m.city_name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Barangay</label>
                  <select
                    value={formData.brgyCode}
                    onChange={handleBarangayChange}
                    disabled={loading || !formData.cityCode}
                    className={inputCls}
                  >
                    <option value="">
                      {formData.cityCode ? 'Select Barangay' : 'Select a city first'}
                    </option>
                    {brgyList.map((b) => (
                      <option key={b.brgy_code} value={b.brgy_code}>
                        {b.brgy_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="e.g. 2111"
                    maxLength={4}
                    disabled={loading}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, '');
                    }}
                    className={inputCls}
                  />
                </div>

                <div className="flex mb-6 justify-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="checkbox" name="agreedToTerms" id="agreedToTerms"
                      checked={formData.agreedToTerms} onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="agreedToTerms" className="text-xs text-gray-600 cursor-pointer">
                      By using this app, you agree to our
                    </label>
                    <button type="button" onClick={() => openLegalModal('privacy')}
                      className="text-xs underline hover:text-blue-600 transition-colors">Privacy Policy</button>
                    <span className="text-xs text-gray-600">and</span>
                    <button type="button" onClick={() => openLegalModal('terms')}
                      className="text-xs underline hover:text-blue-600 transition-colors">Terms of Use</button>
                    <span className="text-xs text-gray-600">.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={handleBack} disabled={loading}
                    className="px-5 py-3 border border-gray-300 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                    ← Back
                  </button>
                  <button type="submit" disabled={loading || !isStep2Valid()}
                    className="flex-1 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-800/25 hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                    {loading ? 'Creating Account...' : 'Sign Up →'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Legal Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/65" onClick={closeLegalModal} />
          <div className="relative z-10 w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
            role="dialog" aria-modal="true">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base font-semibold text-slate-800">{selectedDocument.title}</h2>
              <button type="button" onClick={closeLegalModal}
                className="rounded-md px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors">
                Close
              </button>
            </div>
            <iframe title={selectedDocument.title} src={selectedDocument.href}
              className="w-full h-[calc(90vh-57px)] border-0" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupPage;
