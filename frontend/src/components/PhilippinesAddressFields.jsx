import React, { useEffect, useState } from 'react'
import { barangays, cities, provinces, regions } from 'select-philippines-address'

export const buildFullAddress = (data = {}) => {
  const parts = [
    data.street,
    data.brgyName,
    data.cityName,
    data.provinceName,
    data.regionName,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean)

  return parts.join(', ')
}

const baseInputClassName = 'border rounded-xl px-4 py-3.5 text-sm transition-all duration-200'

const inputClassName = (readOnly = false) =>
  `${baseInputClassName} ${
    readOnly
      ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed focus:outline-none'
      : 'bg-[#F8FAFC] border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15'
  }`

const SelectField = ({ label, value, onChange, disabled, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-semibold uppercase tracking-wider text-blue-600/70">{label}</label>
    <select
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      className={`${inputClassName(disabled)} appearance-none`}
    >
      {children}
    </select>
  </div>
)

const TextField = ({ label, value, onChange, readOnly, placeholder }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-semibold uppercase tracking-wider text-blue-600/70">{label}</label>
    <input
      value={value || ''}
      onChange={onChange}
      readOnly={readOnly}
      aria-readonly={readOnly}
      placeholder={placeholder}
      className={inputClassName(readOnly)}
    />
  </div>
)

const PhilippinesAddressFields = ({ value = {}, onChange, readOnly = false }) => {
  const [regionList, setRegionList] = useState([])
  const [provinceList, setProvinceList] = useState([])
  const [cityList, setCityList] = useState([])
  const [barangayList, setBarangayList] = useState([])

  const updateAddress = (patch) => {
    const next = { ...value, ...patch }
    onChange?.({ ...next, address: buildFullAddress(next) })
  }

  useEffect(() => {
    let cancelled = false
    regions().then((result) => {
      if (!cancelled) setRegionList(result || [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadOptions = async () => {
      const [nextProvinces, nextCities, nextBarangays] = await Promise.all([
        value.regionCode ? provinces(value.regionCode).then((result) => result || []) : Promise.resolve([]),
        value.provinceCode ? cities(value.provinceCode).then((result) => result || []) : Promise.resolve([]),
        value.cityCode ? barangays(value.cityCode).then((result) => result || []) : Promise.resolve([]),
      ])

      if (cancelled) return
      setProvinceList(nextProvinces)
      setCityList(nextCities)
      setBarangayList(nextBarangays)
    }

    loadOptions()
    return () => {
      cancelled = true
    }
  }, [value.regionCode, value.provinceCode, value.cityCode])

  const handleRegionChange = (event) => {
    const code = event.target.value
    const name = code ? event.target.options[event.target.selectedIndex].text : ''
    updateAddress({
      regionCode: code,
      regionName: name,
      provinceCode: '',
      provinceName: '',
      cityCode: '',
      cityName: '',
      brgyCode: '',
      brgyName: '',
    })
  }

  const handleProvinceChange = (event) => {
    const code = event.target.value
    const name = code ? event.target.options[event.target.selectedIndex].text : ''
    updateAddress({
      provinceCode: code,
      provinceName: name,
      cityCode: '',
      cityName: '',
      brgyCode: '',
      brgyName: '',
    })
  }

  const handleCityChange = (event) => {
    const code = event.target.value
    const name = code ? event.target.options[event.target.selectedIndex].text : ''
    updateAddress({
      cityCode: code,
      cityName: name,
      brgyCode: '',
      brgyName: '',
    })
  }

  const handleBarangayChange = (event) => {
    const code = event.target.value
    const name = code ? event.target.options[event.target.selectedIndex].text : ''
    updateAddress({ brgyCode: code, brgyName: name })
  }

  const hasStructuredAddress = Boolean(value.street || value.regionCode || value.provinceCode || value.cityCode || value.brgyCode)

  if (readOnly && value.address && !hasStructuredAddress) {
    return (
      <TextField
        label="Address"
        value={value.address}
        readOnly
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SelectField label="Region" value={value.regionCode} onChange={handleRegionChange} disabled={readOnly}>
          <option value="">{value.regionName || 'Select Region'}</option>
          {regionList.map((region) => (
            <option key={region.region_code} value={region.region_code}>
              {region.region_name}
            </option>
          ))}
        </SelectField>

        <SelectField label="Province" value={value.provinceCode} onChange={handleProvinceChange} disabled={readOnly || !value.regionCode}>
          <option value="">{value.provinceName || (value.regionCode ? 'Select Province' : 'Select Region First')}</option>
          {provinceList.map((province) => (
            <option key={province.province_code} value={province.province_code}>
              {province.province_name}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SelectField label="City / Municipality" value={value.cityCode} onChange={handleCityChange} disabled={readOnly || !value.provinceCode}>
          <option value="">{value.cityName || (value.provinceCode ? 'Select City' : 'Select Province First')}</option>
          {cityList.map((city) => (
            <option key={city.city_code} value={city.city_code}>
              {city.city_name}
            </option>
          ))}
        </SelectField>

        <SelectField label="Barangay" value={value.brgyCode} onChange={handleBarangayChange} disabled={readOnly || !value.cityCode}>
          <option value="">{value.brgyName || (value.cityCode ? 'Select Barangay' : 'Select City First')}</option>
          {barangayList.map((barangay) => (
            <option key={barangay.brgy_code} value={barangay.brgy_code}>
              {barangay.brgy_name}
            </option>
          ))}
        </SelectField>
      </div>

      <TextField
        label="Street / House No. / Building"
        placeholder="e.g. #123 Gordon Heights, Street"
        value={value.street}
        onChange={(event) => updateAddress({ street: event.target.value })}
        readOnly={readOnly}
      />
    </div>
  )
}

export default PhilippinesAddressFields
