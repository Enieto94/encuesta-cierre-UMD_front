import React from 'react';

function QuestionLabel({ question }) {
  return (
    <label className="form-label">
      {question.number ? (
        <><span className="question-number">{question.number}.</span> </>
      ) : null}
      {question.text}
      {question.required && <span className="required">*</span>}
    </label>
  );
}

export function TextInput({ question, value, onChange }) {
  return (
    <div className="form-field">
      <QuestionLabel question={question} />
      {question.hint && <p className="form-hint">{question.hint}</p>}
      <input
        type={question.type === 'email' ? 'email' : question.type === 'number' ? 'text' : 'text'}
        className="form-input"
        value={value || ''}
        onChange={(e) => onChange(question.id, e.target.value)}
        placeholder={question.type === 'email' ? 'correo@ejemplo.com' : ''}
        inputMode={question.type === 'number' ? 'numeric' : undefined}
        pattern={question.type === 'number' ? '[0-9]*' : undefined}
      />
    </div>
  );
}

export function TextArea({ question, value, onChange }) {
  return (
    <div className="form-field">
      <QuestionLabel question={question} />
      {question.hint && <p className="form-hint">{question.hint}</p>}
      <textarea
        className="form-textarea"
        value={value || ''}
        onChange={(e) => onChange(question.id, e.target.value)}
        rows={4}
      />
    </div>
  );
}

export function RadioGroup({ question, value, onChange }) {
  return (
    <div className="form-field">
      <QuestionLabel question={question} />
      {question.hint && <p className="form-hint">{question.hint}</p>}
      <div className="options-group">
        {question.options.map((option) => (
          <label key={option} className={`option-label radio-label ${value === option ? 'selected' : ''}`}>
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(question.id, e.target.value)}
            />
            <span className="custom-radio" />
            <span className="option-text">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function CheckboxGroup({ question, value, onChange }) {
  const selected = value || [];

  const handleChange = (option) => {
    const newValue = selected.includes(option)
      ? selected.filter((v) => v !== option)
      : [...selected, option];
    onChange(question.id, newValue);
  };

  return (
    <div className="form-field">
      <QuestionLabel question={question} />
      {question.hint && <p className="form-hint">{question.hint}</p>}
      <div className="options-group">
        {question.options.map((option) => (
          <label key={option} className={`option-label checkbox-label ${selected.includes(option) ? 'selected' : ''}`}>
            <input
              type="checkbox"
              value={option}
              checked={selected.includes(option)}
              onChange={() => handleChange(option)}
            />
            <span className="custom-checkbox" />
            <span className="option-text">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function MatrixQuestion({ question, value, onChange }) {
  const selected = value || {};

  const handleChange = (row, col) => {
    onChange(question.id, { ...selected, [row]: col });
  };

  return (
    <div className="form-field">
      <QuestionLabel question={question} />
      {question.hint && <p className="form-hint">{question.hint}</p>}
      <div className="matrix-container">
        <div className="matrix-table">
          <div className="matrix-header">
            <div className="matrix-cell matrix-row-label" />
            {question.columns.map((col) => (
              <div key={col} className="matrix-cell matrix-col-header">
                {col}
              </div>
            ))}
          </div>
          {question.rows.map((row) => (
            <div key={row} className="matrix-row">
              <div className="matrix-cell matrix-row-label">{row}</div>
              {question.columns.map((col) => (
                <div key={col} className="matrix-cell">
                  <label className={`matrix-radio-label ${selected[row] === col ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`${question.id}-${row}`}
                      checked={selected[row] === col}
                      onChange={() => handleChange(row, col)}
                    />
                    <span className="custom-radio small" />
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
