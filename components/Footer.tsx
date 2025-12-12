import React from 'react';
import { ShieldCheck, Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { PageView } from '../types';

interface FooterProps {
  onNavigate: (page: PageView) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-brand-black text-white border-t border-brand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <ShieldCheck className="h-8 w-8 text-brand-sage mr-2" />
              <span className="font-display font-bold text-xl tracking-wider">SIGNATURE</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Protect with Purpose and Perform with Excellence.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
               <p className="flex items-center"><Mail className="w-4 h-4 mr-2 text-brand-sage" /> SigSecSpec@gmail.com</p>
               <p className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-brand-sage" /> Sacramento - San Francisco, CA</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => onNavigate('services')} className="hover:text-brand-sage transition-colors text-left">Armed & Unarmed Security</button></li>
              <li><button onClick={() => onNavigate('services')} className="hover:text-brand-sage transition-colors text-left">Executive Protection</button></li>
              <li><button onClick={() => onNavigate('services')} className="hover:text-brand-sage transition-colors text-left">Event Security</button></li>
              <li><button onClick={() => onNavigate('services')} className="hover:text-brand-sage transition-colors text-left">Corporate Security</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => onNavigate('about')} className="hover:text-brand-sage transition-colors text-left">About Us</button></li>
              <li><button onClick={() => onNavigate('how-it-works')} className="hover:text-brand-sage transition-colors text-left">How It Works</button></li>
              <li><button onClick={() => onNavigate('operations-application')} className="hover:text-brand-sage transition-colors text-left">Operations Careers</button></li>
              <li><button onClick={() => onNavigate('management-application')} className="hover:text-brand-sage transition-colors text-left">Management Careers</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Connect</h4>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
            <p className="text-xs text-gray-500">SIA Licensed & Insured</p>
          </div>
        </div>
        
        <div className="border-t border-brand-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Signature Security Specialist. All rights reserved.</p>
          <div className="mt-2 md:mt-0 space-x-4">
             <a href="#" className="hover:text-white">Terms of Service</a>
             <a href="#" className="hover:text-white">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;