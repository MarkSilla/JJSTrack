import React, { useEffect, useState } from 'react'
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import jjsLogo from '../assets/jjs_result.png'

const Footer = () => {
  const [activeLegalDoc, setActiveLegalDoc] = useState(null)

  const legalDocuments = {
    privacy: {
      title: 'Privacy Policy',
      href: '/privacy-policy'
    },
    terms: {
      title: 'Terms of Use',
      href: '/terms-of-use'
    }
  }

  const openLegalModal = (docKey) => setActiveLegalDoc(docKey)
  const closeLegalModal = () => setActiveLegalDoc(null)

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeLegalModal()
      }
    }

    if (activeLegalDoc) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [activeLegalDoc])

  const selectedDocument = activeLegalDoc ? legalDocuments[activeLegalDoc] : null

  return (
    <>
      <footer className="relative bg-gray-800 py-8 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
            <div className="col-span-2 order-1 md:col-span-1 md:order-1">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center gap-3 md:justify-start">
                  <img src={jjsLogo} alt="jjs logo" width="40" height="40" loading="lazy" decoding="async" className="h-10 w-10 object-contain" />
                  <h3 className="mb-1 text-lg font-bold">JJS Track</h3>
                </div>
                <div className="relative z-10 p-1 md:p-2 mr-0 xl:mr-10 mb-4 xl:mb-0">
                  <p className="text-gray-400">Custom full sublimation sportswear and repairs, tailored for teams, events, and individuals. Quality design matters.</p>
                </div>
              </div>
            </div>
            <div className="order-3 col-span-2 text-center md:col-span-1 md:order-2 md:text-left">
              <div>
                <h3 className="mb-3 text-center text-lg font-bold md:mb-4 md:text-left">Quick Links</h3>
                <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-400 md:flex-col md:items-start md:space-y-2 md:gap-0 md:text-base">
                  <li><a href="#home" className="hover:text-blue-400">Home</a></li>
                  <li><a href="#features" className="hover:text-blue-400">Features</a></li>
                  <li><a href="#about" className="hover:text-blue-400">About</a></li>
                  <li><a href="#testimonials" className="hover:text-blue-400">Testimonials</a></li>
                  <li><a href="#FAQ" className="hover:text-blue-400">FAQ</a></li>
                </ul>
              </div>
            </div>
            <div className="col-span-2 order-2 text-center md:col-span-1 md:order-3 md:text-left">
              <div>
                <h3 className="mb-2 text-center text-lg font-bold md:text-left">Contact</h3>
                <ul className="text-gray-400 space-y-2 mx-auto">
                  <li><a href="#" className="hover:text-blue-400 flex items-center gap-2 justify-center md:justify-start"><Mail className="text-blue-400" size={18} />jjsportswearph@gmail.com</a></li>
                  <li><a href="#" className="hover:text-blue-400 flex items-center gap-2 justify-center md:justify-start"><Phone className="text-blue-400" size={18} />0908 997 2332</a></li>
                  <li><a href="https://www.google.com/maps/@14.8605929,120.2430905,3a,75y,42.19h,85.86t/data=!3m7!1e1!3m5!1sclhDjyO6FL7gA0kwpA0OsQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D4.141821770887503%26panoid%3DclhDjyO6FL7gA0kwpA0OsQ%26yaw%3D42.190002848256434!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDIwOS4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer"
                    className="hover:text-blue-400 flex items-start justify-center md:justify-start"><MapPin className="text-blue-400 mt-0.5 shrink-0" size={18} />Purok 3B National Highway, Calapacuan, Subic, Philippines</a></li>
                </ul>
              </div>
            </div>
            <div className="order-4 col-span-2 text-center md:col-span-1 md:order-4 md:text-left pt-2 md:pt-0">
              <div>
                <h3 className="mb-2 text-center text-lg font-bold md:text-left">Follow Us</h3>
                <ul className="flex justify-center space-x-5 text-gray-400 md:justify-start">
                  <li><a href="https://www.facebook.com/JennoelJennyl" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 " aria-label="Facebook"><Facebook className="text-blue-400" size={20} /></a></li>
                  <li><a href="https://www.instagram.com/jjsportswearph?igsh=MXNka3JiZXNtZ3NqNw==" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400" aria-label="Instagram"><Instagram className="text-blue-400" size={20} /></a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="mt-8 flex flex-col items-center justify-between border-t border-gray-700 pt-8 text-sm text-gray md:flex-row">
              <p>&copy; 2026 JJS Track. All rights reserved.</p>
              <ul className="mt-2 flex items-center gap-3 md:mt-0">
                <li>
                  <button
                    type="button"
                    onClick={() => openLegalModal('privacy')}
                    className="hover:text-blue-400"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li aria-hidden="true" className="text-gray-500">|</li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegalModal('terms')}
                    className="hover:text-blue-400"
                  >
                    Terms of Use
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div >
      </footer >

      {selectedDocument && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close legal document modal"
            className="absolute inset-0 bg-black/65"
            onClick={closeLegalModal}
          />
          <div
            className="relative z-10 w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
            role="dialog"
            aria-modal="true"
            aria-label={selectedDocument.title}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base md:text-lg font-semibold text-slate-800">
                {selectedDocument.title}
              </h2>
              <button
                type="button"
                onClick={closeLegalModal}
                className="rounded-md px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>

            <iframe
              title={selectedDocument.title}
              src={selectedDocument.href}
              className="w-full h-[calc(90vh-57px)] border-0"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default Footer
