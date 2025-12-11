"use client";

import { useState } from "react";
import { Clock, Target, Trophy, X } from "lucide-react";

interface BestOfThreeExplanationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onStartMatch: () => void;
}

export const BestOfThreeExplanationModal = ({ isVisible, onClose, onStartMatch }: BestOfThreeExplanationModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Trophy,
      title: "Welcome to Best-of-Three!",
      description: "We've upgraded the AI matches to be more exciting and strategic.",
      details: "Instead of single rounds, you now play complete matches against the AI.",
    },
    {
      icon: Target,
      title: "How It Works",
      description: "First to win 2 rounds wins the match!",
      details: "Each match consists of up to 3 rounds. Win 2 rounds and you win the entire match.",
    },
    {
      icon: Clock,
      title: "Resume Anytime",
      description: "Started a match but need to take a break?",
      details: "No problem! You can resume your match within 10 minutes of your last move.",
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onStartMatch();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onStartMatch();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 border border-primary/20 rounded-xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Icon className="text-primary" size={24} />
            <h3 className="text-xl font-bold">{currentStepData.title}</h3>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-ghost">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-lg font-medium mb-3">{currentStepData.description}</p>
          <p className="text-base-content/70">{currentStepData.details}</p>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? "bg-primary" : "bg-base-300"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button onClick={handlePrevious} className="btn btn-ghost flex-1">
              Previous
            </button>
          )}
          <button onClick={handleSkip} className="btn btn-outline flex-1">
            Skip
          </button>
          <button onClick={handleNext} className="btn btn-primary flex-1">
            {currentStep === steps.length - 1 ? "Start Playing!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};
