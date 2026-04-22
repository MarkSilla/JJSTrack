import React, { useEffect, useMemo, useState } from 'react';
import { userApi } from '../../services/userApi.js';
import {
  getAllProvinces,
  getMunicipalitiesByProvince,
  getBarangaysByMunicipality,
} from '@aivangogh/ph-address';
import { User, MapPin, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

const TOTAL_STEPS = 2;

const parseStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    return {};
  }
};

const splitName = (fullName = '') => {
  const cleaned = String(fullName).trim().replace(/\s+/g, ' ');
  if (!cleaned) return { firstName: '', lastName: '' };
  const parts = cleaned.split(' ');
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

const GoogleProfileModal = ({ isOpen, onClose, onSuccess, fixedFirstName = '' }) => {
  const storedUser = useMemo(() => parseStoredUser(), [isOpen]);
  const fallbackName = splitName(storedUser.fullName || '');
  const initialFirstName = fixedFirstName || storedUser.firstName || fallbackName.firstName || '';
  const initialLastName = storedUser.lastName || fallbackName.lastName || '';

  const [step, setStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: storedUser.email || '',
    firstName: initialFirstName,
    lastName: initialLastName,
    phone: storedUser.phoneNumber || '',
    street: storedUser.street || '',
    barangay: storedUser.brgyName || '',
    city: storedUser.cityName || '',
    province: storedUser.provinceName || '',
    zipCode: '',
  });
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const allProvinces = useMemo(() => getAllProvinces(), []);
  const allMunicipalities = useMemo(
    () => (selectedProvince ? getMunicipalitiesByProvince(selectedProvince.psgcCode) : []),
    [selectedProvince]
  );
  const allBarangays = useMemo(
    () => (selectedCity ? getBarangaysByMunicipality(selectedCity.psgcCode) : []),
    [selectedCity]
  );

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const latestUser = parseStoredUser();
    const parsedName = splitName(latestUser.fullName || '');
    const firstName = fixedFirstName || latestUser.firstName || parsedName.firstName || '';
    const lastName = latestUser.lastName || parsedName.lastName || '';
    const province =
      allProvinces.find((item) => item.psgcCode === latestUser.provinceCode)
      || allProvinces.find((item) => item.name === latestUser.provinceName)
      || null;
    const municipalities = province ? getMunicipalitiesByProvince(province.psgcCode) : [];
    const city =
      municipalities.find((item) => item.psgcCode === latestUser.cityCode)
      || municipalities.find((item) => item.name === latestUser.cityName)
      || null;

    setStep(1);
    setErrors({});
    setSelectedProvince(province);
    setSelectedCity(city);
    setFormData({
      email: latestUser.email || '',
      firstName,
      lastName,
      phone: latestUser.phoneNumber || '',
      street: latestUser.street || '',
      barangay: latestUser.brgyName || '',
      city: city?.name || latestUser.cityName || '',
      province: province?.name || latestUser.provinceName || '',
      zipCode: '',
    });
  }, [isOpen, fixedFirstName, allProvinces]);

  const inputCls = (field) =>
    `w-full px-3.5 py-2.5 border rounded-lg text-sm text-slate-800 placeholder-slate-300 outline-none transition bg-white ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/10'
        : 'border-gray-300 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10'
    }`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '', submit: '' }));
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData((prev) => ({ ...prev, phone: digitsOnly }));
    setErrors((prev) => ({ ...prev, phone: '', submit: '' }));
  };

  const handleProvinceChange = (e) => {
    const found = allProvinces.find((province) => province.psgcCode === e.target.value);
    setSelectedProvince(found || null);
    setSelectedCity(null);
    setFormData((prev) => ({
      ...prev,
      province: found?.name || '',
      city: '',
      barangay: '',
      zipCode: '',
    }));
    setErrors((prev) => ({
      ...prev,
      province: '',
      city: '',
      barangay: '',
      zipCode: '',
      submit: '',
    }));
  };

  const handleCityChange = (e) => {
    const found = allMunicipalities.find((city) => city.psgcCode === e.target.value);
    setSelectedCity(found || null);
    setFormData((prev) => ({
      ...prev,
      city: found?.name || '',
      barangay: '',
    }));
    setErrors((prev) => ({ ...prev, city: '', barangay: '', submit: '' }));
  };

  const handleBarangayChange = (e) => {
    const found = allBarangays.find((barangay) => barangay.psgcCode === e.target.value);
    setFormData((prev) => ({ ...prev, barangay: found?.name || '' }));
    setErrors((prev) => ({ ...prev, barangay: '', submit: '' }));
  };

  const validateStep1 = () => {
    const nextErrors = {};

    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required';
    else if (formData.phone.length !== 11) nextErrors.phone = 'Phone number must be 11 digits';

    return nextErrors;
  };

  const validateStep2 = () => {
    const nextErrors = {};

    if (!formData.street.trim()) nextErrors.street = 'Street is required';
    if (!formData.province.trim()) nextErrors.province = 'Province is required';
    if (!formData.city.trim()) nextErrors.city = 'City / Municipality is required';
    if (!formData.barangay.trim()) nextErrors.barangay = 'Barangay is required';
    if (!formData.zipCode.trim()) nextErrors.zipCode = 'ZIP code is required';
    else if (formData.zipCode.length !== 4) nextErrors.zipCode = 'ZIP code must be 4 digits';

    return nextErrors;
  };

  const buildFullAddress = () =>
    `${formData.street}, ${formData.barangay}, ${formData.city}, ${formData.province} ${formData.zipCode}, Philippines`;

  const handleNext = () => {
    if (step === 1) {
      const nextErrors = validateStep1();
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length === 0) setStep(2);
      return;
    }

    handleSubmit();
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    const nextErrors = validateStep2();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsLoading(true);
      const response = await userApi.completeGoogleProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phone.trim(),
        address: buildFullAddress(),
        street: formData.street.trim(),
        provinceCode: selectedProvince?.psgcCode || '',
        provinceName: formData.province.trim(),
        cityCode: selectedCity?.psgcCode || '',
        cityName: formData.city.trim(),
        brgyCode: allBarangays.find((barangay) => barangay.name === formData.barangay)?.psgcCode || '',
        brgyName: formData.barangay.trim(),
      });

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

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="animate-slide-in">
          <div className="text-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full inline-flex mb-4 shadow-sm">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Personal Info</h3>
            <p className="text-sm text-gray-600">Complete your Google account details just like signup.</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  disabled={isLoading}
                  className={inputCls('firstName')}
                />
                {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  disabled={isLoading}
                  className={inputCls('lastName')}
                />
                {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="09XXXXXXXXX"
                maxLength={11}
                disabled={isLoading}
                className={inputCls('phone')}
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-500 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email comes from your Google account</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-slide-in">
        <div className="text-center mb-6">
          <div className="bg-slate-100 p-3 rounded-full inline-flex mb-4 shadow-sm">
            <MapPin className="w-6 h-6 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Your Address</h3>
          <p className="text-sm text-gray-600">Use the same address details required in signup.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Street / Building No.</label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="e.g. 123 Rizal St."
              disabled={isLoading}
              className={inputCls('street')}
            />
            {errors.street && <p className="text-xs text-red-600 mt-1">{errors.street}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Province</label>
            <select
              value={selectedProvince?.psgcCode || ''}
              onChange={handleProvinceChange}
              disabled={isLoading}
              className={inputCls('province')}
            >
              <option value="">Select Province</option>
              {allProvinces.map((province) => (
                <option key={province.psgcCode} value={province.psgcCode}>
                  {province.name}
                </option>
              ))}
            </select>
            {errors.province && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">City / Municipality</label>
            <select
              value={selectedCity?.psgcCode || ''}
              onChange={handleCityChange}
              disabled={isLoading || !selectedProvince}
              className={inputCls('city')}
            >
              <option value="">
                {selectedProvince ? 'Select City / Municipality' : 'Select a province first'}
              </option>
              {allMunicipalities.map((city) => (
                <option key={city.psgcCode} value={city.psgcCode}>
                  {city.name}
                </option>
              ))}
            </select>
            {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Barangay</label>
              <select
                value={allBarangays.find((barangay) => barangay.name === formData.barangay)?.psgcCode || ''}
                onChange={handleBarangayChange}
                disabled={isLoading || !selectedCity}
                className={inputCls('barangay')}
              >
                <option value="">
                  {selectedCity ? 'Select Barangay' : 'Select a city first'}
                </option>
                {allBarangays.map((barangay) => (
                  <option key={barangay.psgcCode} value={barangay.psgcCode}>
                    {barangay.name}
                  </option>
                ))}
              </select>
              {errors.barangay && <p className="text-xs text-red-600 mt-1">{errors.barangay}</p>}
            </div>

            <div className="w-28">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormData((prev) => ({ ...prev, zipCode: digitsOnly }));
                  setErrors((prev) => ({ ...prev, zipCode: '', submit: '' }));
                }}
                placeholder="e.g. 2111"
                maxLength={4}
                disabled={isLoading}
                className={inputCls('zipCode')}
              />
              {errors.zipCode && <p className="text-xs text-red-600 mt-1">{errors.zipCode}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slideInFromRight 0.3s ease-out; }
      `}</style>

      <div
        className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-2 sm:p-4 pointer-events-none transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl max-h-[98vh] sm:max-h-[92vh] shadow-2xl relative pointer-events-auto transition-all duration-500 flex flex-col ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-12'
          }`}
        >
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-800 to-slate-700 rounded-t-3xl px-4 py-5 sm:p-6 overflow-hidden flex-shrink-0">
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Complete Your Profile</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Step {step} of {TOTAL_STEPS}
              </p>

              <div className="mt-4 flex items-center justify-center gap-3 sm:gap-4">
                {[1, 2].map((current) => (
                  <React.Fragment key={current}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          step === current
                            ? 'bg-white text-slate-800'
                            : step > current
                            ? 'bg-green-400 text-slate-900'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {step > current ? <CheckCircle className="w-4 h-4" /> : current}
                      </div>
                      <span className="text-xs font-medium text-white/90">
                        {current === 1 ? 'Personal Info' : 'Address'}
                      </span>
                    </div>
                    {current < TOTAL_STEPS && (
                      <div className={`w-10 sm:w-16 h-0.5 rounded ${step > current ? 'bg-green-400' : 'bg-white/20'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:p-8">
            {renderStepContent()}

            {errors.submit && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700 font-medium">{errors.submit}</p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:p-6">
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={handlePrevious}
                  disabled={isLoading}
                  className="flex-1 h-11 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={isLoading}
                className={`h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  step === 1 ? 'w-full' : 'flex-1'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : step === TOTAL_STEPS ? (
                  <>
                    Complete Profile
                    <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next: Address
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoogleProfileModal;
