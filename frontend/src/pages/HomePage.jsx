import React from 'react';
import Header from '../components/Header';
import Footer from '../components/footer';
import '../assets/Fonts.css';
import './HomePage.css';

function HomePage() {
    return (
        <>
            <Header />
            <main>
                <section className="hero-section"> {/* Добавь стили для этого класса в Styles.css */}
                    <div className="container"> {/* Переиспользуем класс контейнера */}
                        <h1 className="logo primary">Deep Dive</h1> {/* Заголовок приложения */}
                        <h1 className="logo secondary">Сайт для создания проработанных персонажей!</h1> {/* Подзаголовок */}
                    </div>
                </section>

                {/* Секция Описание (About) */}
                {/* Добавляем id="about" для ссылки из хедера */}
                <section id="about" className="about-section"> {/* Добавь стили для этого класса */}
                    <div className="container">
                        <h2>О проекте</h2> {/* Заголовок секции */}
                        <p>Здесь будет подробное описание проекта, его целей и возможностей. Lorem ipsum dolor sit amet... </p>
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

                {/* Секция Благодарности (Acknowledgements) */}
                {/* Добавляем id="thanks" для ссылки из хедера */}
                <section id="thanks" className="thanks-section"> {/* Добавь стили для этого класса */}
                    <div className="container">
                        <h2>Особые благодарности</h2> {/* Заголовок секции */}
                        <p>Спасибо всем, кто помог в разработке! Отдельная благодарность [Имя 1], [Имя 2] и т.д. ...</p>
                    </div>
                </section>
            </main>

            {/* Вставляем компонент Футера */}
            <Footer />
        </>
    );
}

export default HomePage;