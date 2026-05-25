import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { userApi } from '../../services/userApi.js'
import img from '../assets/img.js'

const AccountRemovalConfirmPage = () => {
  const location = useLocation()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Confirming your account removal...')

  useEffect(() => {
    let isCancelled = false
    const token = new URLSearchParams(location.search).get('token')

    const removeAccount = async () => {
      if (!token) {
        setStatus('error')
        setMessage('This account removal link is missing a confirmation token.')
        return
      }

      try {
        const response = await userApi.confirmAccountRemoval(token)
        if (isCancelled) return

        if (response?.success) {
          setStatus('success')
          setMessage(response.message || 'Your account has been successfully removed.')
          window.history.replaceState({}, '', '/account-removal/confirm')
        } else {
          setStatus('error')
          setMessage(response?.message || 'Unable to remove your account. Please request a new confirmation email.')
        }
      } catch (error) {
        if (isCancelled) return
        setStatus('error')
        setMessage(error.response?.data?.message || 'Unable to remove your account. Please request a new confirmation email.')
      }
    }

    removeAccount()

    return () => {
      isCancelled = true
    }
  }, [location.search])

  const isSuccess = status === 'success'
  const isLoading = status === 'loading'
  const statusStyles = isLoading
    ? {
        iconWrap: 'bg-slate-100 text-slate-700 ring-slate-200',
        eyebrow: 'Processing request',
        title: 'Removing your account',
        buttonLabel: 'Go to Login',
      }
    : isSuccess
      ? {
          iconWrap: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
          eyebrow: 'Request completed',
          title: 'Your account has been removed',
          buttonLabel: 'Back to JJSTrack',
        }
      : {
          iconWrap: 'bg-red-50 text-red-600 ring-red-200',
          eyebrow: 'Confirmation unavailable',
          title: 'This link cannot be used',
          buttonLabel: 'Go to Login',
        }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${img.front})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-slate-950/75" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/80 to-transparent" aria-hidden="true" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                <img src={img.jjslogo1} alt="JJS Logo" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">JJSTrack</p>
                <h1 className="text-base font-semibold text-slate-950">Account Removal</h1>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 text-center sm:px-8 sm:py-10">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${statusStyles.iconWrap}`}>
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : isSuccess ? (
                <CheckCircle className="h-8 w-8" />
              ) : (
                <XCircle className="h-8 w-8" />
              )}
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {statusStyles.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
              {statusStyles.title}
            </h2>

            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-600">{message}</p>

            {isSuccess && (
              <div className="mx-auto mt-6 max-w-sm rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                Thank you for being a valued customer of JJS Tailoring Shop.
              </div>
            )}

            <div className="mt-8">
              <Link
                to={isSuccess ? '/' : '/login'}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white no-underline shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                {statusStyles.buttonLabel}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AccountRemovalConfirmPage
