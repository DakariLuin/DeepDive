import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Header() {
    const isAuthenticated = !!localStorage.getItem('access_token');
    const navigate = useNavigate();
    const handleLogout = () => {

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/authorization');
    };
    return (
        <header>
            <div className="container">
                <nav>
                    <div className="nav-links-left">
                        <Link to={{ pathname: '/', hash: '#top' }}>Главная</Link>
                        <Link to={{ pathname: '/', hash: '#about' }}>О проекте</Link>
                        <Link to={{ pathname: '/', hash: '#thanks' }}>Благодарности</Link>
                    </div>

                    <div className="auth-links-right">
                        {isAuthenticated ? (
                            <><Link to="/profile">Личный кабинет</Link>
                                <button onClick={handleLogout} className="logout-button">Выход</button>
                            </>

                        ) : (
                            <Link to="/authorization">Войти</Link>
                        )}

                    </div>
                </nav>
            </div>
        </header>
    );
}

export default Header;