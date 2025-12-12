
import React from 'react';
import { Smartphone, Award, Eye, Layout, Medal, CheckCircle } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      title: 'Technology Innovation',
      description: 'Mobile-first platform with real-time mission scheduling, GPS verification, and instant incident reporting.',
      icon: <Smartphone className="w-6 h-6 text-brand-sage" />
    },
    {
      title: 'Training Integration',
      description: 'Our proprietary training modules ensure every guard is certified for their specific post requirements before deployment.',
      icon: <Award className="w-6 h-6 text-brand-sage" />
    },
    {
      title: 'Total Transparency',
      description: 'Clients get complete visibility into guard performance, patrol logs, and site activity in real-time.',
      icon: <Eye className="w-6 h-6 text-brand-sage" />
    },
    {
      title: 'Flexible Staffing',
      description: 'From seasonal event staff to permanent standing guards, our roster adapts to your security needs.',
      icon: <Layout className="w-6 h-6 text-brand-sage" />
    },
    {
      title: 'Elite Recognition',
      description: 'We incentivize excellence through our "Hall of Fame" and performance-based ranking system.',
      icon: <Medal className="w-6 h-6 text-brand-sage" />
    },
    {
      title: 'Triple Verification',
      description: 'Quality assurance through automated checks, supervisor spot-checks, and client feedback loops.',
      icon: <CheckCircle className="w-6 h-6 text-brand-sage" />
    }
  ];

  return (
    <div className="bg-brand-black py-24 px-4 sm:px-6 lg:px-8 border-b border-brand-800 relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-brand-sage font-semibold tracking-wide uppercase text-sm">Why Choose Signature</h2>
          <h3 className="mt-2 text-3xl leading-8 font-display font-bold tracking-tight text-white sm:text-4xl">
            The Signature Standard
          </h3>
          <p className="mt-4 max-w-2xl text-xl text-brand-silver mx-auto font-light">
            We don't just supply guards; we provide a comprehensive security ecosystem designed for safety, accountability, and operational excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-brand-ebony/60 backdrop-blur-md p-8 rounded-2xl border border-white/5 hover:border-brand-sage/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="w-14 h-14 bg-brand-black rounded-xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-brand-sage/50 transition-colors shadow-lg">
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-3 group-hover:text-brand-sage transition-colors">{feature.title}</h4>
              <p className="text-gray-400 leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
