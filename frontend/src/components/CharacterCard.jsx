import React from 'react';
import { FaShareAlt, FaTrashAlt } from 'react-icons/fa';
import './CharacterCard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function CharacterCard({ character, onClick, showToast, onDelete }) {
    const handleClickOnCard = () => {
        onClick(character.file_name);
    };

    const handleShareClick = async (e) => {
        e.stopPropagation();
        const token = localStorage.getItem('access_token');
        if (!token) {
            showToast?.('Нет access_token, авторизуйтесь.');
            return;
        }
        try {
            const response = await fetch(
                `${API_BASE_URL}/files/share?fileId=${encodeURIComponent(character.file_name)}`,
                {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );
            if (!response.ok) {
                const errText = await response.text();
                showToast?.(`Не удалось создать ссылку: ${errText}`);
                return;
            }
            const data = await response.json();
            const shareUrl = `${window.location.origin}/viewer?token=${encodeURIComponent(data.url)}`;
            await navigator.clipboard.writeText(shareUrl);
            showToast?.('Ссылка скопирована в буфер обмена!');
        } catch {
            showToast?.('Сетевая ошибка при создании ссылки.');
        }
    };

    const handleDeleteClick = async (e) => {
        e.stopPropagation();
        const token = localStorage.getItem('access_token');
        if (!token) {
            showToast?.('Нет access_token, авторизуйтесь.');
            return;
        }
        try {
            const response = await fetch(
                `${API_BASE_URL}/files/delete?fileId=${encodeURIComponent(character.file_name)}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );
            if (response.ok) {
                showToast?.(`Персонаж "${character.character_name}" удалён.`);
                onDelete?.(character.file_name);
            } else {
                const errText = await response.text();
                showToast?.(`Ошибка удаления: ${errText}`);
            }
        } catch {
            showToast?.('Сетевая ошибка при удалении.');
        }
    };

    return (
        <div className="character-card" onClick={handleClickOnCard}>
            <div className="avatar" style={{ backgroundImage: `url(${character.photo_url || '/default-avatar.png'})` }} />
            <div className="info">
                <h3 title={character.character_name}>{character.character_name}</h3>
            </div>
            <div className="icons">
                <button aria-label="Поделиться" onClick={handleShareClick}><FaShareAlt /></button>
                <button aria-label="Удалить" onClick={handleDeleteClick}><FaTrashAlt /></button>
            </div>
        </div>
    );
}

export default CharacterCard;