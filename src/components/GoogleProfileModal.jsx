import React, { useState, useEffect } from 'react';
import { userApi } from '../../services/userApi';
import {
  User,
  Phone,
  MapPin,
  Lightbulb,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

// ── Step Indicator ──────────────────────────────────────────────
const StepIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center gap-2 mt-1">
    {Array.from({ length: totalSteps }).map((_, i) => {
      const s = i + 1;
      return (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s < currentStep
                ? 'w-6 bg-white'
                : s === currentStep
                ? 'w-8 bg-white'
                : 'w-4 bg-white/30'
            }`}
          />
        </div>
      );
    })}
  </div>
);

// ── Main Modal ──────────────────────────────────────────────────
const GoogleProfileModal = ({ isOpen, onClose, onSuccess, fixedFirstName = '' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    firstName: fixedFirstName,
    lastName: '',
    phoneNumber: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 3;

  // Handle open/close visibility
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
      setFormData((p) => ({ ...p, firstName: fixedFirstName }));
    }
  }, [isOpen, fixedFirstName]);

  const validateStep = (step) => {
    const errs = {};

    if (step === 2) {
      // First name
      if (!formData.firstName.trim()) {
        errs.firstName = 'First name is required';
      } else if (!/^[a-zA-ZÀ-ÿ\s\-'.]+$/.test(formData.firstName.trim())) {
        errs.firstName = 'First name must contain letters only';
      } else if (formData.firstName.trim().length < 2) {
        errs.firstName = 'First name must be at least 2 characters';
      }

      // Last name
      if (!formData.lastName.trim()) {
        errs.lastName = 'Last name is required';
      } else if (!/^[a-zA-ZÀ-ÿ\s\-'.]+$/.test(formData.lastName.trim())) {
        errs.lastName = 'Last name must contain letters only';
      } else if (formData.lastName.trim().length < 2) {
        errs.lastName = 'Last name must be at least 2 characters';
      }
    }

    if (step === 3) {
      // Phone — stored as +639XXXXXXXXX (10 digits after +63)
      if (!formData.phoneNumber.trim()) {
        errs.phoneNumber = 'Phone number is required';
      } else if (!/^\+639\d{9}$/.test(formData.phoneNumber.trim())) {
        errs.phoneNumber = 'Please enter a complete 10-digit PH mobile number';
      }

      // Address
      if (!formData.address.trim()) {
        errs.address = 'Address is required';
      } else if (formData.address.trim().length < 10) {
        errs.address = 'Please enter a more complete address (at least 10 characters)';
      }
    }

    return errs;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    const errs = validateStep(currentStep);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    const errs = validateStep(3);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setIsLoading(true);
      const response = await userApi.completeGoogleProfile(formData);
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.user));
        onSuccess(response.user);
        onClose();
      } else {
        setErrors({ submit: response.message || 'Failed to complete profile' });
      }
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to save profile details' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const inputCls = (field) =>
    `w-full h-10 sm:h-12 bg-gray-50 rounded-lg sm:rounded-xl px-3 sm:px-4 border text-xs sm:text-base font-medium transition-all duration-200 focus:outline-none ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
        : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
    }`;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-3 sm:space-y-6">
            <div className="flex justify-center mb-3 sm:mb-6">
              <div className="bg-slate-100 p-2 sm:p-4 rounded-full shadow-sm">
                <Lightbulb className="w-6 h-6 sm:w-10 sm:h-10 text-slate-700" />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4 leading-snug">
                Welcome to JJSTrack!
              </h3>
              <p className="text-xs sm:text-base text-gray-600 leading-relaxed px-2">
                Before you continue, we need to gather some basic information to complete your profile and provide you with the best experience. This will only take a minute!
              </p>
            </div>

            {/* What we'll collect */}
            <div className="space-y-2 text-left">
              {[
                { icon: <User className="w-4 h-4" />, label: 'Your full name' },
                { icon: <Phone className="w-4 h-4" />, label: 'Contact information' },
                { icon: <MapPin className="w-4 h-4" />, label: 'Your address' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl">
                  <span className="text-slate-500 flex-shrink-0">{item.icon}</span>
                  <span className="text-xs sm:text-sm text-slate-700 font-medium">{item.label}</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>


          </div>
        );

      case 2:
        return (
          <div className="space-y-3 sm:space-y-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full inline-flex mb-2 sm:mb-4 shadow-sm">
                <User className="w-4 h-4 sm:w-7 sm:h-7 text-blue-600" />
              </div>
              <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1">Personal Information</h3>
              <p className="text-xs text-gray-600">Please provide your name details</p>
            </div>

            <div className="space-y-2.5 sm:space-y-4">
              {/* First name — editable */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={inputCls('firstName')}
                  placeholder="Enter your first name"
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.firstName}</p>
                )}
              </div>

              {/* Last name */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={inputCls('lastName')}
                  placeholder="Enter your last name"
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.lastName}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3 sm:space-y-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="bg-slate-100 p-2 sm:p-3 rounded-full inline-flex mb-2 sm:mb-4 shadow-sm">
                <Phone className="w-4 h-4 sm:w-7 sm:h-7 text-slate-700" />
              </div>
              <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1">Contact & Address</h3>
              <p className="text-xs text-gray-600">How can we reach you?</p>
            </div>

            <div className="space-y-2.5 sm:space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className={`flex h-10 sm:h-12 border rounded-lg sm:rounded-xl overflow-hidden transition-all duration-200 bg-white text-xs sm:text-base ${
                  errors.phoneNumber
                    ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200'
                    : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200'
                }`}>
                  <div className="flex items-center px-2 sm:px-3 bg-gray-100 border-r border-gray-300 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">+63</span>
                  </div>
                  <input
                    type="tel"
                    onChange={(e) => {
                      let raw = e.target.value.replace(/\D/g, '');
                      if (raw.startsWith('63')) raw = raw.slice(2);
                      if (raw.startsWith('0')) raw = raw.slice(1);
                      raw = raw.slice(0, 10);
                      let formatted = raw;
                      if (raw.length > 6) formatted = raw.slice(0, 3) + '-' + raw.slice(3, 6) + '-' + raw.slice(6);
                      else if (raw.length > 3) formatted = raw.slice(0, 3) + '-' + raw.slice(3);
                      e.target.value = formatted;
                      setFormData((p) => ({ ...p, phoneNumber: raw.length === 10 ? `+63${raw}` : raw }));
                      setErrors((p) => ({ ...p, phoneNumber: '' }));
                    }}
                    className="flex-1 px-2 sm:px-3 text-xs sm:text-base font-medium bg-white outline-none text-gray-800 placeholder-slate-400"
                    placeholder="9XX-XXX-XXXX"
                    disabled={isLoading}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className={`${inputCls('address')} h-auto py-2 sm:py-3 resize-none overflow-hidden text-xs sm:text-base`}
                  placeholder="Enter your complete address"
                  disabled={isLoading}
                />
                {errors.address && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.address}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div
        className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-2 sm:p-4 pointer-events-none transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[98vh] sm:max-h-[92vh] shadow-2xl relative pointer-events-auto transition-all duration-500 flex flex-col ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-12'
          }`}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-800 to-slate-700 rounded-t-3xl px-4 py-5 sm:p-6 overflow-hidden flex-shrink-0">
            {/* Decorative bg icons */}
            <div className="absolute inset-0 opacity-5 sm:opacity-10 hidden md:block">
              <User className="absolute top-2 left-6 w-12 h-12 text-white -rotate-12" strokeWidth={1.5} />
              <MapPin className="absolute top-4 right-8 w-10 h-10 text-white rotate-45" strokeWidth={1.5} />
              <CheckCircle className="absolute bottom-2 left-1/4 w-14 h-14 text-white rotate-180" strokeWidth={1.5} />
              <Lightbulb className="absolute bottom-2 right-8 w-16 h-16 text-white -rotate-45" strokeWidth={1.5} />
            </div>

            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Complete Your Profile</h2>
              <p className="text-xs sm:text-sm text-slate-300">Step {currentStep} of {totalSteps}</p>
              <div className="mt-3 sm:mt-4">
                <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:p-8">
            {renderStepContent()}
            {errors.submit && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl">
                <p className="text-xs sm:text-sm text-red-700 font-medium">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:p-6">
            <div className="flex gap-2 sm:gap-3">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  disabled={isLoading}
                  className="flex-1 h-10 sm:h-12 flex items-center justify-center gap-1.5 sm:gap-2 bg-white border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-base transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={isLoading}
                className={`h-10 sm:h-12 flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-base transition-all duration-200 shadow-md hover:shadow-lg active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentStep === 1 ? 'w-full' : 'flex-1'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : currentStep === totalSteps ? (
                  <>
                    <span className="hidden sm:inline">Complete Profile</span>
                    <span className="sm:hidden">Complete</span>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">{currentStep === 1 ? 'Get Started' : 'Continue'}</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center font-medium mt-2 sm:mt-3">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoogleProfileModal;