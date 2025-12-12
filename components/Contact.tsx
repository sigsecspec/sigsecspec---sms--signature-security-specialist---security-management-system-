import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    service: 'Consultation',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitted(true);
      setFormState({ name: '', email: '', service: 'Consultation', message: '' });
    }, 1000);
  };

  return (
    <div className="bg-brand-black py-24 px-4 sm:px-6 lg:px-8 border-t border-brand-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold text-white sm:text-4xl">Secure Your Future Today</h2>
          <p className="mt-4 text-xl text-brand-silver">Get in touch for a confidential consultation or specialized quote.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-brand-ebony p-8 rounded-xl border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-brand-sage mt-1 mr-4" />
                  <div>
                    <p className="text-white font-medium">Emergency Line (24/7)</p>
                    <p className="text-gray-400">+1 (800) 555-0199</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-6 h-6 text-brand-sage mt-1 mr-4" />
                  <div>
                    <p className="text-white font-medium">Email Enquiries</p>
                    <p className="text-gray-400">SigSecSpec@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-brand-sage mt-1 mr-4" />
                  <div>
                    <p className="text-white font-medium">Headquarters</p>
                    <p className="text-gray-400">Sacramento - San Francisco<br/>California</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-brand-sage/10 p-8 rounded-xl border border-brand-sage/20">
              <h4 className="text-lg font-bold text-brand-sage mb-2">Did you know?</h4>
              <p className="text-gray-300 text-sm">
                Our average response time for emergency calls is under 8 minutes in metropolitan areas.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-brand-white rounded-xl p-8 shadow-2xl">
            {isSubmitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-brand-black mb-2">Request Received</h3>
                <p className="text-gray-600">Our security team will review your details and contact you securely within 24 hours.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-8 text-brand-sage font-medium hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-3 focus:border-brand-sage focus:ring-brand-sage outline-none transition-all text-black"
                    value={formState.name}
                    onChange={(e) => setFormState({...formState, name: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-3 focus:border-brand-sage focus:ring-brand-sage outline-none transition-all text-black"
                    value={formState.email}
                    onChange={(e) => setFormState({...formState, email: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700">Interested Service</label>
                  <select
                    id="service"
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-3 focus:border-brand-sage focus:ring-brand-sage outline-none transition-all text-black"
                    value={formState.service}
                    onChange={(e) => setFormState({...formState, service: e.target.value})}
                  >
                    <option>General Consultation</option>
                    <option>Manned Guarding</option>
                    <option>Executive Protection</option>
                    <option>Cyber Security</option>
                    <option>Event Security</option>
                    <option>CCTV Systems</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message (Confidential)</label>
                  <textarea
                    id="message"
                    rows={4}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-3 focus:border-brand-sage focus:ring-brand-sage outline-none transition-all text-black"
                    value={formState.message}
                    onChange={(e) => setFormState({...formState, message: e.target.value})}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-black text-white py-4 px-4 rounded-md font-bold hover:bg-brand-ebony transition-colors shadow-lg flex justify-center items-center"
                >
                  Send Secure Request <Send className="ml-2 w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;