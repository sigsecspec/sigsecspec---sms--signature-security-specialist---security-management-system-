import React from 'react';
import { CheckCircle, Quote } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Company Overview Section */}
      <div className="bg-brand-black py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brand-sage/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-brand-sage font-semibold tracking-wide uppercase text-sm mb-2">Our Mission</h2>
              <h2 className="text-3xl font-display font-bold text-white sm:text-4xl mb-6">
                The Signature Difference
              </h2>
              <p className="text-lg text-brand-silver mb-6 leading-relaxed">
                To provide seamless, professional security services through innovative technology that connects qualified guards with clients, ensuring safety, accountability, and operational excellence in every mission.
              </p>
              <p className="text-lg text-brand-silver mb-8 leading-relaxed">
                Signature Security Specialist is an executive-level security company built on professionalism, discipline, and precision. We provide elite, highly trained guards supported by a fully digital management system.
              </p>
              
              <div className="space-y-4">
                {[
                  'Professionalism & Accountability',
                  'Client Satisfaction',
                  'Innovation & Technology',
                  'Safety First'
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-brand-sage mr-3" />
                    <span className="text-white font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0 relative">
              <div className="absolute inset-0 bg-brand-sage transform translate-x-4 translate-y-4 rounded-lg opacity-20"></div>
              <img 
                className="relative rounded-lg shadow-xl w-full object-cover h-[500px] grayscale hover:grayscale-0 transition-all duration-500"
                src="https://picsum.photos/id/1056/800/1000"
                alt="Security professionals meeting"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Message From The Owner Section */}
      <div className="bg-brand-ebony py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute left-0 bottom-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-brand-black border border-brand-800 rounded-full mb-10 shadow-lg">
             <Quote className="w-8 h-8 text-brand-sage" />
          </div>

          <h2 className="text-brand-sage font-bold tracking-widest uppercase mb-4 text-sm">Leadership Philosophy</h2>
          <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-12">A Message From The Owner</h3>

          <div className="space-y-8 text-lg md:text-xl text-gray-300 leading-relaxed font-light text-left md:text-center italic">
            <p className="text-white font-medium text-xl md:text-2xl not-italic">
              "At Signature Security Specialist, I run this company with a simple but unwavering standard: professionalism comes first—always.
            </p>
            
            <p>
              Our guards are masters of customer service. They are the first faces your customers see, the first voices they hear, and the first line of defense protecting your business. Because of that, I require them to greet every interaction with professionalism, warmth, and composure. Their uniforms must be clean, neat, and presentable at all times, because appearance reflects discipline—and discipline reflects safety.
            </p>

            <p>
              I hold my team to a higher standard because they represent not just your company, but mine as well. Their presence should offer reassurance, not intimidation. Their communication should guide, not escalate. Every situation—whether routine or unexpected—must be handled with confidence, respect, and clarity.
            </p>

            <p>
              While our guards are trained, strong, and capable, we do not operate by brute force. Physical intervention is the last resort, only when all other options have been exhausted. What defines Signature Security Specialist is our ability to talk, de‑escalate, and defuse situations before they ever become physical. True security is achieved through professionalism, communication, and maintaining control—not unnecessary aggression.
            </p>

            <p className="text-white font-bold text-xl md:text-2xl pt-4 not-italic">
              This is how I run my company. This is what we stand for.<br />
              This is Signature Security Specialist."
            </p>
          </div>

          <div className="mt-16 flex flex-col items-center">
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-brand-sage to-transparent mb-8"></div>
            <h4 className="font-display text-3xl font-bold text-white uppercase tracking-wider mb-2">Markeith White</h4>
            <p className="text-brand-silver text-sm uppercase tracking-[0.25em] font-medium">Owner & Chief of Staff</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;