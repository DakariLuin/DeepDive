import React, { useState } from 'react';
import '../assets/Fonts.css';
import { validateUsername, validatePassword } from '../utils/validator';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import SimpleCardPage from '../components/SimpleCard';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function LoginPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [errorMessage, setErrorMessage] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
        if (errorMessage) setErrorMessage('');
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
        if (errorMessage) setErrorMessage('');
    };


    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');

        let isValid = true;

        if (!validateUsername(username)) {
            isValid = false;
        }
        if (!validatePassword(password)) {
            isValid = false;
        }
        if (!isValid) {
            setErrorMessage('Неверный логин или пароль');
            return;
        }


        setIsSubmitting(true);

        const data = {
            username: username,
            password: password,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/authorization`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Вход выполнен успешно!');
                if (result.access_token && result.refresh_token) {
                    localStorage.setItem('access_token', result.access_token);
                    localStorage.setItem('refresh_token', result.refresh_token);
                    event.preventDefault()
                    navigate('/');
                } else {
                    alert('Ошибка: Сервер не вернул токены авторизации.');
                    setErrorMessage('Произошла ошибка при входе.');
                }

            } else {
                setErrorMessage('Неверный логин или пароль');

                console.error('Ошибка от сервера:', result.message || response.statusText);
            }
        } catch (error) {
            console.error('Сетевая ошибка при попытке входа:', error);
            setErrorMessage('Произошла ошибка при попытке входа.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <SimpleCardPage cardTitle="Вход"> {/* Используем обертку SimpleCardPage с заголовком "Вход" */}

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="username">Логин:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Введите логин"
                        required
                        value={username}
                        onChange={handleUsernameChange}

                        className={errorMessage ? 'error' : ''}
                    />
                    {errorMessage && <div className="error-message">{errorMessage}</div>}
                </div>

                <div className="input-group">
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Введите пароль"
                        required
                        value={password}
                        onChange={handlePasswordChange}
                        className={errorMessage ? 'error' : ''}
                    />
                    {errorMessage && <div className="error-message">{errorMessage}</div>}
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Вход...' : 'Войти'}
                </button>
            </form>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                Ещё нет аккаунта? <Link to="/registration">Регистрация</Link>
            </div>

        </SimpleCardPage >
    );
}

export default LoginPage;