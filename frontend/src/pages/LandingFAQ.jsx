import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { faqData } from './landingData'

const LandingFAQ = () => {
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <section id="FAQ" className="relative py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-playfair text-[#0F172A] mb-4">
            Frequently Asked Questions
          </h2>
          <div className="border-b-2 border-yellow-400 w-16 md:w-24 mx-auto mb-4"></div>
          <p className="text-[#475569] text-sm md:text-base max-w-2xl mx-auto">
            Everything you need to know about JJSTrack and our services.
          </p>
        </motion.div>
        <div className="space-y-3">
          {faqData.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className={`rounded-xl border transition-all duration-300 overflow-hidden ${openFaq === index
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
                <ChevronDown className={`flex-shrink-0 transition-all duration-300 ${openFaq === index ? 'rotate-180 text-blue-600' : 'text-[#94A3B8]'
                  }`} size={20} />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === index && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5">
                      <p className="text-[#475569] text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LandingFAQ
