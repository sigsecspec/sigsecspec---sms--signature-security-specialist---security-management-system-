
import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Jenkins",
      role: "Event Director, Bay Area Gala",
      text: "Signature Security Specialist provided impeccable service for our high-profile charity gala. Their guards were professional, well-dressed, and handled our VIP guests with absolute grace. They truly set the standard.",
      rating: 5
    },
    {
      id: 2,
      name: "Michael Ross",
      role: "Project Manager, Urban Construction",
      text: "We switched to Signature for our construction site patrols after theft issues with another vendor. The real-time reporting technology they use gives us complete peace of mind. Not a single incident since.",
      rating: 5
    },
    {
      id: 3,
      name: "Elena Rodriguez",
      role: "General Manager, The Grand Hotel",
      text: "Markeith and his team are true professionals. The level of discipline and de-escalation skills their officers possess is unlike any other security firm we've utilized in the past.",
      rating: 5
    }
  ];

  return (
    <div className="bg-brand-ebony py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-sage rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-brand-sage font-semibold tracking-wide uppercase text-sm">Client Success</h2>
          <h3 className="mt-2 text-3xl leading-8 font-display font-bold tracking-tight text-white sm:text-4xl">
            Trusted by the Best
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-brand-black/50 backdrop-blur-sm p-8 rounded-xl border border-white/5 hover:border-brand-sage/30 transition-all duration-300 relative group">
              <div className="absolute -top-4 -left-4 bg-brand-sage text-black p-3 rounded-full shadow-lg">
                <Quote size={20} fill="currentColor" />
              </div>
              
              <div className="flex mb-4 text-brand-sage">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" className="mr-1" />
                ))}
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">
                "{t.text}"
              </p>
              
              <div className="border-t border-white/10 pt-4">
                <p className="text-white font-bold">{t.name}</p>
                <p className="text-brand-silver text-xs uppercase tracking-wider mt-1">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
