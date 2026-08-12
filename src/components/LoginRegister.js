import React, { useState } from 'react';

const logo = process.env.PUBLIC_URL + '/logo.png';

export default function LoginRegister({ onAuth }) {
    const [mode, setMode] = useState('login'); // login | register
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const url = mode === 'login'
            ? 'https://server-encuesta-cierre-umd.onrender.com/api/auth/login'
            : 'https://server-encuesta-cierre-umd.onrender.com/api/auth/register';

        const body = mode === 'login'
            ? { email, password }
            : { email, password, nombre };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Error del servidor');
                return;
            }

            onAuth(data.token, data.user);
        } catch {
            setError('No se pudo conectar con el servidor. Verifique que esté corriendo.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError(null);
    };

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
                <div className="form-container login-container">
                    <h2 className="section-title">
                        {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h2>

                    <form onSubmit={handleSubmit} className="login-form">
                        {mode === 'register' && (
                            <div className="login-field">
                                <label className="form-label">Nombre completo</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Ingrese su nombre"
                                    required
                                />
                            </div>
                        )}

                        <div className="login-field">
                            <label className="form-label">Correo electrónico</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="correo@ejemplo.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="login-field">
                            <label className="form-label">Contraseña</label>
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingrese su contraseña"
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                required
                            />
                        </div>

                        {error && (
                            <p className="error-message" style={{ textAlign: 'center' }}>{error}</p>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary login-btn"
                            disabled={loading}
                        >
                            {loading
                                ? (mode === 'login' ? 'Ingresando...' : 'Registrando...')
                                : (mode === 'login' ? 'Ingresar' : 'Registrarse')}
                        </button>
                    </form>

                    <div className="auth-switch">
                        {mode === 'login' ? (
                            <p>¿No tiene cuenta? <button className="btn-link" onClick={switchMode}>Crear cuenta</button></p>
                        ) : (
                            <p>¿Ya tiene cuenta? <button className="btn-link" onClick={switchMode}>Iniciar sesión</button></p>
                        )}
                    </div>
                </div>
            </main>

            <footer className="app-footer">
                <p>MD Micronegocios - UNIMINUTO &copy; 2026</p>
            </footer>
        </div>
    );
}
