import React, { useState, useEffect } from 'react';
import { sections, questionToColumn } from '../data/questions';

const allQuestions = [];
sections.forEach((section) => {
    section.questions.forEach((q) => allQuestions.push(q));
});

function formatValue(val) {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed.join(', ');
            if (typeof parsed === 'object') {
                return Object.entries(parsed)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('; ');
            }
            return String(parsed);
        } catch {
            return val;
        }
    }
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object') {
        return Object.entries(val)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ');
    }
    return String(val);
}

const PAGE_SIZE = 25;

export default function AdminView({ token, onLogout }) {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetch('/api/admin/respuestas', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.status === 401 || res.status === 403) {
                    onLogout();
                    throw new Error('Sesión expirada');
                }
                if (!res.ok) throw new Error('Error del servidor');
                return res.json();
            })
            .then((data) => setResponses(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [token, onLogout]);

    const handleSelect = async (id) => {
        setSelectedId(id);
        setDetail(null);
        setDetailError(null);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/admin/respuestas/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401 || res.status === 403) {
                onLogout();
                return;
            }
            if (!res.ok) throw new Error('Error al obtener el detalle');
            const data = await res.json();
            setDetail(data);
        } catch (err) {
            setDetailError(err.message);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleBack = () => {
        setSelectedId(null);
        setDetail(null);
        setDetailError(null);
    };

    const term = search.trim().toLowerCase();
    const filtered = term
        ? responses.filter((resp) => {
            const nrc = String(resp.nrc ?? '').toLowerCase();
            const facilitador = String(resp.nombre_facilitador ?? '').toLowerCase();
            return nrc.includes(term) || facilitador.includes(term);
        })
        : responses;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    if (selectedId !== null) {
        return (
            <div className="admin-panel">
                <button className="btn btn-secondary btn-sm" onClick={handleBack}>
                    ← Volver al inicio
                </button>

                <h2 className="section-title" style={{ marginTop: '1rem' }}>
                    Detalle de Respuesta #{selectedId}
                </h2>

                {detailLoading && <p className="loading-text">Cargando detalle...</p>}
                {detailError && (
                    <p className="error-message" style={{ textAlign: 'center' }}>{detailError}</p>
                )}

                {detail && (
                    <>
                        <div className="detail-meta">
                            <p><strong>NRC:</strong> {detail.nrc || '—'}</p>
                            <p><strong>Facilitador:</strong> {detail.nombre_facilitador || '—'}</p>
                            <p><strong>Fecha de envío:</strong> {detail.fecha_envio ? new Date(detail.fecha_envio).toLocaleString('es-CO') : '—'}</p>
                        </div>

                        <div className="admin-table-wrapper">
                            <table className="response-table">
                                <thead>
                                    <tr>
                                        <th>Pregunta</th>
                                        <th>Respuesta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allQuestions.map((q) => {
                                        const colName = questionToColumn[q.id];
                                        if (!colName) return null;
                                        const val = detail[colName];
                                        if (val === null || val === undefined || val === '') return null;
                                        return (
                                            <tr key={q.id}>
                                                <td className="question-cell">
                                                    {q.number ? `${q.number}. ` : ''}
                                                    {q.text}
                                                </td>
                                                <td className="answer-cell">{formatValue(val)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="admin-panel">
            <h2 className="section-title">Respuestas de Estudiantes</h2>

            {loading && <p className="loading-text">Cargando respuestas...</p>}
            {error && <p className="error-message" style={{ textAlign: 'center' }}>{error}</p>}

            {!loading && !error && responses.length === 0 && (
                <div className="empty-state">
                    <p>No hay respuestas registradas.</p>
                </div>
            )}

            {!loading && responses.length > 0 && (
                <>
                    <div className="search-form">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar por NRC o nombre del facilitador..."
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>

                    <p className="results-count">
                        {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
                        {term ? ` para "${search.trim()}"` : ''}
                    </p>

                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <p>No se encontraron respuestas que coincidan con la búsqueda.</p>
                        </div>
                    ) : (
                        <>
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre del Facilitador</th>
                                            <th>NRC</th>
                                            <th>Fecha de Envío</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageRows.map((resp) => (
                                            <tr
                                                key={resp.id}
                                                onClick={() => handleSelect(resp.id)}
                                                className="admin-row-clickable"
                                            >
                                                <td>{resp.id}</td>
                                                <td>{resp.nombre_facilitador}</td>
                                                <td>{resp.nrc}</td>
                                                <td>{new Date(resp.fecha_envio).toLocaleString('es-CO')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        ← Anterior
                                    </button>
                                    <span className="pagination-info">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Siguiente →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
