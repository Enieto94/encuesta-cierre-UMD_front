import React from 'react';

export default function ProgressBar({ currentStep, totalSteps, sectionTitles }) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="progress-container">
      <div className="progress-info">
        <span className="progress-step">
          Sección {currentStep + 1} de {totalSteps}
        </span>
        <span className="progress-percent">{Math.round(progress)}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="progress-section-name">{sectionTitles[currentStep]}</p>
    </div>
  );
}
