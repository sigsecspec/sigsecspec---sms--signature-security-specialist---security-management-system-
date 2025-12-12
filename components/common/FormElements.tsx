
import React from 'react';
import { Upload } from 'lucide-react';

export const SectionTitle = ({ title, number }: { title: string; number: number }) => (
  <div className="flex items-center mb-6 pb-2 border-b border-theme-border">
    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-brand-sage text-white font-bold rounded-full mr-3 text-sm">
      {number}
    </div>
    <h3 className="text-xl font-display font-bold text-theme-text-primary">{title}</h3>
  </div>
);

export const InputLabel = ({ children }: { children?: React.ReactNode }) => (
  <label className="block text-sm font-medium text-theme-text-secondary mb-1">{children}</label>
);

export const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full bg-theme-bg-tertiary border border-theme-border rounded p-3 text-theme-text-primary focus:outline-none focus:border-brand-sage transition-colors placeholder-theme-text-muted ${props.className || ''}`}
  />
);

export const FileUpload = ({ label }: { label: string }) => (
  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-theme-border border-dashed rounded-md hover:border-brand-sage transition-colors group cursor-pointer bg-theme-bg-tertiary">
    <div className="space-y-1 text-center">
      <Upload className="mx-auto h-12 w-12 text-theme-text-muted group-hover:text-brand-sage transition-colors" />
      <div className="flex text-sm text-theme-text-secondary">
        <label className="relative cursor-pointer rounded-md font-medium text-brand-sage hover:text-brand-sage/80 focus-within:outline-none">
          <span>Upload {label}</span>
          <input type="file" className="sr-only" />
        </label>
      </div>
      <p className="text-xs text-theme-text-muted">PDF, JPG, PNG up to 10MB</p>
    </div>
  </div>
);
