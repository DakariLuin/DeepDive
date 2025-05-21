import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../assets/Fonts.css';
import './HomePage.css';
import { useLocation } from 'react-router-dom';

function HomePage() {
    const location = useLocation();
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.substring(1);
            const element = document.getElementById(id);

            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 0);
            }
        }
    }, [location]);

    return (
        <>
            <Header />
            <main>
                <section className="hero-section" id="top">
                    <div className="container">
                        <h1 className="logo primary">Deep Dive</h1>
                        <h1 className="logo secondary">Сайт для создания проработанных персонажей!</h1> {/* Подзаголовок */}
                    </div>
                </section>

                <section id="about" className="about-section">
                    <div className="container">
                        <h2>О проекте</h2>
                        <p>Deep Dive - это сервер для хранения и редактирования листов персонажей для днд пятой редакции </p>
                        <p>Здесь будет подробное описание проекта, его целей и возможностей. Lorem ipsum dolor sit amet... </p>
                        <p>Здесь будет подробное описание проекта, его целей и возможностей. Lorem ipsum dolor sit amet... </p>
                        <p>Здесь будет подробное описание проекта, его целей и возможностей. Lorem ipsum dolor sit amet... </p>
                        <p>Здесь будет подробное описание проекта, его целей и возможностей. Lorem ipsum dolor sit amet... </p>
                        <p>Здесь будет подробное описание проекта, его целей и возможностей. Lorem ipsum dolor sit amet... </p>
                        <p>Здесь будет подробное описание проекта, его целей и возможностей. Lorem ipsum dolor sit amet... </p>
                        <p>Здесь будет подробное описание проекта, его целей и возможностей. Lorem ipsum dolor sit amet... </p>
                        <p>Здесь будет подробное описание проекта, его целей и возможностей. Lorem ipsum dolor sit amet... </p>
                        <p>Здесь будет подробное описание проекта, его целей и возможностей. Lorem ipsum dolor sit amet... </p>
                    </div>
                </section>

                <section id="thanks" className="thanks-section">
                    <div className="container">
                        <h2>Особые благодарности</h2>
                        <p>Спасибо всем, кто помог в разработке! Отдельная благодарность [Имя 1], [Имя 2] и т.д. ...</p>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

export default HomePage;