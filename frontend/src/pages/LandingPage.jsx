import React, { useState } from 'react'
import LandingNavbar from '../components/LandingNavbar'
import Footer from '../components/Footer'
import img from '../assets/img.js'
import { Quote } from 'lucide-react'


const testimonials = [
  {
    name: 'Gerielle Quinn Marty',
    role: 'Customer',
    quote: 'Appreciation post thank you KM Graphics & Jjs Morales sa mabisang layout at pag tahi solid❤️🤍',
    rating: 5,
    date: 'August 2024',
  },
  {
    name: 'Paul Allen Ragadio',
    role: 'Customer',
    quote: 'Maraming salamat Jjs Morales sa swabeng jersey🔥Thank you also Team Tinagkan para sa dikdikang laban',
    rating: 5,
    date: 'August 2024',
  },
  {
    name: 'SUBIC Sepaktakraw Club INC',
    role: 'Club',
    quote: 'Maraming salamat sa napakaSOLID na suporta JJS SPORTSWEAR ‼️',
    rating: 5,
    date: 'February 2026',
  },
];

const faqData = [
  {
    question: 'How to book appointments?',
    answer: 'Booking an appointment is easy! Just log in to your account, head over to the dashboard, and click the "Book Now" button and choose what type of service you need.',
  },
  {
    question: 'What types of services does JJSportswear offer?',
    answer: 'We specialize in custom sportswear design (jerseys, team uniforms), clothing repairs and alterations (resizing, hemming, zipper replacement), and personalized garment tailoring. All services are trackable through the JJSTrack platform.',
  },
  {
    question: 'How does the order tracking system work?',
    answer: 'Once your order is placed, you\'ll receive real-time status updates through your JJSTrack account. You can monitor every stage — from dropped off, layout, printing, sewing, to pick-up — all from your dashboard.',
  },
  {
    question: 'Am I able to schedule a booking on any day?',
    answer: 'Appointment availability depends on our schedule. We kindly ask that you check the appointment calendar to confirm if your preferred date has open slots. If slots are available, you may proceed with the booking; if the date is fully booked, we regret that reservations cannot be made for that day.',
  },
  {
    question: 'Is there an invoice or a way to know the price?',
    answer: 'Yes, definitely. Our system generates a digital invoice for every order. You can view the full price breakdown and payment status directly on your invoice to stay updated on your expenses.',
  },
];

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main className="flex-grow">
        <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black to-indigo-600 opacity-100"></div>
          <video src={img.clip} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover opacity-40"></video>
          <div className="relative z-10 text-center px-4">

            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Master Your Craft.
            </h1>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r bg-clip-text text-transparent from-blue-600 to-blue-100 mb-9 leading-tight">
              Manage Your Business.
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              All-in-one web application. Track orders, manage clients, and grow your business with precision and style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/signup')} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-medium transition-colors">
                Register Now!
              </button>



            </div>
          </div>
          <div className="absolute bottom-0  left-1/2 -translate-x-1/2 z-10 animate-bounce duration-400 justify-center items-center flex">
            <span className="material-symbols-outlined text-white text-4xl opacity-80">keyboard_arrow_down</span>
          </div>
        </section >
        <section id="features" className="relative px-4 px-0 py-16 md:py-20 flex items-start justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[#F1F5F9]"> </div>
          <div className="relative z-10 text-center px-0 max-w-6xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold font-playfair text-[#0F172A] mb-6 ">Everything You Need to Scale</h1>
            <div className="border-b-2 border-yellow-400 w-16 md:w-24 mx-auto mb-4"></div>
            <p className="text-md md:text-lg mb-12 max-w-3xl mx-auto">
              Powerful tools designed specifically for JJSportswear, bringing traditional craftsmanship into the digital age.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4 lg:gap-6 justify-center">
              <div className="bg-[#D5DBEC] rounded-2xl py-10 px-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-blue-600">assignment</span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">Order Tracking</h3>
                <p className="text-[#475569] text-sm">Track every order from measurement to delivery with real-time status updates.</p>
              </div>
              <div className="bg-[#D5DBEC] rounded-2xl py-10 px-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-blue-600">group</span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">Client Management</h3>
                <p className="text-[#475569] text-sm">Build lasting relationships with detailed client profiles and history.</p>
              </div>
              <div className="bg-[#D5DBEC] rounded-2xl py-10 px-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-blue-600">straighten</span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">Measurements Database</h3>
                <p className="text-[#475569] text-sm">Store and access precise measurements instantly. Never lose a detail.</p>
              </div>
              <div className="bg-[#D5DBEC] rounded-2xl py-10 px-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-blue-600">inventory_2</span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">Inventory Control</h3>
                <p className="text-[#475569] text-sm">Monitor fabric stock and supplies in real-time to prevent shortages.</p>
              </div>
            </div>
          </div>
        </section>
        <section id="about" className="relative py-16 md:py-24 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-4">
            <div className="text-center mb-10 md:mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair text-[#0F172A] mb-4">Curated Features</h1>
              <div className="border-b-2 border-yellow-400 w-16 md:w-24 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="md:col-span-2 relative rounded-none overflow-hidden min-h-[280px] md:min-h-[320px] group">
                <div className="absolute inset-0 bg-[#0F172A]">
                  <img src={img.shop} alt="Fit Profiles" className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" />
                </div>
                {/* Top Left */}
                <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end h-full text-left text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-sm text-yellow-400">content_cut</span>
                    <span className="text-xs uppercase font-thin tracking-wider text-yellow-400">JJS Management</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-normal font-playfair mb-2">Personalized Fit Profiles</h3>
                  <p className="text-sm text-white font-light">We save your measurements and preferences to ensure every sportswear piece or altered garment fits you perfectly, every time.</p>
                </div>
              </div>
              {/* Top Right */}
              <div className="bg-[#0F172A] rounded-none  p-8 flex flex-col justify-center min-h-[250px] md:min-h-[320px] text-left">
                <h3 className="text-xl md:text-2xl font-bold font-playfair text-white mb-3">Custom Sportswear <span className="text-yellow-400">Design</span></h3>
                <p className="text-white font-light text-sm md:text-base mb-6">Create jerseys and sportswear tailored to your team's identity. Choose your colors, logos, names, and numbers—designed for comfort, durability, and performance.</p>
                <div>
                  <a href="#" className="inline-block border-b-2 border-yellow-400 text-white px-4 md:px-6 py-2 rounded-lg font-medium 
                    hover:shadow-[0_3px_1px_#facc15] transition-all duration-300">View Designs</a>
                </div>
              </div>
              {/* Bottom Left */}
              <div className="bg-[#F8FAFC] border border-gray-300 rounded-none  p-8 md:p-10 flex flex-col justify-center min-h-[250px] md:min-h-[320px] text-left">
                <div className="mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#0F172A]">straighten</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold font-playfair text-[#0F172A] mb-3">Clothing Repair & Alterations</h3>
                <p className="text-[#475569] font-light text-sm md:text-base">From resizing and hemming to zipper replacement and repairs, we restore and adjust your clothes to look and feel just right.</p>
              </div>
              {/* Bottom Right */}
              <div className="md:col-span-2 relative rounded-none overflow-hidden min-h-[280px] md:min-h-[320px] group">
                <div className="absolute inset-0 bg-[#0F172A]">
                  <img src={img.jersey} alt="jersey" className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" />
                </div>
                <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center h-full text-left text-white">
                  <h3 className="text-3xl md:text-5xl font-black italic mb-2">Quality You Can Trust</h3>
                  <p className="text-sm md:text-base text-white">Every stitch matters. We focus on clean finishes, strong seams, and long-lasting materials—because details make the design stand out.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="location" className="relative bg-[#0F172A] overflow-hidden">
          <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
            <img
              src={img.panorama}
              alt="JJS Sportswear Shop Panorama"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/60 via-transparent to-[#0F172A]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/40 to-transparent"></div>
            <div className="absolute top-2 left-3 md:top-12 md:left-12 z-10">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5">
                <span className="material-symbols-outlined text-yellow-400 text-sm">location_on</span>
                <span className="text-white text-sm font-medium tracking-wide">Our Location</span>
              </div>
            </div>
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10  ">
              <div className="text-center px-1">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-white m-y-10 drop-shadow-lg mb-2">
                  Visit Our Shop
                </h2>
                <div className="w-16 h-0.5 bg-yellow-400 mx-auto mb-2"></div>
              </div>
            </div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 -mt-16 pb-16 md:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <iframe
                  title="JJS Sportswear Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3847.0!2d120.2430905!3d14.8605929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDUxJzM4LjEiTiAxMjDCsDE0JzM1LjEiRQ!5e0!3m2!1sen!2sph!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '350px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full min-h-[350px] md:min-h-[400px]"
                ></iframe>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <img src={img.jjslogo1} alt="google" className="w-6 h-6" />
                    <span className="text-xs uppercase tracking-widest text-yellow-400 font-semibold">JJS Sportswear</span>
                  </div>

                  <h3 className="text-2xl font-playfair font-bold text-white mb-4">Jennoel-Jennyl Sportswear</h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400 mt-0.5 text-xl">location_on</span>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Purok 3B National Highway,<br />
                        Calapacuan, Subic,<br />
                        Zambales, Philippines
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-xl">phone</span>
                      <p className="text-gray-300 text-sm">0908 997 2332</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-xl">mail</span>
                      <p className="text-gray-300 text-sm">jjsportswearph@gmail.com</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-xl">schedule</span>
                      <div className="flex flex-col">
                        <p className="text-gray-300 text-sm">Mon - Sat: 8:00 AM – 8:00 PM</p>
                        <p className="text-gray-300 text-sm">Sun: <span className="text-red-500 font-bold">Closed</span></p>
                      </div>
                    </div>
                  </div>
                </div>
                <a
                  href="https://www.google.com/maps/@14.8605929,120.2430905,3a,75y,42.19h,85.86t/data=!3m7!1e1!3m5!1sclhDjyO6FL7gA0kwpA0OsQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D4.141821770887503%26panoid%3DclhDjyO6FL7gA0kwpA0OsQ%26yaw%3D42.190002848256434!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDIwOS4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25"
                >
                  <span className="material-symbols-outlined text-xl">directions</span>
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </section>
        <section id="testimonials" className="relative py-16 md:py-24 bg-[#F1F5F9] overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 md:mb-16">
              <span className="inline-block text-blue-600 text-sm uppercase tracking-[0.3em] font-medium mb-3">
                Testimonials
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-playfair text-[#0F172A] mb-4">
                What Our Clients Say
              </h2>
              <div className="border-b-2 border-yellow-400 w-16 md:w-24 mx-auto mb-4"></div>
              <p className="text-[#475569] text-sm md:text-base max-w-2xl mx-auto">
                Hear from the people who trust JJSportswear with their custom sportswear
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between relative group"
                >
                  <div className="absolute -top-4 left-8">
                    <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center shadow-lg">
                      <Quote className="text-yellow-400 w-5 h-5 fill-none" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, s) => (
                        <span
                          key={s}
                          className={`material-symbols-outlined text-lg ${s < t.rating ? 'text-yellow-400' : 'text-gray-200'
                            }`}
                        >
                          star
                        </span>
                      ))}
                    </div>

                    <p className="text-[#475569] text-sm leading-relaxed mb-6 italic">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-[#0F172A] font-semibold text-sm">{t.name}</p>
                      <p className="text-[#94A3B8] text-xs">{t.role} - <span className='text-xs text-[#94A3B8]'> {t.date}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="FAQ" className="relative py-16 md:py-24 bg-white overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-playfair text-[#0F172A] mb-4">
                Frequently Asked Questions
              </h2>
              <div className="border-b-2 border-yellow-400 w-16 md:w-24 mx-auto mb-4"></div>
              <p className="text-[#475569] text-sm md:text-base max-w-2xl mx-auto">
                Everything you need to know about JJSTrack and our services.
              </p>
            </div>
            <div className="space-y-3">
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className={`rounded-xl border transition-all duration-300 ${openFaq === index
                    ? 'border-blue-200 bg-blue-50/50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer"
                  >
                    <span className={`font-semibold text-sm md:text-base pr-4 transition-colors duration-300 ${openFaq === index ? 'text-blue-700' : 'text-[#0F172A]'
                      }`}>
                      {faq.question}
                    </span>
                    <span className={`material-symbols-outlined text-xl flex-shrink-0 transition-all duration-300 ${openFaq === index ? 'rotate-180 text-blue-600' : 'text-[#94A3B8]'
                      }`}>
                      expand_more
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className="px-6 pb-5">
                      <p className="text-[#475569] text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


      </main>
      <Footer />
    </div >
  )
}

export default LandingPage
