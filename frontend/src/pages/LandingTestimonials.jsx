import React from 'react'
import { Quote, Star } from 'lucide-react'
import { testimonials } from './landingData'

const LandingTestimonials = () => (
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
                  <Star
                    key={s}
                    className={s < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                    size={18}
                  />
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
)

export default LandingTestimonials
