
import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle, Camera, Check, Shield, User, AlertCircle
} from 'lucide-react';

interface Guard {
  id: string;
  name: string;
  verified: boolean;
}

interface SpotCheckFormProps {
  checkType: 'First' | 'Mid' | 'Last';
  guards: Guard[];
  onComplete: () => void;
  onBack: () => void;
}

const SpotCheckForm: React.FC<SpotCheckFormProps> = ({ checkType, guards, onComplete, onBack }) => {
  const [currentGuardIndex, setCurrentGuardIndex] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [photos, setPhotos] = useState<Record<string, boolean>>({}); // Track photo uploads per guard

  const currentGuard = guards[currentGuardIndex];

  const handleCheck = (guardId: string, field: string) => {
      setFormData((prev: any) => ({
          ...prev,
          [guardId]: {
              ...prev[guardId],
              [field]: !prev[guardId]?.[field]
          }
      }));
  };

  const handlePhotoUpload = (guardId: string) => {
      // Simulate photo upload
      setPhotos(prev => ({ ...prev, [guardId]: true }));
  };

  const handleNext = () => {
      // Validation: Must have photo and checklist
      const checks = formData[currentGuard.id];
      if (!photos[currentGuard.id] || !checks?.['Present'] || !checks?.['Uniform'] || !checks?.['Gear']) {
          alert("Please complete the verification checklist and upload a photo.");
          return;
      }

      if (currentGuardIndex < guards.length - 1) {
          setCurrentGuardIndex(prev => prev + 1);
      } else {
          setIsCompleted(true);
      }
  };

  const handleFinish = () => {
      onComplete();
  };

  if (isCompleted) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up">
              <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">{checkType} Spot Check Complete</h2>
              <p className="text-gray-400 mb-8">All guards have been verified and logged.</p>
              <button onClick={handleFinish} className="bg-brand-sage text-black font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-brand-sage/90 transition-transform hover:scale-105">
                  Return to Dashboard
              </button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-brand-black">
        {/* Header */}
        <div className="p-4 border-b border-brand-800 bg-brand-ebony flex items-center justify-between">
            <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center text-sm transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Cancel
            </button>
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">{checkType} Check • Guard {currentGuardIndex + 1}/{guards.length}</h2>
            <div className="w-16"></div> 
        </div>

        {/* Guard Card */}
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
            <div className="bg-brand-ebony border border-brand-800 rounded-xl p-6 shadow-xl animate-fade-in-up">
                
                <div className="flex items-center mb-6 border-b border-brand-800 pb-4">
                    <div className="w-14 h-14 bg-brand-black rounded-full flex items-center justify-center text-gray-300 font-bold mr-4 border-2 border-brand-700 text-lg">
                        {currentGuard.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{currentGuard.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center"><Shield className="w-3 h-3 mr-1 text-brand-sage" /> Active Guard</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-2">Compliance Checklist</h4>
                    
                    {['Present at Location', 'Proper Uniform', 'Required Gear', 'Performing Duties'].map((fullLabel) => {
                        const key = fullLabel.split(' ')[0] === 'Present' ? 'Present' : fullLabel.split(' ')[1]; // Simplistic key mapping
                        return (
                            <label key={fullLabel} className="flex items-center justify-between p-3 rounded-lg bg-brand-black/50 border border-brand-800 cursor-pointer hover:border-brand-600 transition-colors">
                                <span className="text-gray-300 text-sm">{fullLabel}</span>
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${formData[currentGuard.id]?.[key] ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                                    <Check className="w-4 h-4 text-black" />
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={!!formData[currentGuard.id]?.[key]} 
                                    onChange={() => handleCheck(currentGuard.id, key)}
                                />
                            </label>
                        );
                    })}
                </div>

                <div className="mb-6">
                    <button 
                        onClick={() => handlePhotoUpload(currentGuard.id)}
                        className={`w-full py-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                            photos[currentGuard.id] 
                            ? 'border-green-500 bg-green-900/10 text-green-400' 
                            : 'border-brand-700 text-blue-400 hover:border-blue-500 hover:text-blue-300'
                        }`}
                    >
                        {photos[currentGuard.id] ? (
                            <>
                                <CheckCircle className="w-8 h-8 mb-2" />
                                <span className="font-bold text-sm">Photo Verified</span>
                            </>
                        ) : (
                            <>
                                <Camera className="w-8 h-8 mb-2" />
                                <span className="font-bold text-sm">Upload Guard Photo</span>
                                <span className="text-xs text-gray-500 mt-1">Required: Full body, uniform visible</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Observations (Optional)</label>
                    <textarea 
                        className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white text-sm focus:border-brand-sage outline-none transition-colors"
                        rows={3}
                        placeholder="Note any issues, corrections made, or commendations..."
                        onChange={(e) => handleCheck(currentGuard.id, 'notes')}
                    />
                </div>

            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-brand-800 bg-brand-ebony flex justify-center">
            <button 
                onClick={handleNext}
                className="w-full max-w-lg bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1"
            >
                {currentGuardIndex < guards.length - 1 ? "Verify Next Guard" : "Finish Spot Check"}
            </button>
        </div>
    </div>
  );
};

export default SpotCheckForm;
