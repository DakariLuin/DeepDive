import React, { useState } from 'react';
import '../assets/Fonts.css';
import { validateUsername, validatePassword } from '../utils/validator';
import { Link } from 'react-router-dom';

import SimpleCardPage from '../components/SimpleCard';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function RegistrationPage() {
    const navigate = useNavigate();
    const loginAfterRegistration = async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/authorization`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                if (result.access_token && result.refresh_token) {
                    localStorage.setItem('access_token', result.access_token);
                    localStorage.setItem('refresh_token', result.refresh_token);
                    navigate('/');
                }
            } else {
                alert('Регистрация прошла, но авторизация не удалась: ' + (result.message || response.statusText));
            }
        } catch (err) {
            console.error('Ошибка авторизации после регистрации:', err);
            alert('Регистрация прошла, но произошла ошибка при входе.');
        }
    };

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
        if (usernameError) setUsernameError('');
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
        if (passwordError) setPasswordError('');
    };

    const handleConfirmPasswordChange = (event) => {
        setConfirmPassword(event.target.value);
        if (confirmPasswordError) setConfirmPasswordError('');
    };


    const handleSubmit = async (event) => {
        event.preventDefault();
        setUsernameError('');
        setPasswordError('');
        setConfirmPasswordError('');

        let isValid = true;

        if (password !== confirmPassword) {
            setConfirmPasswordError('Пароли не совпадают');
            isValid = false;
        }

        if (!validateUsername(username)) {
            setUsernameError('Неменее 3 символов');
            isValid = false;
        }

        if (!validatePassword(password)) {
            setPasswordError('Пароль не менее 8 символов и содержащий цифры');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        setIsSubmitting(true);

        const data = {
            username: username,
            password: password,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/createUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Пользователь успешно создан!');
                setUsername('');
                setPassword('');
                setConfirmPassword('');

                await loginAfterRegistration(data.username, data.password);
            } else {
                alert('Ошибка: ' + (result.message || response.statusText));
            }
        } catch (error) {
            console.error('Ошибка при отправке данных:', error);
            alert('Произошла ошибка при создании пользователя. Пожалуйста, попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <SimpleCardPage cardTitle="Регистрация">
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="username">Логин:</label>
                    <input
                        type="text" id="username" name="username" placeholder="Введите логин" required
                        value={username} onChange={handleUsernameChange}
                        className={usernameError ? 'error' : ''}
                    />
                    {usernameError && <div className="error-message">{usernameError}</div>}
                </div>
                <div className="input-group">
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password" id="password" name="password" placeholder="Введите пароль" required
                        value={password} onChange={handlePasswordChange}
                        className={passwordError ? 'error' : ''}
                    />
                    {passwordError && <div className="error-message">{passwordError}</div>}
                </div>
                <div className="input-group">
                    <label htmlFor="confirm-password">Повторите пароль:</label>
                    <input
                        type="password" id="confirm-password" name="confirm-password" placeholder="Введите пароль" required
                        value={confirmPassword} onChange={handleConfirmPasswordChange}
                        className={confirmPasswordError ? 'error' : ''}
                    />
                    {confirmPasswordError && <div className="error-message">{confirmPasswordError}</div>}
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Отправка...' : 'Начать'}
                </button>
            </form>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                Уже есть аккаунт? <Link to="/authorization">Войти</Link>
            </div>
        </SimpleCardPage>
    );
}

export default RegistrationPage;