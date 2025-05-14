import React, { useState } from 'react';
import '../assets/Fonts.css';
import { validateUsername, validatePassword } from '../utils/validator';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import SimpleCardPage from '../components/SimpleCard';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function LoginPage() {
    const navigate = useNavigate();

    // Состояние для полей ввода
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Состояние для сообщения об ошибке.
    const [errorMessage, setErrorMessage] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Обработчик изменения поля Логин
    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
        if (errorMessage) setErrorMessage('');
    };

    // Обработчик изменения поля Пароль
    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
        if (errorMessage) setErrorMessage('');
    };


    // Обработчик отправки формы
    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');

        let isValid = true;

        // --- Клиентская валидация ---
        if (!validateUsername(username)) {
            isValid = false;
        }
        // Если валидация пароля не проходит
        if (!validatePassword(password)) {
            isValid = false;
        }

        if (!isValid) {
            setErrorMessage('Неверный логин или пароль');
            return;
        }


        // --- Если клиентская валидация прошла, отправляем данные на сервер ---
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
                    // TODO: В будущем здесь может быть заголовок Authorization для refresh токена
                },
                body: JSON.stringify(data),
            });

            const result = await response.json(); // Парсим ответ сервера

            if (response.ok) { // response.ok для статусов 2xx (например, 200 OK)
                alert('Вход выполнен успешно!'); // Сообщение об успехе
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
                // --- Обработка ошибок сервера (как в твоем старом JS) ---
                // При любой ошибке сервера, показываем сообщение "Неверный логин или пароль"
                // и добавляем класс 'error' к обоим полям.
                setErrorMessage('Неверный логин или пароль'); // Текст ошибки из старого JS

                // result.message может содержать более подробное сообщение с бэкенда для отладки
                console.error('Ошибка от сервера:', result.message || response.statusText);
            }
        } catch (error) {
            // Обработка сетевых ошибок (сервер недоступен и т.п.)
            console.error('Сетевая ошибка при попытке входа:', error);
            setErrorMessage('Произошла ошибка при попытке входа.'); // Общее сообщение для UI
        } finally {
            setIsSubmitting(false); // Выключаем состояние отправки
        }
    };


    return (
        <SimpleCardPage cardTitle="Вход"> {/* Используем обертку SimpleCardPage с заголовком "Вход" */}

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="username">Логин:</label>
                    <input
                        type="text"
                        id="username" // ID должен быть уникален в DOM
                        name="username"
                        placeholder="Введите логин"
                        required
                        value={username} // Связываем поле с состоянием
                        onChange={handleUsernameChange} // Обновляем состояние при вводе
                        // Добавляем класс 'error', если есть любое сообщение об ошибке (errorMessage не пуст)
                        className={errorMessage ? 'error' : ''}
                    />
                    {/* Отображаем сообщение об ошибке под полем, если оно есть */}
                    {/* В старом JS было 2 span'а, но они показывали один и тот же текст */}
                    {/* В React мы показываем одно сообщение, если errorMessage не пуст */}
                    {errorMessage && <div className="error-message">{errorMessage}</div>}
                </div>

                <div className="input-group">
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password"
                        id="password" // ID должен быть уникален в DOM
                        name="password"
                        placeholder="Введите пароль"
                        required
                        value={password} // Связываем поле с состоянием
                        onChange={handlePasswordChange} // Обновляем состояние при вводе
                        // Добавляем класс 'error', если есть любое сообщение об ошибке
                        className={errorMessage ? 'error' : ''}
                    />
                    {/* Отображаем сообщение об ошибке под полем, если оно есть */}
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

export default LoginPage; // Экспортируем компонент