import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import { useNavigate } from 'react-router-dom';

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
                        <Link to="/">Главная</Link>
                        <a href="#about">О проекте</a>
                        <a href="#thanks">Благодарности</a>
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