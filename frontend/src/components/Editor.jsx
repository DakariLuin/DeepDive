import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './Editor.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const translations = {
    stats: {
        str: 'Сила',
        dex: 'Ловкость',
        con: 'Телосложение',
        int: 'Интеллект',
        wis: 'Мудрость',
        cha: 'Харизма'
    },
    savingThrows: {
        str: 'Силы',
        dex: 'Ловкости',
        con: 'Телосложения',
        int: 'Интеллекта',
        wis: 'Мудрости',
        cha: 'Харизмы'
    },
    skills: {
        acrobatics: 'Акробатика (Лов)',
        animal_handling: 'Уход за животными (Мдр)',
        arcana: 'Магия (Инт)',
        athletics: 'Атлетика (Сил)',
        deception: 'Обман (Хар)',
        history: 'История (Инт)',
        insight: 'Проницательность (Мдр)',
        intimidation: 'Запугивание (Хар)',
        investigation: 'Анализ (Инт)',
        medicine: 'Медицина (Мдр)',
        nature: 'Природа (Инт)',
        perception: 'Внимательность (Мдр)',
        performance: 'Выступление (Хар)',
        persuasion: 'Убеждение (Хар)',
        religion: 'Религия (Инт)',
        sleight_of_hand: 'Ловкость рук (Лов)',
        stealth: 'Скрытность (Лов)',
        survival: 'Выживание (Мдр)'
    },
    general: {
        player_name: 'Имя игрока',
        character_name: 'Имя персонажа',
        class: 'Класс и уровень',
        race: 'Раса',
        background: 'Предыстория',
        alignment: 'Мировоззрение',
        experience: 'Опыт',
        inspiration: 'Вдохновение',
        proficiency_bonus: 'Бонус мастерства',
        stats_block_title: 'Характеристики',
        saving_throws_block_title: 'Спасброски',
        skills_block_title: 'Навыки',
        ac: 'КД',
        speed: 'Скорость',
        hp: 'Хиты',
        hp_max: 'Максимум хитов',
        hp_current: 'Текущие хиты',
        hp_temp: 'Временные хиты',
        hit_dice: 'Кость хитов',
        hit_dice_total: 'Всего',
        hit_dice_value: 'Значение',
        hit_dice_value_placeholder: 'Кость',
        death_saves: 'Спасброски от смерти',
        death_saves_successes: 'Успехи',
        death_saves_failures: 'Провалы',
        attacks_and_spells: 'Атаки и заклинания',
        attack_name: 'Название',
        attack_modifier: 'Бонус атаки',
        attack_damage: 'Урон/Вид',
        add_attack: '+ Добавить атаку',
        remove_attack: 'X',
        attacks_spells_description_placeholder: 'Описание атак, заклинаний или дополнительные детали...',
        personality_block_title: 'Личность',
        personality_traits: 'Черты характера',
        personality_ideals: 'Идеалы',
        personality_bonds: 'Привязанности',
        personality_flaws: 'Слабости',
        personality_placeholder: '...',
        passive_perception: 'Пассивная мудрость (внимательность)',
        other_proficiencies_languages: 'Прочие владения и языки',
        other_proficiencies_languages_placeholder: 'Виды доспехов, оружия, инструментов, языки...',
        equipment: 'Снаряжение',
        equipment_items_placeholder: 'Список предметов...',
        coin_cp: 'МС',
        coin_sp: 'СС',
        coin_ep: 'ЭС',
        coin_gp: 'ЗС',
        coin_pp: 'ПС',
        features_traits: 'Умения и особенности',
        features_traits_placeholder: 'Особые способности, черты расы, класса, предыстории...',
        save_character: 'Сохранить персонажа',
        editing: 'Редактирование',
        back_to_list: 'Вернуться к списку персонажей',
        select_file: 'Выберите персонажа для редактирования из списка.'
    }
};


