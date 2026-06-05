import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle, Mail, MapPin, Shield, Trash2, User } from 'lucide-react'
import { regions, provinces, cities, barangays } from 'select-philippines-address'
import { userApi } from '../../../services/userApi'
import { ProfilePageSkeleton } from '../../components/SkeletonLoaders.jsx'

const TOTAL_STEPS = 2

const parseStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user')
    return rawUser ? JSON.parse(rawUser) : null
  } catch (error) {
    console.error('Failed to parse stored user:', error)
    return null
  }
}

const splitName = (fullName = '') => {
  const cleaned = String(fullName).trim().replace(/\s+/g, ' ')
  if (!cleaned) return { firstName: '', lastName: '' }
  const parts = cleaned.split(' ')
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

const mapUserToFormData = (user = {}) => {
  const fallbackName = splitName(user.fullName || '')
  return {
    email: user.email || '',
    firstName: user.firstName || fallbackName.firstName || '',
    lastName: user.lastName || fallbackName.lastName || '',
    phone: user.phoneNumber || '',
    street: user.street || '',
    regionCode: user.regionCode || '',
    regionName: user.regionName || '',
    provinceCode: user.provinceCode || '',
    provinceName: user.provinceName || '',
    cityCode: user.cityCode || '',
    cityName: user.cityName || '',
    brgyCode: user.brgyCode || '',
    brgyName: user.brgyName || '',
    zipCode: user.zipCode || '',
  }
}

const buildFullAddress = (formData) => {
  const parts = [
    formData.street,
    formData.brgyName,
    formData.cityName,
    formData.provinceName,
    formData.regionName,
    formData.zipCode ? `${formData.zipCode}, Philippines` : 'Philippines',
  ].filter(Boolean)
  return parts.join(', ')
}

const getUserInitials = (fullName = '') => {
  const cleaned = String(fullName).trim()
  if (!cleaned) return 'U'
  const parts = cleaned.split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return cleaned.slice(0, 2).toUpperCase()
}

const Profile = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [errors, setErrors] = useState({})
  const [removalLoading, setRemovalLoading] = useState(false)
  const [showRemovalConfirm, setShowRemovalConfirm] = useState(false)
  const [removalEmailSent, setRemovalEmailSent] = useState(false)

  const [regionList, setRegionList] = useState([])
  const [provinceList, setProvinceList] = useState([])
  const [cityList, setCityList] = useState([])
  const [brgyList, setBrgyList] = useState([])

  const [formData, setFormData] = useState(() => mapUserToFormData())
  const [originalData, setOriginalData] = useState(() => mapUserToFormData())

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)

  useEffect(() => {
    regions().then((result) => setRegionList(result || []))
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadLocationOptions = async (profileUser = {}) => {
      const [nextProvinceList, nextCityList, nextBrgyList] = await Promise.all([
        profileUser.regionCode ? provinces(profileUser.regionCode).then((r) => r || []) : Promise.resolve([]),
        profileUser.provinceCode ? cities(profileUser.provinceCode).then((r) => r || []) : Promise.resolve([]),
        profileUser.cityCode ? barangays(profileUser.cityCode).then((r) => r || []) : Promise.resolve([]),
      ])
      if (isCancelled) return
      setProvinceList(nextProvinceList)
      setCityList(nextCityList)
      setBrgyList(nextBrgyList)
    }

    const loadProfile = async () => {
      const storedUser = parseStoredUser()
      if (!storedUser) { navigate('/login'); return }

      try {
        const freshData = await userApi.getUserProfile()
        const nextUser = freshData?.success && freshData?.user ? freshData.user : storedUser
        if (!nextUser) { navigate('/login'); return }
        if (isCancelled) return

        setUser(nextUser)
        const mapped = mapUserToFormData(nextUser)
        setFormData(mapped)
        setOriginalData(mapped)
        setMessage({ type: '', text: '' })
        setErrors({})
        localStorage.setItem('user', JSON.stringify(nextUser))
        await loadLocationOptions(nextUser)
      } catch (error) {
        console.error('Error loading profile:', error)
        if (isCancelled) return
        setUser(storedUser)
        const mapped = mapUserToFormData(storedUser)
        setFormData(mapped)
        setOriginalData(mapped)
        setMessage({ type: '', text: '' })
        setErrors({})
        await loadLocationOptions(storedUser)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadProfile()
    return () => { isCancelled = true }
  }, [navigate])

  const inputCls = (field) =>
    `w-full px-3.5 py-2.5 border rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 bg-white ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/10'
        : 'border-slate-200 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 hover:border-slate-300'
    }`

  const clearFeedback = () => setMessage({ type: '', text: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '', submit: '' }))
    clearFeedback()
  }

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11)
    setFormData((prev) => ({ ...prev, phone: digitsOnly }))
    setErrors((prev) => ({ ...prev, phone: '', submit: '' }))
    clearFeedback()
  }

  const handleZipCodeChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 4)
    setFormData((prev) => ({ ...prev, zipCode: digitsOnly }))
    setErrors((prev) => ({ ...prev, zipCode: '', submit: '' }))
    clearFeedback()
  }

  const handleRegionChange = async (e) => {
    const code = e.target.value
    const name = code ? e.target.options[e.target.selectedIndex].text : ''
    setFormData((prev) => ({
      ...prev,
      regionCode: code, regionName: code ? name : '',
      provinceCode: '', provinceName: '',
      cityCode: '', cityName: '',
      brgyCode: '', brgyName: '', zipCode: '',
    }))
    setProvinceList([]); setCityList([]); setBrgyList([])
    setErrors((prev) => ({ ...prev, regionCode: '', provinceCode: '', cityCode: '', brgyCode: '', zipCode: '', submit: '' }))
    clearFeedback()
    if (!code) return
    const nextProvinceList = await provinces(code)
    setProvinceList(nextProvinceList || [])
  }

  const handleProvinceChange = async (e) => {
    const code = e.target.value
    const name = code ? e.target.options[e.target.selectedIndex].text : ''
    setFormData((prev) => ({
      ...prev,
      provinceCode: code, provinceName: code ? name : '',
      cityCode: '', cityName: '', brgyCode: '', brgyName: '',
    }))
    setCityList([]); setBrgyList([])
    setErrors((prev) => ({ ...prev, provinceCode: '', cityCode: '', brgyCode: '', submit: '' }))
    clearFeedback()
    if (!code) return
    const nextCityList = await cities(code)
    setCityList(nextCityList || [])
  }

  const handleCityChange = async (e) => {
    const code = e.target.value
    const name = code ? e.target.options[e.target.selectedIndex].text : ''
    setFormData((prev) => ({ ...prev, cityCode: code, cityName: code ? name : '', brgyCode: '', brgyName: '' }))
    setBrgyList([])
    setErrors((prev) => ({ ...prev, cityCode: '', brgyCode: '', submit: '' }))
    clearFeedback()
    if (!code) return
    const nextBrgyList = await barangays(code)
    setBrgyList(nextBrgyList || [])
  }

  const handleBarangayChange = (e) => {
    const code = e.target.value
    const name = code ? e.target.options[e.target.selectedIndex].text : ''
    setFormData((prev) => ({ ...prev, brgyCode: code, brgyName: code ? name : '' }))
    setErrors((prev) => ({ ...prev, brgyCode: '', submit: '' }))
    clearFeedback()
  }

  const validateStep1 = () => {
    const nextErrors = {}
    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required'
    if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required'
    else if (!/^09\d{9}$/.test(formData.phone)) nextErrors.phone = 'Phone number must be an 11-digit PH mobile number starting with 09'
    return nextErrors
  }

  const validateStep2 = () => {
    const nextErrors = {}
    if (!formData.street.trim()) nextErrors.street = 'Street address is required'
    if (!formData.regionCode) nextErrors.regionCode = 'Region is required'
    if (!formData.provinceCode) nextErrors.provinceCode = 'Province is required'
    if (!formData.cityCode) nextErrors.cityCode = 'City / Municipality is required'
    if (!formData.brgyCode) nextErrors.brgyCode = 'Barangay is required'
    if (!formData.zipCode.trim()) nextErrors.zipCode = 'ZIP code is required'
    else if (formData.zipCode.length !== 4) nextErrors.zipCode = 'ZIP code must be 4 digits'
    return nextErrors
  }

  const handleNext = () => {
    const nextErrors = validateStep1()
    setErrors(nextErrors)
    clearFeedback()
    if (Object.keys(nextErrors).length === 0) setStep(2)
  }

  const handlePrevious = () => {
    setStep(1)
    setErrors({})
    clearFeedback()
  }

  const handleSubmit = async () => {
    const nextErrors = validateStep2()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      clearFeedback()
      return
    }

    setSaving(true)
    setErrors({})
    setMessage({ type: '', text: '' })

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        phoneNumber: formData.phone.trim(),
        address: buildFullAddress(formData),
        street: formData.street.trim(),
        regionCode: formData.regionCode,
        regionName: formData.regionName,
        provinceCode: formData.provinceCode,
        provinceName: formData.provinceName,
        cityCode: formData.cityCode,
        cityName: formData.cityName,
        brgyCode: formData.brgyCode,
        brgyName: formData.brgyName,
        zipCode: formData.zipCode.trim(),
      }

      const response = await userApi.updateUserProfile(payload)

      if (response?.success && response?.user) {
        setUser(response.user)
        const mapped = mapUserToFormData(response.user)
        setFormData(mapped)
        setOriginalData(mapped)
        localStorage.setItem('user', JSON.stringify(response.user))
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: response.user }))
        setMessage({ type: 'success', text: 'Your profile has been updated successfully!' })
      } else {
        setMessage({ type: 'error', text: response?.message || 'Failed to update profile. Please try again.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleRequestAccountRemoval = async () => {
    setRemovalLoading(true)
    setMessage({ type: '', text: '' })
    setRemovalEmailSent(false)

    try {
      const response = await userApi.requestAccountRemoval()
      if (response?.success) {
        setShowRemovalConfirm(false)
        setRemovalEmailSent(true)
        setMessage({ type: '', text: '' })
      } else {
        setMessage({
          type: 'error',
          text: response?.message || 'Failed to send account removal email. Please try again.',
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send account removal email. Please try again.',
      })
    } finally {
      setRemovalLoading(false)
    }
  }

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="animate-slide-in">
          {/* Step Header */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Personal Information</h2>
              <p className="text-sm text-slate-500 mt-0.5">Update your name and contact details</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  disabled={saving}
                  className={inputCls('firstName')}
                />
                {errors.firstName && (
                  <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  disabled={saving}
                  className={inputCls('lastName')}
                />
                {errors.lastName && (
                  <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none pointer-events-none">+63</span>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="09XXXXXXXXX"
                  maxLength={11}
                  disabled={saving}
                  className={`${inputCls('phone')} pl-10`}
                />
              </div>
              {errors.phone ? (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {errors.phone}
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-1.5">Enter your 11-digit Philippine mobile number</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-slate-300" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Email address is linked to your account and cannot be changed here</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="animate-slide-in">
        {/* Step Header */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Delivery Address</h2>
            <p className="text-sm text-slate-500 mt-0.5">This address will be used for orders and bookings</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Street */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Street / Building No.</label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="e.g. 123 Rizal Street, Unit 4B"
              disabled={saving}
              className={inputCls('street')}
            />
            {errors.street && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                {errors.street}
              </p>
            )}
          </div>

          {/* Region & Province in a grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Region</label>
              <select
                value={formData.regionCode}
                onChange={handleRegionChange}
                disabled={saving}
                className={inputCls('regionCode')}
              >
                <option value="">Select region</option>
                {regionList.map((region) => (
                  <option key={region.region_code} value={region.region_code}>
                    {region.region_name}
                  </option>
                ))}
              </select>
              {errors.regionCode && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {errors.regionCode}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Province</label>
              <select
                value={formData.provinceCode}
                onChange={handleProvinceChange}
                disabled={saving || !formData.regionCode}
                className={inputCls('provinceCode')}
              >
                <option value="">{formData.regionCode ? 'Select province' : 'Select a region first'}</option>
                {provinceList.map((province) => (
                  <option key={province.province_code} value={province.province_code}>
                    {province.province_name}
                  </option>
                ))}
              </select>
              {errors.provinceCode && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {errors.provinceCode}
                </p>
              )}
            </div>
          </div>

          {/* City & Barangay in a grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">City / Municipality</label>
              <select
                value={formData.cityCode}
                onChange={handleCityChange}
                disabled={saving || !formData.provinceCode}
                className={inputCls('cityCode')}
              >
                <option value="">{formData.provinceCode ? 'Select city' : 'Select a province first'}</option>
                {cityList.map((city) => (
                  <option key={city.city_code} value={city.city_code}>
                    {city.city_name}
                  </option>
                ))}
              </select>
              {errors.cityCode && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {errors.cityCode}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Barangay</label>
              <select
                value={formData.brgyCode}
                onChange={handleBarangayChange}
                disabled={saving || !formData.cityCode}
                className={inputCls('brgyCode')}
              >
                <option value="">{formData.cityCode ? 'Select barangay' : 'Select a city first'}</option>
                {brgyList.map((barangayOption) => (
                  <option key={barangayOption.brgy_code} value={barangayOption.brgy_code}>
                    {barangayOption.brgy_name}
                  </option>
                ))}
              </select>
              {errors.brgyCode && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {errors.brgyCode}
                </p>
              )}
            </div>
          </div>

          {/* ZIP Code */}
          <div className="max-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">ZIP Code</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleZipCodeChange}
              placeholder="e.g. 2111"
              maxLength={4}
              disabled={saving}
              className={inputCls('zipCode')}
            />
            {errors.zipCode && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                {errors.zipCode}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <ProfilePageSkeleton />
  }

  const completionPercent = step === 1 ? 50 : 100

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slideIn 0.25s ease-out; }
      `}</style>

      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-5">

          {/* ── Hero Header Card ── */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 overflow-hidden shadow-xl">
            {/* Top accent line */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500" />

            <div className="px-6 py-6 sm:px-8 sm:py-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: avatar + info */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-white">{getUserInitials(user?.fullName)}</span>
                      )}
                    </div>
                    {user?.isGoogleUser && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow">
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">My Account</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {user?.fullName || user?.firstName ? `${user?.firstName} ${user?.lastName}`.trim() : 'Update Your Profile'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400 bg-white/8 px-2.5 py-1 rounded-full border border-white/10">
                        {user?.email}
                      </span>
                      {user?.isGoogleUser && (
                        <span className="text-xs text-blue-300 bg-blue-500/15 px-2.5 py-1 rounded-full border border-blue-500/20">
                          Google Account
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: progress tracker */}
                <div className="rounded-xl border border-white/10 bg-white/8 px-5 py-4 backdrop-blur-sm lg:min-w-[240px]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Progress</p>
                    <span className="text-xs font-bold text-white">{completionPercent}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-white/10 mb-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-300 transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>

                  {/* Step indicators */}
                  <div className="flex items-center gap-2">
                    {[
                      { num: 1, label: 'Personal Info' },
                      { num: 2, label: 'Address' },
                    ].map((s, idx) => (
                      <React.Fragment key={s.num}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0 ${
                              step === s.num
                                ? 'bg-white text-slate-900 shadow-sm'
                                : step > s.num
                                  ? 'bg-blue-400 text-white'
                                  : 'bg-white/15 text-white/60'
                            }`}
                          >
                            {step > s.num ? <CheckCircle className="w-3.5 h-3.5" /> : s.num}
                          </div>
                          <span className={`text-xs font-medium truncate ${step === s.num ? 'text-white' : 'text-white/50'}`}>
                            {s.label}
                          </span>
                        </div>
                        {idx < 1 && (
                          <div className={`w-6 h-px shrink-0 rounded ${step > s.num ? 'bg-blue-400' : 'bg-white/15'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Form Card ── */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-4 sm:px-8 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Step {step} of {TOTAL_STEPS} — {step === 1 ? 'Personal Details' : 'Address Details'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {step === 1
                    ? 'Your name and phone number will appear on your orders'
                    : 'This address will be used as your default shipping address'}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      n === step ? 'w-6 bg-slate-800' : n < step ? 'w-3 bg-slate-400' : 'w-3 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Form body */}
            <div className="px-6 py-6 sm:px-8 sm:py-7">
              {/* Feedback message */}
              {message.text && (
                <div
                  className={`mb-6 rounded-xl px-4 py-3 text-sm flex items-start gap-3 ${
                    message.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                    message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {message.type === 'success' ? '✓' : '!'}
                  </span>
                  {message.text}
                </div>
              )}

              {renderStepContent()}
            </div>

            {/* Card footer / navigation */}
            <div className="px-6 py-4 sm:px-8 border-t border-slate-100 bg-slate-50/60">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
                <button
                  type="button"
                  onClick={step === 1 ? () => navigate('/home') : handlePrevious}
                  disabled={saving}
                  className="h-10 px-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {step === 1 ? 'Back to Home' : 'Previous'}
                </button>

                <div className="flex flex-col items-stretch sm:items-end gap-1">
                  <button
                    type="button"
                    onClick={step === TOTAL_STEPS ? handleSubmit : handleNext}
                    disabled={saving || (step === TOTAL_STEPS && !hasChanges)}
                    className="h-10 px-6 sm:min-w-[200px] flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-medium text-sm transition-all duration-200 hover:bg-slate-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : step === TOTAL_STEPS ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save Profile
                      </>
                    ) : (
                      <>
                        Continue to Address
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  {step === TOTAL_STEPS && !hasChanges && !saving && (
                    <p className="text-xs text-slate-400 text-center sm:text-right">
                      No changes to save
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Info note ── */}
          <p className="text-center text-xs text-slate-400 pb-2">
            Your information is kept private and only used for order processing and delivery.
          </p>

          <div className={`mx-auto max-w-2xl rounded-2xl border px-6 py-5 sm:px-8 ${
            removalEmailSent
              ? 'border-emerald-200 bg-emerald-50/80'
              : 'border-red-200 bg-red-50/60'
          }`}>
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                removalEmailSent ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}>
                {removalEmailSent ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${removalEmailSent ? 'text-emerald-800' : 'text-red-900'}`}>
                  {removalEmailSent ? 'Account removal email sent' : 'Remove account'}
                </h3>
                <p className={`mt-1 text-sm leading-6 ${removalEmailSent ? 'text-emerald-700' : 'text-red-700'}`}>
                  {removalEmailSent
                    ? `Confirmation email is being sent to ${user?.email || 'your email address'}. Please check your inbox in a few moments and click the link to remove your account.`
                    : 'Request an email confirmation link. Once you click the link, your JJSTrack account will be removed immediately.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRemovalConfirm(true)}
                disabled={removalLoading || saving || removalEmailSent}
                className={`inline-flex h-10 min-w-[146px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  removalEmailSent
                    ? 'border-emerald-200 bg-white text-emerald-700'
                    : 'border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                {removalEmailSent ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Sent
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Remove Account
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {showRemovalConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Send removal confirmation?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  We will send a confirmation link to {user?.email}. Clicking that email link permanently removes this account.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowRemovalConfirm(false)}
                disabled={removalLoading}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestAccountRemoval}
                disabled={removalLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removalLoading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Profile
