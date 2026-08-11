import React, { useState, useCallback } from 'react';
import { sections, consentText } from './data/questions';
import {
  TextInput,
  TextArea,
  RadioGroup,
  CheckboxGroup,
  MatrixQuestion,
} from './components/FormField';
import ProgressBar from './components/ProgressBar';
import './App.css';

const logo = process.env.PUBLIC_URL + '/logo.png';

function App() {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = consent screen
  const [consent, setConsent] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = useCallback((questionId, value) => {
    setFormData((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  const isQuestionVisible = useCallback(
    (question) => {
      if (!question.conditionalOn) return true;
      const { questionId, value, includesValue } = question.conditionalOn;
      const answer = formData[questionId];
      if (value) return answer === value;
      if (includesValue && Array.isArray(answer)) return answer.includes(includesValue);
      return true;
    },
    [formData]
  );

  const validateSection = useCallback(
    (sectionIndex) => {
      const section = sections[sectionIndex];
      const newErrors = {};
      section.questions.forEach((q) => {
        if (!isQuestionVisible(q)) return;
        if (!q.required) return;
        const val = formData[q.id];
        if (q.type === 'checkbox') {
          if (!val || val.length === 0) newErrors[q.id] = 'Este campo es obligatorio';
        } else if (q.type === 'matrix') {
          const rows = q.rows || [];
          if (!val || Object.keys(val).length < rows.length)
            newErrors[q.id] = 'Por favor complete todas las filas';
        } else {
          if (!val || (typeof val === 'string' && val.trim() === ''))
            newErrors[q.id] = 'Este campo es obligatorio';
        }
      });
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData, isQuestionVisible]
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('https://server-encuesta-cierre-umd.onrender.com/api/respuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Error al enviar');
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error) {
      setSubmitError('Error al enviar la encuesta. Verifique que el servidor esté corriendo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === -1) {
      if (!consent) return;
      setCurrentStep(0);
      window.scrollTo(0, 0);
      return;
    }
    if (validateSection(currentStep)) {
      if (currentStep < sections.length - 1) {
        setCurrentStep((s) => s + 1);
        window.scrollTo(0, 0);
      } else {
        handleSubmit();
      }
      return;
    } else {
      const firstError = document.querySelector('.form-field.has-error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleBack = () => {
    if (currentStep > -1) {
      setCurrentStep((s) => s - 1);
      setErrors({});
      window.scrollTo(0, 0);
    }
  };

  const renderQuestion = (question) => {
    if (!isQuestionVisible(question)) return null;
    const hasError = errors[question.id];
    const wrapperClass = `form-field-wrapper ${hasError ? 'has-error' : ''}`;

    const props = {
      question,
      value: formData[question.id],
      onChange: handleChange,
    };

    let field;
    switch (question.type) {
      case 'text':
      case 'email':
      case 'number':
        field = <TextInput {...props} />;
        break;
      case 'textarea':
        field = <TextArea {...props} />;
        break;
      case 'radio':
        field = <RadioGroup {...props} />;
        break;
      case 'checkbox':
        field = <CheckboxGroup {...props} />;
        break;
      case 'matrix':
        field = <MatrixQuestion {...props} />;
        break;
      default:
        field = null;
    }

    return (
      <div key={question.id} className={wrapperClass}>
        {field}
        {hasError && <p className="error-message">{hasError}</p>}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="app">
        <div className="form-container">
          <div className="success-screen">
            <div className="success-icon">&#10003;</div>
            <h2>Encuesta enviada exitosamente</h2>
            <p>Gracias por completar la Encuesta de cierre para Micronegocios 2026-Q2.</p>
            <p>Sus respuestas han sido registradas.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setFormData({});
                setCurrentStep(-1);
                setConsent(false);
                setSubmitted(false);
              }}
            >
              Enviar otra respuesta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <img src={logo} alt="MD Micronegocios" className="header-logo" />
          <div className="header-text">
            <h1>Encuesta de Cierre</h1>
            <p>Micronegocios 2026-Q2</p>
          </div>
        </div>
      </header>

      <main className="main-content">
        {currentStep >= 0 && (
          <ProgressBar
            currentStep={currentStep}
            totalSteps={sections.length}
            sectionTitles={sections.map((s) => s.title)}
          />
        )}

        <div className="form-container">
          {currentStep === -1 ? (
            <div className="consent-section">
              <h2 className="section-title">Autorización de Datos Personales</h2>
              <div className="consent-box">
                <p>{consentText}</p>
              </div>
              <label className={`consent-check ${consent ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span className="custom-checkbox" />
                <span>
                  Doy mi consentimiento para el tratamiento de mis datos personales según lo
                  descrito anteriormente. <strong>(Obligatoria)</strong>
                </span>
              </label>
            </div>
          ) : (
            <div className="section">
              <h2 className="section-title">{sections[currentStep].title}</h2>
              {sections[currentStep].description && (
                <p className="section-description">{sections[currentStep].description}</p>
              )}
              <div className="questions-list">
                {sections[currentStep].questions.map(renderQuestion)}
              </div>
            </div>
          )}

          <div className="form-navigation">
            {currentStep > -1 && (
              <button className="btn btn-secondary" onClick={handleBack}>
                Anterior
              </button>
            )}
            <button
              className={`btn btn-primary ${currentStep === -1 && !consent ? 'disabled' : ''}`}
              onClick={handleNext}
              disabled={(currentStep === -1 && !consent) || submitting}
            >
              {submitting
                ? 'Enviando...'
                : currentStep === sections.length - 1
                  ? 'Enviar'
                  : 'Siguiente'}
            </button>
          </div>
          {submitError && <p className="error-message" style={{ textAlign: 'center', marginTop: '10px' }}>{submitError}</p>}
        </div>
      </main>

      <footer className="app-footer">
        <p>MD Micronegocios - UNIMINUTO &copy; 2026</p>
      </footer>
    </div>
  );
}

export default App;
