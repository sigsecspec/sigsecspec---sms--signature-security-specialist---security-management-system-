import React, { useState } from 'react';
import { Shield, Briefcase, UserCheck, ChevronRight } from 'lucide-react';

type Tab = 'guard' | 'client' | 'supervisor';

const HowItWorks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('client');

  const steps = {
    guard: [
      { title: 'Application', desc: 'Apply online with personal details and guard card upload.' },
      { title: 'Training', desc: 'Complete specialized training modules (bar security, retail, standing post).' },
      { title: 'Activation', desc: 'Once approved by the training officer, you become active.' },
      { title: 'Mission Access', desc: 'View and accept available missions matching your training.' },
      { title: 'Payment', desc: 'Complete missions, check out via GPS, and receive payment.' }
    ],
    client: [
      { title: 'Application', desc: 'Apply online detailing your business and security needs.' },
      { title: 'Onboarding', desc: 'Complete onboarding with company rules and system training.' },
      { title: 'Contract Creation', desc: 'Create new contracts using the budget calculator.' },
      { title: 'Mission Posting', desc: 'Post missions and allow our system to assign qualified guards.' },
      { title: 'Management', desc: 'Monitor missions in real-time and handle billing easily.' }
    ],
    supervisor: [
      { title: 'Internal Application', desc: 'Existing guards apply for supervisor positions.' },
      { title: 'Advanced Training', desc: 'Complete supervisor-specific training modules.' },
      { title: 'Spot Checks', desc: 'Receive assignments to perform quality assurance spot checks.' },
      { title: 'Training Management', desc: 'Review and approve guard training quizzes.' },
      { title: 'Reporting', desc: 'Submit detailed reports on guard performance.' }
    ]
  };

  return (
    <div className="bg-brand-ebony py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-brand-sage font-semibold tracking-wide uppercase text-sm">Process</h2>
          <h3 className="mt-2 text-3xl leading-8 font-display font-bold tracking-tight text-white sm:text-4xl">
            How It Works
          </h3>
        </div>

        <div className="flex flex-col md:flex-row justify-center mb-12 space-y-4 md:space-y-0 md:space-x-4">
          <button
            onClick={() => setActiveTab('client')}
            className={`px-6 py-3 rounded-full flex items-center justify-center font-bold transition-all ${
              activeTab === 'client' ? 'bg-brand-sage text-white shadow-lg' : 'bg-brand-black text-gray-400 border border-brand-700 hover:text-white'
            }`}
          >
            <Briefcase className="w-5 h-5 mr-2" /> For Clients
          </button>
          <button
            onClick={() => setActiveTab('guard')}
            className={`px-6 py-3 rounded-full flex items-center justify-center font-bold transition-all ${
              activeTab === 'guard' ? 'bg-brand-sage text-white shadow-lg' : 'bg-brand-black text-gray-400 border border-brand-700 hover:text-white'
            }`}
          >
            <Shield className="w-5 h-5 mr-2" /> For Guards
          </button>
          <button
            onClick={() => setActiveTab('supervisor')}
            className={`px-6 py-3 rounded-full flex items-center justify-center font-bold transition-all ${
              activeTab === 'supervisor' ? 'bg-brand-sage text-white shadow-lg' : 'bg-brand-black text-gray-400 border border-brand-700 hover:text-white'
            }`}
          >
            <UserCheck className="w-5 h-5 mr-2" /> For Supervisors
          </button>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-brand-700 -z-10"></div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps[activeTab].map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-black border-2 border-brand-sage flex items-center justify-center text-xl font-display font-bold text-white mb-4 z-10 shadow-xl">
                  {idx + 1}
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                <p className="text-sm text-gray-400">{step.desc}</p>
                {idx < steps[activeTab].length - 1 && (
                  <div className="md:hidden mt-4 text-brand-700">
                    <ChevronRight />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;