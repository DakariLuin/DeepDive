import React, { useState } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function TokenChecker() {
    const [token, setToken] = useState('');
    const [result, setResult] = useState('');

    const checkToken = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/protected`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token })
            });

            if (response.ok) {
                const text = await response.text();
                setResult(text);
            } else {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    setResult('Токен недействителен, и refresh_token отсутствует.');
                    return;
                }

                const refreshResponse = await fetch(`${API_BASE_URL}/refreshToken`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    const newAccessToken = data.access_token;
                    setToken(newAccessToken);
                    localStorage.setItem('access_token', newAccessToken);

                    const retryResponse = await fetch(`${API_BASE_URL}/protected`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: newAccessToken })
                    });

                    const retryText = await retryResponse.text();
                    setResult(retryText);
                } else {
                    const errText = await refreshResponse.text();
                    setResult('Ошибка refresh: ' + errText);
                }
            }
        } catch (error) {
            setResult('Ошибка при проверке токена: ' + error.message);
        }
    };

    return (
        <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
            <h2>Проверка токена доступа</h2>
            <input
                type="text"
                placeholder="Введите access token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            />
            <button onClick={checkToken} style={{ padding: '0.5rem 1rem' }}>
                Проверить
            </button>
            <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
                {result}
            </pre>
        </div>
    );
}

export default TokenChecker;