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
import LoginRegister from './components/LoginRegister';
import AdminView from './components/AdminView';
import StudentView from './components/StudentView';
import './App.css';

const logo = process.env.PUBLIC_URL + '/logo.png';

function App() {
  // Autenticación
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Vista para usuarios normales: form | student
  const [userView, setUserView] = useState('form');

  // Estado del formulario
  const [currentStep, setCurrentStep] = useState(-1);
  const [consent, setConsent] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleAuth = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* ignorar */ }
    }
    setToken(null);
    setUser(null);
    setUserView('form');
    resetForm();
  }, [token]);

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
      const conditions = Array.isArray(question.conditionalOn)
        ? question.conditionalOn
        : [question.conditionalOn];
      return conditions.every(({ questionId, value, includesValue }) => {
        const answer = formData[questionId];
        if (value !== undefined) return answer === value;
        if (includesValue && Array.isArray(answer)) return answer.includes(includesValue);
        return true;
      });
    },
    [formData]
  );

  const validateSection = useCallback(
    (sectionIndex) => {
      const section = sections[sectionIndex];
      const newErrors = {};
      if (!section.questions || section.questions.length === 0) {
        setErrors({});
        return true;
      }
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

  const cleanFormData = useCallback(() => {
    const cleaned = { ...formData };
    sections.forEach((section) => {
      section.questions.forEach((q) => {
        if (!isQuestionVisible(q)) {
          cleaned[q.id] = null;
        }
      });
    });
    return cleaned;
  }, [formData, isQuestionVisible]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const data = cleanFormData();
      const response = await fetch('/api/respuestas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) throw new Error('Error al enviar');
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch {
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
    } else {
      const firstError = document.querySelector('.form-field-wrapper.has-error');
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

  function resetForm() {
    setFormData({});
    setCurrentStep(-1);
    setConsent(false);
    setSubmitted(false);
    setErrors({});
    setSubmitError(null);
  }

  const renderQuestion = (question) => {
    if (!isQuestionVisible(question)) return null;
    const hasError = errors[question.id];
    const wrapperClass = `form-field-wrapper ${hasError ? 'has-error' : ''}`;
    const props = { question, value: formData[question.id], onChange: handleChange };

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

  // ======= SIN AUTENTICACIÓN → LOGIN/REGISTRO =======
  if (!token || !user) {
    return <LoginRegister onAuth={handleAuth} />;
  }

  // ======= ADMIN → PANEL DE ADMINISTRACIÓN =======
  if (user.es_admin) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <img src={logo} alt="MD Micronegocios" className="header-logo" />
            <div className="header-text">
              <h1>Panel de Administración</h1>
              <p>{user.nombre}</p>
            </div>
          </div>
        </header>

        <main className="main-content admin-content">
          <div className="form-container">
            <div className="admin-topbar">
              <span className="user-info">{user.email}</span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
            <AdminView token={token} onLogout={handleLogout} />
          </div>
        </main>

        <footer className="app-footer">
          <p>MD Micronegocios - UNIMINUTO &copy; 2026</p>
        </footer>
      </div>
    );
  }

  // ======= USUARIO NORMAL — VISTA ESTUDIANTE =======
  if (userView === 'student') {
    return (
      <StudentView onBack={() => setUserView('form')} onLogout={handleLogout} user={user} />
    );
  }

  // ======= USUARIO NORMAL — FORMULARIO =======

  const headerRight = (
    <div className="header-actions">
      <button className="header-link" onClick={() => setUserView('student')}>
        Mis respuestas
      </button>
      <button className="header-link" onClick={handleLogout}>
        Salir
      </button>
    </div>
  );

  if (submitted) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <img src={logo} alt="MD Micronegocios" className="header-logo" />
            <div className="header-text">
              <h1>Encuesta de Cierre</h1>
              <p>Micronegocios 2026-Q2</p>
            </div>
            {headerRight}
          </div>
        </header>

        <main className="main-content">
          <div className="form-container">
            <div className="success-screen">
              <div className="success-icon">&#10003;</div>
              <h2>Encuesta enviada exitosamente</h2>
              <p>Gracias por completar la Encuesta de cierre para Micronegocios 2026-Q2.</p>
              <p>Sus respuestas han sido registradas.</p>
              <div className="success-actions">
                <button className="btn btn-primary" onClick={resetForm}>
                  Enviar otra respuesta
                </button>
                <button className="btn btn-secondary" onClick={() => setUserView('student')}>
                  Ver mis respuestas
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <p>MD Micronegocios - UNIMINUTO &copy; 2026</p>
        </footer>
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
          {headerRight}
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
              {sections[currentStep].questions.length === 0 ? (
                <p className="divider-text">
                  Presione <strong>Siguiente</strong> para continuar con las preguntas del módulo.
                </p>
              ) : (
                <div className="questions-list">
                  {sections[currentStep].questions.map(renderQuestion)}
                </div>
              )}
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
          {submitError && (
            <p className="error-message" style={{ textAlign: 'center', marginTop: '10px' }}>
              {submitError}
            </p>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>MD Micronegocios - UNIMINUTO &copy; 2026</p>
      </footer>
    </div>
  );
}

export default App;
