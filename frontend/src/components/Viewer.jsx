import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
        viewer_title: 'Просмотр персонажа',
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
        back_to_list: 'Вернуться к списку персонажей',
        invalid_token: 'Неверная или просроченная ссылка для просмотра.',
        missing_token: 'Ссылка для просмотра не содержит токен.',
        loading_viewer: 'Загрузка данных персонажа для просмотра...'
    }
};

function CharacterViewer() {
    const [searchParams] = useSearchParams();
    const shareTokenFromUrl = searchParams.get('token');

    const [characterData, setCharacterData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        setCharacterData(null);

        if (!shareTokenFromUrl) {
            console.warn("Share token отсутствует в параметрах URL.");
            setIsLoading(false);
            setError(translations.general.missing_token);
            return;
        }

        console.log(`Попытка загрузить данные по share token: ${shareTokenFromUrl}`);

        const loadCharacterData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${API_BASE_URL}/files/shared/${encodeURIComponent(shareTokenFromUrl)}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`Ошибка загрузки данных для просмотра (${response.status}): ${errorBody || response.statusText}`);

                    if (response.status === 400 || response.status === 404) {
                        setError(translations.general.invalid_token);
                    } else {
                        setError(`Ошибка загрузки данных для просмотра: ${response.statusText || response.status}`);
                    }

                    setIsLoading(false);
                    return;
                }
                const contentString = await response.text();
                console.log('Данные загружены (строка):', contentString);

                try {
                    const wrappedData = JSON.parse(contentString);
                    console.log('Парсинг внешнего объекта:', wrappedData);

                    if (wrappedData && typeof wrappedData.content === 'string') {
                        const parsedCharacterData = JSON.parse(wrappedData.content);
                        console.log('Парсинг внутреннего объекта (данных персонажа):', parsedCharacterData);
                        setIsLoading(false);
                        setCharacterData(parsedCharacterData);
                    } else {
                        console.error("Сервер вернул неожиданный формат данных: отсутствует поле 'content' или оно не строка.");
                        setError("Ошибка обработки данных персонажа с сервера: некорректный формат ответа.");
                        setIsLoading(false);
                    }

                } catch (jsonError) {
                    console.error("Ошибка парсинга JSON из загруженного контента для просмотра:", jsonError);
                    setError("Ошибка обработки данных персонажа с сервера: некорректный JSON.");
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Ошибка при выполнении запроса загрузки персонажа для просмотра:", err);
                setError(`Не удалось загрузить персонажа: ${err.message}`);
                setIsLoading(false);
            }
        };

        loadCharacterData();

    }, [shareTokenFromUrl, API_BASE_URL, translations]);

    if (isLoading) {
        return (
            <>
                <Header />
                <main>
                    <div className="editor-container">
                        <p>{translations.general.loading_viewer}</p>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (error && characterData === null) {
        return (
            <>
                <Header />
                <main>
                    <div className="editor-container">
                        <p className="error">{error}</p>
                        <p><Link to="/">{translations.general.back_to_list}</Link></p>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main>
                <div className="editor-container">

                    <h2>{translations.general.viewer_title}</h2>

                    {characterData && (
                        <div className="character-sheet-form viewer-mode">
                            <div className="sheet-section top-header">
                                <div className="character-name-block">
                                    <label htmlFor="character_name">{translations.general.character_name}</label>
                                    <input
                                        type="text"
                                        id="character_name"
                                        value={characterData.character_name}
                                        readOnly={true}
                                    />
                                </div>
                                <div className="character-info-block">
                                    <div>
                                        <label htmlFor="class">{translations.general.class}</label>
                                        <input type="text" id="class" value={characterData.class} readOnly={true} />
                                    </div>
                                    <div>
                                        <label htmlFor="background">{translations.general.background}</label>
                                        <input type="text" id="background" value={characterData.background} readOnly={true} />
                                    </div>
                                    <div>
                                        <label htmlFor="player_name">{translations.general.player_name}</label>
                                        <input type="text" id="player_name" value={characterData.player_name} readOnly={true} />
                                    </div>
                                    <div>
                                        <label htmlFor="race">{translations.general.race}</label>
                                        <input type="text" id="race" value={characterData.race} readOnly={true} />
                                    </div>
                                    <div>
                                        <label htmlFor="alignment">{translations.general.alignment}</label>
                                        <input type="text" id="alignment" value={characterData.alignment} readOnly={true} />
                                    </div>
                                    <div>
                                        <label htmlFor="experience">{translations.general.experience}</label>
                                        <input type="number" id="experience" value={characterData.experience} readOnly={true} min="0" />
                                    </div>
                                </div>
                            </div>

                            <div className="sheet-section left-column">
                                <div className="inspiration-block">
                                    <input
                                        type="checkbox"
                                        id="inspiration"
                                        checked={characterData.inspiration}
                                        disabled={true}
                                    />
                                    <label htmlFor="inspiration">{translations.general.inspiration}</label>
                                </div>

                                <div className="proficiency-bonus-block">
                                    <label htmlFor="proficiency_bonus">{translations.general.proficiency_bonus}</label>
                                    <input
                                        type="number"
                                        id="proficiency_bonus"
                                        value={characterData.proficiency_bonus}
                                        readOnly={true}
                                        min="0"
                                    />
                                </div>

                                <div className="stats-block">
                                    <h4>{translations.general.stats_block_title}</h4>
                                    {Object.keys(characterData.stats).map(statKey => (
                                        <div key={statKey} className="stat-item">
                                            <label htmlFor={`stat_${statKey}`}>{translations.stats[statKey]}</label>
                                            <input
                                                type="number"
                                                id={`stat_${statKey}`}
                                                value={characterData.stats[statKey]}
                                                readOnly={true}
                                                min="0" max="30"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="saving-throws-block">
                                    <h4>{translations.general.saving_throws_block_title}</h4>
                                    {Object.keys(characterData.saving_throws).map(statKey => (
                                        <div key={statKey} className="saving-throw-item">
                                            <input
                                                type="checkbox"
                                                id={`saving_${statKey}`}
                                                checked={characterData.saving_throws[statKey]}
                                                disabled={true}
                                            />
                                            <label htmlFor={`saving_${statKey}`}>{translations.savingThrows[statKey]}</label>
                                        </div>
                                    ))}
                                </div>

                                <div className="skills-block">
                                    <h4>{translations.general.skills_block_title}</h4>
                                    {Object.keys(characterData.skills).map(skillKey => (
                                        <div key={skillKey} className="skill-item">
                                            <input
                                                type="checkbox"
                                                id={`skill_${skillKey}`}
                                                checked={characterData.skills[skillKey]}
                                                disabled={true}
                                            />
                                            <label htmlFor={`skill_${skillKey}`}>
                                                {translations.skills[skillKey]}
                                            </label>
                                        </div>
                                    ))}

                                    <div className="passive-perception-block">
                                        <label htmlFor="passive_perception">{translations.general.passive_perception}</label>
                                        <input
                                            type="number"
                                            id="passive_perception"
                                            value={characterData.passive_perception}
                                            readOnly={true}
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>


                            <div className="sheet-section middle-column">
                                <div className="combat-top-block">
                                    <div className="ac-block">
                                        <label htmlFor="ac">{translations.general.ac}</label>
                                        <input type="number" id="ac" value={characterData.ac} readOnly={true} min="0" />
                                    </div>
                                    <div className="speed-block">
                                        <label htmlFor="speed">{translations.general.speed}</label>
                                        <input type="number" id="speed" value={characterData.speed} readOnly={true} min="0" />
                                    </div>
                                </div>

                                <div className="hp-block">
                                    <h4>{translations.general.hp}</h4>
                                    <div className="hp-fields">
                                        <div className="hp-item">
                                            <label htmlFor="hp_max">{translations.general.hp_max}</label>
                                            <input type="number" id="hp_max" value={characterData.hp.max} readOnly={true} min="0" />
                                        </div>
                                        <div className="hp-item">
                                            <label htmlFor="hp_current">{translations.general.hp_current}</label>
                                            <input type="number" id="hp_current" value={characterData.hp.current} readOnly={true} min="0" />
                                        </div>
                                        <div className="hp-item">
                                            <label htmlFor="hp_temp">{translations.general.hp_temp}</label>
                                            <input type="number" id="hp_temp" value={characterData.hp.temp} readOnly={true} min="0" />
                                        </div>
                                    </div>
                                </div>

                                <div className="hit-dice-saves-block">
                                    <div className="hit-dice-block">
                                        <h4>{translations.general.hit_dice}</h4>
                                        <label htmlFor="hit_dice_total">{translations.general.hit_dice_total}</label>
                                        <input type="number" id="hit_dice_total" value={characterData.hit_dice.total} readOnly={true} min="0" />
                                        <label htmlFor="hit_dice_value">{translations.general.hit_dice_value}</label>
                                        <input type="text" id="hit_dice_value" value={characterData.hit_dice.value} readOnly={true} placeholder={translations.general.hit_dice_value_placeholder} />
                                    </div>
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
                                                        disabled={true}
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
                                                        disabled={true}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="attacks-spells-block">
                                    <h4>{translations.general.attacks_and_spells}</h4>
                                    <div className="attack-list">
                                        <div className="attack-header">
                                            <span>{translations.general.attack_name}</span>
                                            <span>{translations.general.attack_modifier}</span>
                                            <span>{translations.general.attack_damage}</span>
                                        </div>
                                        {characterData.attacks_and_spells.entries.map((attack, index) => (
                                            <div key={index} className="attack-entry">
                                                <input
                                                    type="text"
                                                    value={attack.name}
                                                    readOnly={true}
                                                />
                                                <input
                                                    type="text"
                                                    value={attack.modifier}
                                                    readOnly={true}
                                                />
                                                <input
                                                    type="text"
                                                    value={attack.damage}
                                                    readOnly={true}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <textarea
                                        className="attacks-spells-description-textarea"
                                        placeholder={translations.general.attacks_spells_description_placeholder}
                                        value={characterData.attacks_and_spells.description}
                                        readOnly={true}
                                    ></textarea>
                                </div>

                                <div className="equipment-block">
                                    <h4>{translations.general.equipment}</h4>
                                    <textarea
                                        value={characterData.equipment.items}
                                        readOnly={true}
                                        placeholder={translations.general.equipment_items_placeholder}
                                    ></textarea>
                                    <div className="coin-block">
                                        <div><label>{translations.general.coin_cp}</label><input type="number" value={characterData.equipment.cp} readOnly={true} min="0" /></div>
                                        <div><label>{translations.general.coin_sp}</label><input type="number" value={characterData.equipment.sp} readOnly={true} min="0" /></div>
                                        <div><label>{translations.general.coin_ep}</label><input type="number" value={characterData.equipment.ep} readOnly={true} min="0" /></div>
                                        <div><label>{translations.general.coin_gp}</label><input type="number" value={characterData.equipment.gp} readOnly={true} min="0" /></div>
                                        <div><label>{translations.general.coin_pp}</label><input type="number" value={characterData.equipment.pp} readOnly={true} min="0" /></div>
                                    </div>
                                </div>

                            </div>

                            <div className="sheet-section right-column">
                                <div className="personality-block">
                                    <h4>{translations.general.personality_traits}</h4>
                                    <textarea
                                        value={characterData.personality.traits}
                                        readOnly={true}
                                        placeholder={translations.general.personality_placeholder}
                                    ></textarea>
                                    <h4>{translations.general.personality_ideals}</h4>
                                    <textarea
                                        value={characterData.personality.ideals}
                                        readOnly={true}
                                        placeholder={translations.general.personality_placeholder}
                                    ></textarea>
                                    <h4>{translations.general.personality_bonds}</h4>
                                    <textarea
                                        value={characterData.personality.bonds}
                                        readOnly={true}
                                        placeholder={translations.general.personality_placeholder}
                                    ></textarea>
                                    <h4>{translations.general.personality_flaws}</h4>
                                    <textarea
                                        value={characterData.personality.flaws}
                                        readOnly={true}
                                        placeholder={translations.general.personality_placeholder}
                                    ></textarea>
                                </div>

                                <div className="features-traits-block">
                                    <h4>{translations.general.features_traits}</h4>
                                    <textarea
                                        value={characterData.features_traits}
                                        readOnly={true}
                                        placeholder={translations.general.features_traits_placeholder}
                                    ></textarea>
                                </div>

                                <div className="other-proficiencies-block">
                                    <h4>{translations.general.other_proficiencies_languages}</h4>
                                    <textarea
                                        value={characterData.other_proficiencies_languages}
                                        readOnly={true}
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

export default CharacterViewer;