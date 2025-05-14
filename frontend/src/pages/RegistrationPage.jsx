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

    // Состояние для полей ввода
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Состояние для отображения ошибок
    const [usernameError, setUsernameError] = useState(''); // Сообщение об ошибке или пустая строка
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    // Состояние для кнопки (например, чтобы отключить ее во время отправки)
    const [isSubmitting, setIsSubmitting] = useState(false);


    // Обработчик изменения для поля Логин
    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
        // Очищаем ошибку при изменении поля (опционально, но удобно)
        if (usernameError) setUsernameError('');
    };

    // Обработчик изменения для поля Пароль
    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
        if (passwordError) setPasswordError('');
    };

    // Обработчик изменения для поля Повторите пароль
    const handleConfirmPasswordChange = (event) => {
        setConfirmPassword(event.target.value);
        if (confirmPasswordError) setConfirmPasswordError('');
    };


    // Обработчик отправки формы
    const handleSubmit = async (event) => {
        event.preventDefault(); // Предотвращаем стандартную отправку формы браузером

        // Сбрасываем все предыдущие ошибки перед новой валидацией
        setUsernameError('');
        setPasswordError('');
        setConfirmPasswordError('');

        let isValid = true; // Флаг общей валидации

        // --- Валидация ---
        // 1. Пароли совпадают?
        if (password !== confirmPassword) {
            setConfirmPasswordError('Пароли не совпадают');
            isValid = false;
        }

        // 2. Валидация логина
        if (!validateUsername(username)) {
            setUsernameError('Введите корректный логин (например, не менее 3 символов)'); // Адаптируй сообщение
            isValid = false;
        }

        // 3. Валидация пароля
        if (!validatePassword(password)) {
            setPasswordError('Пароль не менее 8 символов и содержащий цифры'); // Адаптируй сообщение
            isValid = false;
        }

        // Если валидация не прошла, останавливаемся
        if (!isValid) {
            // Ошибки уже установлены через setState
            return;
        }

        // Если валидация прошла, отправляем данные на сервер
        setIsSubmitting(true); // Включаем состояние отправки

        const data = {
            username: username,
            password: password, // Отправляем пароль (ваш API его хеширует)
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