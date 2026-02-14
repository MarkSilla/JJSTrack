import React from 'react'
import logo from '../assets/jjs logo.png'

const Footer = () => {
  return (
    <footer className=" relative bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-">
          <div >
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start sm:justify-center">
                <img src={logo} alt="jjs logo" className="h-10" />
                <h3 className="text-lg font-bold mb-1 ">JJS Track</h3>
              </div>
              <div className="relative z-10 p-1 md:p-2 mr-0 xl:mr-10 mb-4 xl:mb-0">
                <p className="text-gray-400">Custom full sublimation sportswear and repairs, tailored for teams, events, and individuals. Quality design matters.</p>
              </div>
            </div>

          </div>
          <div className="text-center md:text-left">
            <div className="justify-center md:justify-start sm:justify-center">
              <h3 className="text-lg text-center md:text-left font-bold mb-4">Quick Links</h3>
              <ul className="text-gray-400 space-y-2">
                <li><a href="#home" className="hover:text-blue-400">Home</a></li>
                <li><a href="#features" className="hover:text-blue-400">Features</a></li>
                <li><a href="#about" className="hover:text-blue-400">About</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="  justify-center md:justify-start sm:justify-center lg:justify-center">
              <h3 className="text-lg font-bold mb-2 text-center md:text-left">Contact</h3>
              <ul className="text-gray-400 space-y-2 mx-auto">
                <li><a href="#" className="hover:text-blue-400 flex items-center gap-2 justify-center md:justify-start"><span className="material-symbols-outlined text-medium text-blue-400">mail</span>jjsportswearph@gmail.com</a></li>
                <li><a href="#" className="hover:text-blue-400 flex items-center gap-2 justify-center md:justify-start"><span className="material-symbols-outlined text-medium text-blue-400">phone</span>0908 997 2332</a></li>
                <li><a href="https://www.google.com/maps/@14.8605929,120.2430905,3a,75y,42.19h,85.86t/data=!3m7!1e1!3m5!1sclhDjyO6FL7gA0kwpA0OsQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D4.141821770887503%26panoid%3DclhDjyO6FL7gA0kwpA0OsQ%26yaw%3D42.190002848256434!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDIwOS4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer"
                  className="hover:text-blue-400 flex items-start justify-center md:justify-start"><span className="material-symbols-outlined text-medium text-blue-400">location_on</span>Purok 3B National Highway, Calapacuan, Subic, Philippines</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="justify-center md:justify-start">
              <h3 className="text-lg font-bold mb-2 text-center md:text-left">Follow Us</h3>
              <ul className="  text-gray-400 flex space-x-4 justify-center md:justify-start">
                <li><a href="https://www.facebook.com/JennoelJennyl" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 "><i className="fa fa-facebook text-blue-400 text-xl"></i></a></li>
                <li><a href="#" className="hover:text-blue-400"><i className="fa fa-instagram text-blue-400 text-xl"></i></a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="text-center md:text-left">
          <div className=" flex flex-col md:flex-row sm:flex-row border-t border-gray-700 mt-8 pt-8 flex justify-between items-center text-gray text-sm">
            <p>&copy; 2026 JJS Track. All rights reserved.</p>
            <ul className="flex space-x-6">
              <li><a href="#" className="hover:text-blue-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400">Terms of Use</a></li>
            </ul>
          </div>
        </div >
      </div>
    </footer >
  )
}

export default Footer
