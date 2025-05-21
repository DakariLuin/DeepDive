import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CharacterExplorer from '../components/CharacterExplorer';
import './ProfilePage.css';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Profile = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE_URL}/user`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Ошибка авторизации');
                return res.json();
            })
            .then(data => setUserInfo(data))
            .catch(err => setError(err.message));
    }, []);

    return (
        <>
            <Header />
            <main>
                <div>
                    {userInfo ? (
                        <>
                            {error && <p className="error">{error}</p>}
                            <p className="username"> {userInfo.username}</p>
                            <CharacterExplorer />
                        </>
                    ) : (
                        !error && <p>Загрузка...</p>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default Profile;
