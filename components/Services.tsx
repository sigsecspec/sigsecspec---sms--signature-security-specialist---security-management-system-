import React from 'react';
import { Shield, Lock, Eye, Server, UserCheck, Radio } from 'lucide-react';
import { ServiceItem } from '../types';

const Services: React.FC = () => {
  const services: ServiceItem[] = [
    {
      id: 'manned-guarding',
      title: 'Manned Guarding',
      description: 'Highly trained, licensed security personnel for static and mobile patrols. Our guards are selected for their professionalism and conflict resolution skills.',
      icon: <UserCheck className="w-8 h-8 text-brand-sage" />,
      features: ['Access Control', 'Perimeter Patrols', 'Incident Response']
    },
    {
      id: 'executive-protection',
      title: 'Executive Protection',
      description: 'Discreet and effective close protection services for high-net-worth individuals, executives, and VIPs traveling or at home.',
      icon: <Shield className="w-8 h-8 text-brand-sage" />,
      features: ['Risk Assessment', 'Secure Transportation', 'Close Protection Teams']
    },
    {
      id: 'cyber-security',
      title: 'Cyber Security',
      description: 'Comprehensive digital protection strategies to safeguard your business assets, intellectual property, and personal data from modern threats.',
      icon: <Server className="w-8 h-8 text-brand-sage" />,
      features: ['Network Audits', 'Penetration Testing', 'Employee Training']
    },
    {
      id: 'event-security',
      title: 'Event Security',
      description: 'Scalable security solutions for events of all sizes. We ensure crowd safety and order while maintaining a welcoming atmosphere for guests.',
      icon: <Radio className="w-8 h-8 text-brand-sage" />,
      features: ['Crowd Management', 'VIP Area Control', 'Emergency Planning']
    },
    {
      id: 'surveillance',
      title: 'CCTV & Monitoring',
      description: 'State-of-the-art surveillance installation and 24/7 remote monitoring services to keep eyes on your property when you cannot.',
      icon: <Eye className="w-8 h-8 text-brand-sage" />,
      features: ['HD Camera Systems', 'Motion Detection', 'Remote Access']
    },
    {
      id: 'residential',
      title: 'Residential Security',
      description: 'Tailored home security packages ensuring peace of mind for you and your family. From alarm response to dedicated residential security teams.',
      icon: <Lock className="w-8 h-8 text-brand-sage" />,
      features: ['Alarm Response', 'Key Holding', 'Vacant Property Checks']
    },
  ];

  return (
    <div className="bg-brand-black py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-brand-sage font-semibold tracking-wide uppercase text-sm">Our Expertise</h2>
          <h3 className="mt-2 text-3xl leading-8 font-display font-bold tracking-tight text-white sm:text-4xl">
            Service Capabilities
          </h3>
          <p className="mt-4 max-w-2xl text-xl text-brand-silver mx-auto">
            We don't just provide security; we provide certainty. Choose the signature standard for your protection needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div 
              key={service.id} 
              className="bg-brand-ebony rounded-xl p-8 border border-white/5 hover:border-brand-sage/50 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-sage/10 group"
            >
              <div className="bg-brand-black w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                {service.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-3 group-hover:text-brand-sage transition-colors">
                {service.title}
              </h4>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {service.description}
              </p>
              <ul className="space-y-2 border-t border-white/5 pt-4">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 bg-brand-sage rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;