function Editor() {
    const [searchParams] = useSearchParams();
    const fileIdFromUrl = searchParams.get('fileName');
    const navigate = useNavigate();
    const [characterData, setCharacterData] = useState(null);
    const [fileId, setFileId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const isInitialLoad = useRef(true);
    const autoSaveTimerRef = useRef(null);


    useEffect(() => {
        setIsLoading(true);
        setError(null);
        isInitialLoad.current = true;
        setFileId(null);
        setCharacterData(null);

        if (!fileIdFromUrl) {
            console.warn("fileId отсутствует в параметрах URL.");
            setIsLoading(false);
            setError(translations.general.select_file);
            return;
        }

        console.log(`Попытка загрузить данные для fileId: ${fileIdFromUrl}`);

        const loadCharacterData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    console.error("Нет токена доступа.");
                    setError("Для редактирования необходимо авторизоваться.");
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/files/getFile?fileId=${fileIdFromUrl}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`Ошибка загрузки данных (${response.status}): ${errorBody || response.statusText}`);

                    if (response.status === 401) setError("Неавторизованный доступ или истек срок сессии.");
                    else if (response.status === 400) setError("Некорректный запрос к серверу (возможно, неверный ID файла).");
                    else if (response.status === 404) setError("Файл персонажа не найден или у вас нет к нему доступа.");
                    else setError(`Ошибка загрузки данных: ${response.statusText || response.status}`);

                    setIsLoading(false);
                    return;
                }

                const contentString = await response.text();
                console.log('Данные загружены (строка):', contentString);

                try {
                    const parsedCharacterData = JSON.parse(contentString);
                    console.log('Данные распарсены:', parsedCharacterData);
                    setIsLoading(false);
                    setCharacterData(parsedCharacterData);
                    setFileId(parseInt(fileIdFromUrl, 10));
                    isInitialLoad.current = false;

                } catch (jsonError) {
                    console.error("Ошибка парсинга JSON из загруженного контента:", jsonError);
                    setError("Ошибка обработки данных персонажа с сервера.");
                    setIsLoading(false);
                    isInitialLoad.current = false;
                }

            } catch (err) {
                console.error("Ошибка при выполнении запроса загрузки персонажа:", err);
                setError(`Не удалось загрузить персонажа: ${err.message}`);
                setIsLoading(false);
                isInitialLoad.current = false;
            }
        };

        loadCharacterData();

    }, [fileIdFromUrl, navigate, API_BASE_URL, translations.general.select_file]);

    useEffect(() => {
        if (isInitialLoad.current) {
            console.log("Автосохранение пропущено: первая загрузка или нет fileId.");
            return;
        }

        if (fileId === null) {
            console.warn("Невозможно автосохранить: отсутствует fileId. Персонаж, возможно, еще не сохранен.");
            return;
        }

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        console.log(`Изменение данных обнаружено (fileId: ${fileId}). Планирую автосохранение...`);

        autoSaveTimerRef.current = setTimeout(async () => {
            console.log("Выполняю автосохранение...");
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    console.error("Нет токена доступа для автосохранения. Пользователь разлогинился?");
                    return;
                }

                const dataToSend = {
                    token: token,
                    fileId: fileId,
                    content: JSON.stringify(characterData)
                };

                const response = await fetch(`${API_BASE_URL}/files/edit`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend)
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`Ошибка автосохранения (${response.status}): ${errorBody || response.statusText}`);
                } else {
                    console.log("Автосохранение успешно!");
                }

            } catch (error) {
                console.error("Ошибка при выполнении запроса автосохранения:", error);
            } finally {
            }

        }, 1000);

        return () => {
            console.log("Таймер автосохранения сброшен.");
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };

    }, [characterData, fileId, API_BASE_URL]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCharacterData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const handleNestedInputChange = (section, e) => {
        const { name, value, type } = e.target;
        setCharacterData(prevData => ({
            ...prevData,
            [section]: {
                ...prevData[section],
                [name]: type === 'number' ? parseFloat(value) : value
            }
        }));
    };

    const handlePersonalityChange = (e) => {
        const { name, value } = e.target;
        setCharacterData(prevData => ({
            ...prevData,
            personality: {
                ...prevData.personality,
                [name]: value
            }
        }));
    };

    const handleSkillChange = (e) => {
        const { name, checked } = e.target;
        setCharacterData(prevData => ({
            ...prevData,
            skills: {
                ...prevData.skills,
                [name]: checked
            }
        }));
    };

    const handleSavingThrowChange = (e) => {
        const { name, checked } = e.target;
        setCharacterData(prevData => ({
            ...prevData,
            saving_throws: {
                ...prevData.saving_throws,
                [name]: checked
            }
        }));
    };

    const handleDeathSaveChange = (type, index, checked) => {
        setCharacterData(prevData => {
            const currentCount = prevData.death_saves[type];
            let newCount = currentCount;

            if (checked && currentCount <= index) {
                newCount = index + 1;
            }
            else if (!checked && currentCount > index) {
                newCount = index;
            }

            newCount = Math.max(0, Math.min(3, newCount));

            return {
                ...prevData,
                death_saves: {
                    ...prevData.death_saves,
                    [type]: newCount
                }
            };
        });
    };

    const handleAttackChange = (index, e) => {
        const { name, value } = e.target;
        const newEntries = [...characterData.attacks_and_spells.entries];
        newEntries[index] = {
            ...newEntries[index],
            [name]: value
        };
        setCharacterData(prevData => ({
            ...prevData,
            attacks_and_spells: {
                ...prevData.attacks_and_spells,
                entries: newEntries
            }
        }));
    };

    const handleAddAttack = () => {
        setCharacterData(prevData => ({
            ...prevData,
            attacks_and_spells: {
                ...prevData.attacks_and_spells,
                entries: [...prevData.attacks_and_spells.entries, { name: '', modifier: '', damage: '' }]
            }
        }));
    };

    const handleRemoveAttack = (index) => {
        setCharacterData(prevData => ({
            ...prevData,
            attacks_and_spells: {
                ...prevData.attacks_and_spells,
                entries: prevData.attacks_and_spells.entries.filter((_, i) => i !== index)
            }
        }));
    };

    const handleAttacksSpellsDescriptionChange = (e) => {
        const { value } = e.target;
        setCharacterData(prevData => ({
            ...prevData,
            attacks_and_spells: {
                ...prevData.attacks_and_spells,
                description: value
            }
        }));
    };

    const handleOtherProficienciesLanguagesChange = (e) => {
        setCharacterData(prevData => ({
            ...prevData,
            other_proficiencies_languages: e.target.value
        }));
    };

    const handleFeaturesTraitsChange = (e) => {
        setCharacterData(prevData => ({
            ...prevData,
            features_traits: e.target.value
        }));
    };


    if (isLoading) {
        return (
            <>
                <Header />
                <main><div className="editor-container"><p>Загрузка данных персонажа...</p></div></main>
                <Footer />
            </>
        );
    }

    if (error && characterData === null) {
        return (
            <>
                <Header />
                <main><div className="editor-container"><p className="error">{error}</p><p><Link to="/profile">{translations.general.back_to_list}</Link></p></div></main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main>
                <div className="editor-container">

                    {fileId === null && (
                        <p className="save-warning">Этот персонаж еще не загружен для редактирования по ID. Автосохранение недоступно.</p>
                    )}

                    {characterData && (
                        <div className="character-sheet-form">
                            <div className="sheet-section top-header">
                                <div className="character-name-block">
                                    <label htmlFor="character_name">{translations.general.character_name}</label>
                                    <input
                                        type="text"
                                        id="character_name"
                                        name="character_name"
                                        value={characterData.character_name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="character-info-block">
                                    <div>
                                        <label htmlFor="class">{translations.general.class}</label>
                                        <input type="text" id="class" name="class" value={characterData.class} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label htmlFor="background">{translations.general.background}</label>
                                        <input type="text" id="background" name="background" value={characterData.background} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label htmlFor="player_name">{translations.general.player_name}</label>
                                        <input type="text" id="player_name" name="player_name" value={characterData.player_name} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label htmlFor="race">{translations.general.race}</label>
                                        <input type="text" id="race" name="race" value={characterData.race} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label htmlFor="alignment">{translations.general.alignment}</label>
                                        <input type="text" id="alignment" name="alignment" value={characterData.alignment} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label htmlFor="experience">{translations.general.experience}</label>
                                        <input type="number" id="experience" name="experience" value={characterData.experience} onChange={handleInputChange} min="0" />
                                    </div>
                                </div>
                            </div>

                            {/* Левая колонка */}
                            <div className="sheet-section left-column">
                                <div className="inspiration-block">
                                    <input
                                        type="checkbox"
                                        id="inspiration"
                                        name="inspiration"
                                        checked={characterData.inspiration}
                                        onChange={handleInputChange}
                                    />
                                    <label htmlFor="inspiration">{translations.general.inspiration}</label>
                                </div>

                                {/* Бонус мастерства */}
                                <div className="proficiency-bonus-block">
                                    <label htmlFor="proficiency_bonus">{translations.general.proficiency_bonus}</label>
                                    <input
                                        type="number"
                                        id="proficiency_bonus"
                                        name="proficiency_bonus"
                                        value={characterData.proficiency_bonus}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </div>

                                {/* Характеристики */}
                                <div className="stats-block">
                                    <h4>{translations.general.stats_block_title}</h4>
                                    {Object.keys(characterData.stats).map(statKey => (
                                        <div key={statKey} className="stat-item">
                                            <label htmlFor={`stat_${statKey}`}>{translations.stats[statKey]}</label>
                                            <input
                                                type="number"
                                                id={`stat_${statKey}`}
                                                name={statKey}
                                                value={characterData.stats[statKey]}
                                                onChange={(e) => handleNestedInputChange('stats', e)}
                                                min="0" max="30"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Спасброски */}
                                <div className="saving-throws-block">
                                    <h4>{translations.general.saving_throws_block_title}</h4>
                                    {Object.keys(characterData.saving_throws).map(statKey => (
                                        <div key={statKey} className="saving-throw-item">
                                            <input
                                                type="checkbox"
                                                id={`saving_${statKey}`}
                                                name={statKey}
                                                checked={characterData.saving_throws[statKey]}
                                                onChange={handleSavingThrowChange}
                                            />
                                            <label htmlFor={`saving_${statKey}`}>{translations.savingThrows[statKey]}</label>
                                        </div>
                                    ))}
                                </div>

                                {/* Навыки */}
                                <div className="skills-block">
                                    <h4>{translations.general.skills_block_title}</h4>
                                    {Object.keys(characterData.skills).map(skillKey => (
                                        <div key={skillKey} className="skill-item">
                                            <input
                                                type="checkbox"
                                                id={`skill_${skillKey}`}
                                                name={skillKey}
                                                checked={characterData.skills[skillKey]}
                                                onChange={handleSkillChange}
                                            />
                                            <label htmlFor={`skill_${skillKey}`}>
                                                {translations.skills[skillKey]}
                                            </label>
                                        </div>
                                    ))}

                                    {/* Пассивная мудрость (внимательность) */}
                                    <div className="passive-perception-block">
                                        <label htmlFor="passive_perception">{translations.general.passive_perception}</label>
                                        <input
                                            type="number"
                                            id="passive_perception"
                                            name="passive_perception"
                                            value={characterData.passive_perception}
                                            onChange={handleInputChange}
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div> {/* Конец left-column */}


                            {/* Средняя колонка */}
                            <div className="sheet-section middle-column">
                                {/* КД, Скорость */}
                                <div className="combat-top-block">
                                    <div className="ac-block">
                                        <label htmlFor="ac">{translations.general.ac}</label>
                                        <input type="number" id="ac" name="ac" value={characterData.ac} onChange={handleInputChange} min="0" />
                                    </div>
                                    <div className="speed-block">
                                        <label htmlFor="speed">{translations.general.speed}</label>
                                        <input type="number" id="speed" name="speed" value={characterData.speed} onChange={handleInputChange} min="0" />
                                    </div>
                                </div>

                                {/* ХП */}
                                <div className="hp-block">
                                    <h4>{translations.general.hp}</h4>
                                    <div className="hp-fields">
                                        <div className="hp-item">
                                            <label htmlFor="hp_max">{translations.general.hp_max}</label>
                                            <input type="number" id="hp_max" name="max" value={characterData.hp.max} onChange={(e) => handleNestedInputChange('hp', e)} min="0" />
                                        </div>
                                        <div className="hp-item">
                                            <label htmlFor="hp_current">{translations.general.hp_current}</label>
                                            <input type="number" id="hp_current" name="current" value={characterData.hp.current} onChange={(e) => handleNestedInputChange('hp', e)} min="0" />
                                        </div>
                                        <div className="hp-item">
                                            <label htmlFor="hp_temp">{translations.general.hp_temp}</label>
                                            <input type="number" id="hp_temp" name="temp" value={characterData.hp.temp} onChange={(e) => handleNestedInputChange('hp', e)} min="0" />
                                        </div>
                                    </div>
                                </div>

                                {/* Кости хитов и Спасброски от смерти */}
                                <div className="hit-dice-saves-block">
                                    <div className="hit-dice-block">
                                        <h4>{translations.general.hit_dice}</h4>
                                        <label htmlFor="hit_dice_total">{translations.general.hit_dice_total}</label>
                                        <input type="number" id="hit_dice_total" name="total" value={characterData.hit_dice.total} onChange={(e) => handleNestedInputChange('hit_dice', e)} min="0" />
                                        <label htmlFor="hit_dice_value">{translations.general.hit_dice_value}</label>
                                        <input type="text" id="hit_dice_value" name="value" value={characterData.hit_dice.value} onChange={(e) => handleNestedInputChange('hit_dice', e)} placeholder={translations.general.hit_dice_value_placeholder} />
                                    </div>
                                    {/* Спасброски от смерти */}
                                    <div className="death-saves-block">
                                        <h4>{translations.general.death_saves}</h4>
                                        <div className="death-save-checks">
                                            <div>
                                                <span>{translations.general.death_saves_successes}: </span>
                                                {[0, 1, 2].map(index => (
                                                    <input
                                                        key={`success-${index}`}
                                                        type="checkbox"
                                                        checked={characterData.death_saves.successes > index}
                                                        onChange={(e) => handleDeathSaveChange('successes', index, e.target.checked)}
                                                    />
                                                ))}
                                            </div>
                                            <div>
                                                <span>{translations.general.death_saves_failures}: </span>
                                                {[0, 1, 2].map(index => (
                                                    <input
                                                        key={`failure-${index}`}
                                                        type="checkbox"
                                                        checked={characterData.death_saves.failures > index}
                                                        onChange={(e) => handleDeathSaveChange('failures', index, e.target.checked)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Атаки и заклинания */}
                                <div className="attacks-spells-block">
                                    <h4>{translations.general.attacks_and_spells}</h4>
                                    <div className="attack-list">
                                        <div className="attack-header">
                                            <span>{translations.general.attack_name}</span>
                                            <span>{translations.general.attack_modifier}</span>
                                            <span>{translations.general.attack_damage}</span>
                                            <span></span>
                                        </div>
                                        {characterData.attacks_and_spells.entries.map((attack, index) => (
                                            <div key={index} className="attack-entry">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={characterData.attacks_and_spells.entries[index].name} // Используем characterData напрямую
                                                    onChange={(e) => handleAttackChange(index, e)}
                                                    placeholder={translations.general.attack_name}
                                                />
                                                <input
                                                    type="text"
                                                    name="modifier"
                                                    value={characterData.attacks_and_spells.entries[index].modifier} // Используем characterData напрямую
                                                    onChange={(e) => handleAttackChange(index, e)}
                                                    placeholder="+ Мод"
                                                />
                                                <input
                                                    type="text"
                                                    name="damage"
                                                    value={characterData.attacks_and_spells.entries[index].damage} // Используем characterData напрямую
                                                    onChange={(e) => handleAttackChange(index, e)}
                                                    placeholder={translations.general.attack_damage}
                                                />
                                                <button className="remove-attack-btn" onClick={() => handleRemoveAttack(index)}>{translations.general.remove_attack}</button>
                                            </div>
                                        ))}
                                        <button className="add-attack-btn" onClick={handleAddAttack}>{translations.general.add_attack}</button>
                                    </div>
                                    {/* Большое текстовое поле для attacks_and_spells.description */}
                                    <textarea
                                        className="attacks-spells-description-textarea"
                                        placeholder={translations.general.attacks_spells_description_placeholder}
                                        value={characterData.attacks_and_spells.description}
                                        onChange={handleAttacksSpellsDescriptionChange}
                                    ></textarea>
                                </div>

                                {/* Снаряжение */}
                                <div className="equipment-block">
                                    <h4>{translations.general.equipment}</h4>
                                    <textarea
                                        name="items"
                                        value={characterData.equipment.items}
                                        onChange={(e) => handleNestedInputChange('equipment', e)}
                                        placeholder={translations.general.equipment_items_placeholder}
                                    ></textarea>
                                    <div className="coin-block">
                                        {/* Монеты */}
                                        <div><label>{translations.general.coin_cp}</label><input type="number" name="cp" value={characterData.equipment.cp} onChange={(e) => handleNestedInputChange('equipment', e)} min="0" /></div>
                                        <div><label>{translations.general.coin_sp}</label><input type="number" name="sp" value={characterData.equipment.sp} onChange={(e) => handleNestedInputChange('equipment', e)} min="0" /></div>
                                        <div><label>{translations.general.coin_ep}</label><input type="number" name="ep" value={characterData.equipment.ep} onChange={(e) => handleNestedInputChange('equipment', e)} min="0" /></div>
                                        <div><label>{translations.general.coin_gp}</label><input type="number" name="gp" value={characterData.equipment.gp} onChange={(e) => handleNestedInputChange('equipment', e)} min="0" /></div>
                                        <div><label>{translations.general.coin_pp}</label><input type="number" name="pp" value={characterData.equipment.pp} onChange={(e) => handleNestedInputChange('equipment', e)} min="0" /></div>
                                    </div>
                                </div>

                            </div>


                            {/* Правая колонка */}
                            <div className="sheet-section right-column">
                                {/* Личность */}
                                <div className="personality-block">
                                    <h4>{translations.general.personality_traits}</h4>
                                    <textarea
                                        name="traits"
                                        value={characterData.personality.traits}
                                        onChange={handlePersonalityChange}
                                        placeholder={translations.general.personality_placeholder}
                                    ></textarea>
                                    <h4>{translations.general.personality_ideals}</h4>
                                    <textarea
                                        name="ideals"
                                        value={characterData.personality.ideals}
                                        onChange={handlePersonalityChange}
                                        placeholder={translations.general.personality_placeholder}
                                    ></textarea>
                                    <h4>{translations.general.personality_bonds}</h4>
                                    <textarea
                                        name="bonds"
                                        value={characterData.personality.bonds}
                                        onChange={handlePersonalityChange}
                                        placeholder={translations.general.personality_placeholder}
                                    ></textarea>
                                    <h4>{translations.general.personality_flaws}</h4>
                                    <textarea
                                        name="flaws"
                                        value={characterData.personality.flaws}
                                        onChange={handlePersonalityChange}
                                        placeholder={translations.general.personality_placeholder}
                                    ></textarea>
                                </div>

                                {/* Умения и особенности */}
                                <div className="features-traits-block">
                                    <h4>{translations.general.features_traits}</h4>
                                    <textarea
                                        name="features_traits"
                                        value={characterData.features_traits}
                                        onChange={handleFeaturesTraitsChange}
                                        placeholder={translations.general.features_traits_placeholder}
                                    ></textarea>
                                </div>

                                {/* Прочие владения и языки */}
                                <div className="other-proficiencies-block">
                                    <h4>{translations.general.other_proficiencies_languages}</h4>
                                    <textarea
                                        name="other_proficiencies_languages"
                                        value={characterData.other_proficiencies_languages}
                                        onChange={handleOtherProficienciesLanguagesChange}
                                        placeholder={translations.general.other_proficiencies_languages_placeholder}
                                    ></textarea>
                                </div>

                            </div>
                        </div>
                    )}

                </div>
            </main>
            <Footer />
        </>
    );
}

export default Editor;