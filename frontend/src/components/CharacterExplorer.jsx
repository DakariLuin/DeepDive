import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterCard from './CharacterCard';
import './CharacterExplorer.css';
import './CharacterCard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function CharacterExplorer() {
    const [characters, setCharacters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const showToast = (message, duration = 3000) => {
        setToast(message);
        setTimeout(() => setToast(null), duration);
    };

    const handleDeleteCharacter = (fileNameToDelete) => {
        setCharacters(prevCharacters =>
            prevCharacters.filter(character => character.file_name !== fileNameToDelete)
        );
    };

    const fetchCharacters = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/files`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Ошибка загрузки списка (${response.status}): ${errorBody || response.statusText}`);
            }

            const data = await response.json();

            if (data.files && Array.isArray(data.files)) {
                const transformedCharacters = data.files.map(file => ({
                    ...file,
                    photo_url: file.image || '/default-avatar.png'
                }));
                setCharacters(transformedCharacters);
            } else {
                console.error("API returned unexpected data format:", data);
                setCharacters([]);
            }


        } catch (err) {
            console.error("Ошибка при получении списка персонажей:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCharacters();
    }, []);


    // --- Функция для СОЗДАНИЯ нового файла персонажа ---
    const handleCreateCharacter = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            showToast?.('Нет access_token, авторизуйтесь.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/files/createFile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Ошибка создания файла (${response.status}): ${errorBody || response.statusText}`);
            }

            const newFileData = await response.json();
            if (!newFileData.file_name) {
                throw new Error("API не вернуло имя файла для созданного персонажа.");
            }


            const addedCharacter = {
                ...newFileData,
                character_name: newFileData.character_name || "Новый персонаж",
                photo_url: newFileData.image || '/default-avatar.png'
            };

            setCharacters(prevCharacters => [...prevCharacters, addedCharacter]);


        } catch (err) {
            console.error("Ошибка при создании персонажа:", err);
            showToast?.(`Не удалось создать персонажа: ${err.message}`);
        }
    };


    const handleCardClick = (fileName) => {
        console.log(`Клик по карточке с файлом: ${fileName}`);
        navigate(`/editor?fileName=${fileName}`);
    };


    return (
        <div className="explorer-container">
            <h2>Список Персонажей</h2>

            {isLoading && <p>Загрузка списка персонажей...</p>}
            {error && <p className="error">Ошибка загрузки: {error}</p>}

            {!isLoading && !error && characters.length === 0 && (
                <p>Персонажи не найдены. Создайте первого!</p>
            )}

            <div className="character-list">
                {!isLoading && !error && characters.map((char) => (
                    <CharacterCard
                        key={char.file_name}
                        character={char}
                        onClick={() => handleCardClick(char.file_name)}
                        showToast={showToast}
                        onDelete={handleDeleteCharacter}
                    />
                ))}

                <div className="character-card create-card" onClick={handleCreateCharacter}>
                    <h2>+</h2>
                    <p>Создать нового</p>
                </div>

            </div>
            {toast && (
                <div className="toast-message" style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    backgroundColor: "#333",
                    color: "#fff",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
                    whiteSpace: "pre-wrap",
                    zIndex: 9999
                }}>
                    {toast}
                </div>
            )}
        </div>
    );
}

export default CharacterExplorer;