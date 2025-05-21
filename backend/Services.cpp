#include "Services.hpp"

#include <winsock2.h>
#include <crow.h>

#include <sqlite3.h>
#include <SQLiteCpp/SQLiteCpp.h>

#include "jwt-cpp/jwt.h"
#include "bcrypt/bcrypt.h"

#include "Validator.hpp"
#include <fstream>
#include <filesystem>
#include <random>
#include <nlohmann/json.hpp>
#include <nlohmann/json-schema.hpp>


std::string  AuthService::generateToken(const std::string& userId, int expiresInSeconds) {
    return jwt::create()
        .set_issuer("auth_server")
        .set_type("JWT")
        .set_subject(userId)
        .set_issued_at(std::chrono::system_clock::now())
        .set_expires_at(std::chrono::system_clock::now() + std::chrono::seconds{ expiresInSeconds })
        .sign(jwt::algorithm::hs256{ secretKey_ });
}

AuthService::AuthService(SQLite::Database& db, std::string secretKey) : db_(db), secretKey_(secretKey) {}

std::pair<std::string, std::string> AuthService::generateTokens(const std::string& username) {
    std::string accessToken = generateToken(username, 3600);  // 1 час
    std::string refreshToken = generateToken(username, 604800); // 7 дней

    SQLite::Statement query(db_, "UPDATE users SET access_token = ?, refresh_token = ? WHERE username = ?");
    query.bind(1, accessToken);
    query.bind(2, refreshToken);
    query.bind(3, username);
    query.exec();

    return { accessToken, refreshToken };
}

bool AuthService::checkAccessToken(std::string token) {
    try {
        auto decoded = jwt::decode(token);

        auto username = decoded.get_subject();
        if (username.empty()) return false;

        std::string dbToken;
        SQLite::Statement query(db_, "SELECT access_token FROM users WHERE username = ?");
        query.bind(1, username);
        if (query.executeStep()) {
            dbToken = query.getColumn(0).getString();
        }
        else {
            return false;
        }

        if (token != dbToken) return false;

        auto expClaim = decoded.get_expires_at();
        auto now = std::chrono::system_clock::now();
        if (expClaim <= now) return false;

        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{ secretKey_ })
            .with_issuer("auth_server");

        verifier.verify(decoded);

        return true;
    }
    catch (const std::exception& e) {
        std::cerr << "token checking error: " << e.what() << std::endl;
        return false;
    }
}

std::pair<std::string, std::string> AuthService::refreshAccesToken(std::string username, std::string refreshToken) {
    SQLite::Statement query(db_, "SELECT access_token, refresh_token FROM users WHERE username = ?");
    query.bind(1, username);

    if (!query.executeStep()) {
        std::cerr << "User not found." << std::endl;
        return {}; // Возвращаем пустую пару, если пользователь не найден
    }

    std::string storedAccessToken = query.getColumn(0).getString();
    std::string storedRefreshToken = query.getColumn(1).getString();

    // Проверяем, если refresh token не совпадает
    if (refreshToken != storedRefreshToken) {
        std::cerr << "Invalid refresh token." << std::endl;
        return {}; // Неверный refresh token
    }

    // Генерация нового access token
    std::string newAccessToken;
    if (checkAccessToken(storedAccessToken)) {
        newAccessToken = storedAccessToken;  // Возвращаем действующий access token
    }
    else {
        newAccessToken = generateToken(username, 3600);  // Новый access token на 1 час
    }

    // Генерация нового refresh token
    std::string newRefreshToken = generateToken(username, 604800);  // Новый refresh token на 7 дней

    // Обновляем базу данных с новым refresh token и access token
    SQLite::Statement update(db_, "UPDATE users SET access_token = ?, refresh_token = ? WHERE username = ?");
    update.bind(1, newAccessToken);
    update.bind(2, newRefreshToken);
    update.bind(3, username);
    update.exec();

    // Возвращаем пару с новым access и refresh токенами
    return { newAccessToken, newRefreshToken };
}

//-------------------------------------------------------------------------------------------------------//

UserService::UserService(SQLite::Database& db, Validator& validator) : db_(db), validator_(validator) {}

bool UserService::createUser(std::string username, std::string password, int role) {
    if (!validator_.validatePassword(password) || !validator_.validateUsername(username)) {
        return false;
    }

    try {
        SQLite::Statement query(db_, "SELECT id FROM users WHERE username = ?");
        query.bind(1, username);
        if (query.executeStep()) {
            return false;
        }
    }
    catch (const std::exception& e) {
        std::cerr << "Error checking if username exists: " << e.what() << std::endl;
        return false;
    }

    std::string hashedPassword = bcrypt::generateHash(password, 10);

    try {
        SQLite::Statement query(db_, "INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
        query.bind(1, username);
        query.bind(2, hashedPassword);
        query.bind(3, role);
        query.exec();
        return true;
    }
    catch (const std::exception& e) {
        std::cerr << "Error creating user: " << e.what() << std::endl;
        return false;
    }
}

bool UserService::authorizationUser(std::string username, std::string password) {
    if (!validator_.validatePassword(password) || !validator_.validateUsername(username)) {
        return false;
    }

    try {
        SQLite::Statement query(db_, "SELECT password FROM users WHERE username = ?");
        query.bind(1, username);

        if (query.executeStep()) {
            std::string storedHash = query.getColumn(0).getString();
            return bcrypt::validatePassword(password, storedHash);
        }
    }
    catch (const std::exception& e) {
        std::cerr << "Error during user authorization: " << e.what() << std::endl;
        return false;
    }

    return true;
}

int UserService::getUserId(const std::string& username) {
    try {
        SQLite::Statement query(db_, "SELECT id FROM users WHERE username = ?");
        query.bind(1, username);

        if (query.executeStep()) {
            return query.getColumn(0).getInt();
        }
        else {
            std::cerr << "User not found: " << username << std::endl;
            return -1;
        }
    }
    catch (const std::exception& e) {
        std::cerr << "Database error in getUserId: " << e.what() << std::endl;
        return -1;
    }
}

std::vector<std::string> UserService::getUserInfo(int userId) {
    SQLite::Statement query(db_, "SELECT username, role FROM users WHERE id = ?");
    query.bind(1, userId);

    if (query.executeStep()) {
        std::string username = query.getColumn(0).getString();
        std::string role = query.getColumn(1).getString();
        return { std::to_string(userId), username, role };
    }

    return {};
}


//----------------------------------------------------------------------//

std::string FileService::generateShareToken() {
    static const char charset[] =
        "0123456789"
        "abcdefghijklmnopqrstuvwxyz"
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    std::mt19937 rng(std::random_device{}());
    std::uniform_int_distribution<> dist(0, sizeof(charset) - 2);

    while (true) {
        std::string token;
        for (int i = 0; i < 16; ++i)
            token += charset[dist(rng)];

        // Проверка на уникальность
        SQLite::Statement query(db_, "SELECT COUNT(*) FROM files WHERE shared_token = ?");
        query.bind(1, token);
        query.executeStep();
        if (query.getColumn(0).getInt() == 0) {
            return token;
        }
    }
}

FileService::FileService(const std::string& ip, int port, SQLite::Database& db, Validator& validator) : db_(db), validator_(validator), ip_(ip), port_(port) {
    std::ifstream schemaFile(schemaPath_);
    if (!schemaFile.is_open()) {
        throw std::runtime_error("Не удалось открыть файл схемы по пути: " + schemaPath_);
    }

    std::string input((std::istreambuf_iterator<char>(schemaFile)), std::istreambuf_iterator<char>());

    if (input.empty()) {
        throw std::runtime_error("Файл схемы пуст или не был считан");
    }

    try {
        schema_ = nlohmann::json::parse(input);


        if (!schema_.is_object() && !schema_.is_boolean()) {
            std::cerr << "Warning: Parsed schema root is not a JSON object or boolean, which is unusual for a schema." << std::endl;
        }

    }
    catch (const nlohmann::json::parse_error& e) {
        std::cerr << "Ошибка парсинга файла схемы '" << schemaPath_ << "': " << e.what() << std::endl;
        throw std::runtime_error("Не удалось распарсить файл схемы как JSON.");
    }
}

bool FileService::createUserFolder(std::string userId) {
    try {
        std::filesystem::path userFolder = std::filesystem::path(userDataPath) / userId;

        if (!std::filesystem::exists(userFolder)) {
            std::filesystem::create_directories(userFolder);
        }

        return true;
    }
    catch (const std::exception& e) {
        std::cerr << "Failed to create user folder: " << e.what() << std::endl;
        return false;
    }
}

int FileService::createNewFile(int userId) {
    try {
        std::filesystem::path userFolder = std::filesystem::path(userDataPath) / std::to_string(userId);


        if (!std::filesystem::exists(userFolder)) {
            createUserFolder(std::to_string(userId));
        }

        int fileId;
        try {
            SQLite::Statement query(db_,
                "INSERT INTO files (owner, filename, filepath) VALUES (?, ?, ?);"
            );
            query.bind(1, userId);
            query.bind(2, "Безымянный");
            query.bind(3, "err");

            query.exec();
            fileId = static_cast<int>(db_.getLastInsertRowid());
        }
        catch (...) {
            std::cerr << "Error inserting file data into DB." << std::endl;
            return -1;
        }

        // Теперь можно сформировать путь на основе ID
        std::filesystem::path filePath = userFolder / (std::to_string(fileId));

        // Создаём файл
        std::ofstream outFile(filePath);
        if (!outFile) {
            std::cerr << "Unable to create file at: " << filePath << std::endl;
            return -1;
        }

        nlohmann::json contentJson = generateTemplateCharacterList(schema_);
        std::string content = contentJson.dump(4);
        outFile << content;
        outFile.close();

        // Обновляем путь к файлу в базе
        try {
            SQLite::Statement updateQuery(db_,
                "UPDATE files SET filepath = ? WHERE id = ?;"
            );
            updateQuery.bind(1, filePath.string());
            updateQuery.bind(2, fileId);
            updateQuery.exec();
        }
        catch (...) {
            std::cerr << "Error updating file path in DB." << std::endl;
            return -1;
        }

        return fileId;
    }
    catch (const std::exception& e) {
        std::cerr << "Error creating new file: " << e.what() << std::endl;
        return -1;
    }
}


std::string FileService::getFilePath(int fileid) {
    SQLite::Statement query(db_, "SELECT filepath FROM files WHERE id = ?");
    query.bind(1, fileid);

    if (query.executeStep()) {
        return query.getColumn(0).getString();
    }
    else {
        throw std::runtime_error("Файл с указанным ID не найден");
    }
}

bool FileService::isFileOwner(int fileId, int userId) {
    try {
        SQLite::Statement query(db_, "SELECT owner FROM files WHERE id = ?");
        query.bind(1, fileId);

        if (query.executeStep()) {
            int ownerId = query.getColumn(0).getInt();
            return ownerId == userId;
        }

        return false; // файл не найден
    }
    catch (const std::exception& e) {
        std::cerr << "isFileOwner error: " << e.what() << std::endl;
        return false;
    }
}

bool FileService::deleteFile(int fileid, int userid) {
    try {
        if (!isFileOwner(fileid, userid)) {
            std::cerr << "User is not the owner of the file." << std::endl;
            return false;
        }

        std::string filePath = getFilePath(fileid);

        // Удаляем файл с диска
        if (std::filesystem::exists(filePath)) {
            std::filesystem::remove(filePath);
        }
        else {
            std::cerr << "File not found on disk: " << filePath << std::endl;
            return false;
        }

        SQLite::Statement deleteQuery(db_, "DELETE FROM files WHERE id = ?");
        deleteQuery.bind(1, fileid);
        deleteQuery.exec();

        return true;
    }
    catch (const std::exception& e) {
        std::cerr << "Error deleting file: " << e.what() << std::endl;
        return false;
    }
}

bool FileService::editFile(int fileid, const std::string& newContent, int userid) {
    try {
        if (!validator_.validateContent(newContent, schema_)) {
            return false;
        }
        if (!isFileOwner(fileid, userid)) {
            std::cerr << "User is not the owner of the file." << std::endl;
            return false;
        }

        std::string filePath = getFilePath(fileid);
        std::cout << "Path = " << filePath << '\n';
        std::cout << "Content = " << newContent << '\n';
        if (!std::filesystem::exists(filePath)) {
            std::cerr << "File not found on disk: " << filePath << std::endl;
            return false;
        }

        std::ofstream outFile(filePath);
        if (!outFile) {
            std::cerr << "Unable to open file for editing: " << filePath << std::endl;
            return false;
        }
        outFile << newContent;
        outFile.close();

        return true;
    }
    catch (const std::exception& e) {
        std::cerr << "Error editing file: " << e.what() << std::endl;
        return false;
    }
}

std::string FileService::getSharingToken(int fileid, int userid) {
    if (!isFileOwner(fileid, userid)) {
        std::cerr << "User is not the owner of the file." << std::endl;
        return "";
    }
    try {
        SQLite::Statement query(db_, "SELECT shared_token FROM files WHERE id = ?");
        query.bind(1, fileid);
        if (query.executeStep()) {
            std::string sharedToken = query.getColumn(0).getString();
            if (!sharedToken.empty()) {
                return sharedToken;
            }
        }
        std::string newToken = generateShareToken();
        SQLite::Statement updateQuery(db_, "UPDATE files SET shared_token = ? WHERE id = ?");
        updateQuery.bind(1, newToken);
        updateQuery.bind(2, fileid);
        updateQuery.exec();
        return newToken;
    }
    catch (const std::exception& e) {
        std::cerr << "Error creating sharing URL: " << e.what() << std::endl;
        return "";
    }
}

int FileService::getFileIdBySharingToken(std::string shareToken) {
    try {
        SQLite::Statement query(db_, "SELECT id FROM files WHERE shared_token = ?");
        query.bind(1, shareToken);

        if (query.executeStep()) {
            return query.getColumn(0).getInt();
        }
        else {
            throw std::runtime_error("No file found with the given sharing token");
        }
    }
    catch (const std::exception& e) {
        std::cerr << "Database error in getFileIdBySharingToken: " << e.what() << std::endl;
        throw;
    }
}
std::string FileService::getFileContent(const int userid, int fileId) {
    try {
        SQLite::Statement query(db_, "SELECT owner, is_shared FROM files WHERE id = ?");
        query.bind(1, fileId);
        if (!query.executeStep()) {
            std::cerr << "File not found with ID: " << fileId << std::endl;
            return "";
        }
        int ownerId = query.getColumn(0).getInt();
        bool isShared = query.getColumn(1).getInt() != 0;
        if (userid != ownerId && !isShared) {
            std::cerr << "Access denied to file ID: " << fileId << std::endl;
            return "";
        }
        std::string filePath = getFilePath(fileId);
        std::ifstream inFile(filePath);
        if (!inFile) {
            std::cerr << "Unable to open file at path: " << filePath << std::endl;
            return "";
        }
        std::stringstream buffer;
        buffer << inFile.rdbuf();
        return buffer.str();
    }
    catch (const std::exception& e) {
        std::cerr << "Error in getFileContent: " << e.what() << std::endl;
        return "";
    }
}

std::vector<FileInfo> FileService::getAllUserFiles(int userId)
{
    std::vector<FileInfo> result; // Изменен тип возвращаемого вектора

    std::filesystem::path userDir = std::filesystem::path(userDataPath) / std::to_string(userId);

    // Проверка существования и типа пути
    if (!std::filesystem::exists(userDir) || !std::filesystem::is_directory(userDir))
    {
        std::cerr << "User directory not found or is not a directory: " << userDir << std::endl;
        // Если директория не существует, просто возвращаем пустой вектор
        return result;
    }

    try
    {
        // Итерация по файлам в директории пользователя
        for (const auto& entry : std::filesystem::directory_iterator(userDir))
        {
            if (entry.is_regular_file()) // Проверяем, что это обычный файл
            {
                try
                {
                    std::ifstream file(entry.path());
                    if (!file.is_open()) {
                        std::cerr << "Failed to open file: " << entry.path() << std::endl;
                        continue; // Пропускаем файл, если не удалось открыть
                    }

                    nlohmann::json data;
                    file >> data; // Читаем JSON из файла
                    file.close(); // Закрываем файл после чтения

                    // Создаем новый объект структуры FileInfo
                    FileInfo fileInfo;

                    // Получаем имя файла
                    fileInfo.file_name = entry.path().filename().string();
                    if (data.contains("character_name") && data["character_name"].is_string()) {
                        fileInfo.character_name = data["character_name"].get<std::string>();
                    }
                    else {
                        fileInfo.character_name = "Безымянный";
                        std::cerr << "Warning: 'character_name' missing or invalid in file: " << fileInfo.file_name << std::endl;
                    }
                    if (data.contains("image") && data["image"].is_string()) {
                        fileInfo.image = data["image"].get<std::string>();
                    }
                    else {
                        fileInfo.image = "";
                        std::cerr << "Warning: 'image' missing or invalid in file: " << fileInfo.file_name << std::endl;
                    }
                    result.push_back(fileInfo);

                }
                catch (const nlohmann::json::parse_error& e) {
                    // Обработка ошибок парсинга JSON (например, поврежденный файл)
                    std::cerr << "JSON parse error in file " << entry.path() << ": " << e.what() << std::endl;
                    // Можно пропустить этот файл
                }
                catch (const std::exception& e)
                {
                    // Обработка других исключений при обработке файла
                    std::cerr << "Failed to process file " << entry.path() << ": " << e.what() << std::endl;
                }
            }
        }
    }
    catch (const std::filesystem::filesystem_error& e)
    {
        // Обработка ошибок при итерации по директории (например, нет прав доступа)
        std::cerr << "Filesystem error while iterating user directory " << userDir << ": " << e.what() << std::endl;
        // В случае ошибки итерации, возвращаем то, что успели собрать, или пустой вектор
    }


    return result;
}


nlohmann::json FileService::generateTemplateCharacterList(const nlohmann::json& schema) {
    nlohmann::json j = {
        {"player_name", ""},
        {"character_name", "Новый Персонаж"}, // Более подходящее имя по умолчанию
        {"class", ""},
        {"race", ""},
        {"background", ""},
        {"alignment", ""},
        {"experience", 0},
        {"stats", { // Схема требует объект с конкретными полями integer
            {"str", 10}, // Часто стартовые статы 10 или 8, возьмем 10 как более "нейтральное"
            {"dex", 10},
            {"con", 10},
            {"int", 10},
            {"wis", 10},
            {"cha", 10}
        }},
        {"saving_throws", { // Схема требует объект с конкретными полями boolean
            {"str", false},
            {"dex", false},
            {"con", false},
            {"int", false},
            {"wis", false},
            {"cha", false}
        }},
        {"ac", 10}, // Дефолтный КД без доспехов
        {"speed", 30}, // Дефолтная скорость для большинства рас
        {"skills", { // Схема требует объект со всеми навыками как boolean
            {"acrobatics", false},
            {"animal_handling", false},
            {"arcana", false},
            {"athletics", false},
            {"deception", false},
            {"history", false},
            {"insight", false},
            {"intimidation", false},
            {"investigation", false},
            {"medicine", false},
            {"nature", false},
            {"perception", false},
            {"performance", false},
            {"persuasion", false},
            {"religion", false},
            {"sleight_of_hand", false},
            {"stealth", false},
            {"survival", false}
        }},
        {"personality", { // Схема требует объект с конкретными полями string
            {"traits", ""},
            {"ideals", ""},
            {"bonds", ""},
            {"flaws", ""}
        }},
        {"equipment", { // Структура соответствует схеме
            {"items", ""},
            {"pp", 0},
            {"gp", 0},
            {"ep", 0},
            {"sp", 0},
            {"cp", 0}
        }},
        {"hit_dice", { // Структура соответствует схеме
            {"value", ""},
            {"total", 0} // Обычно 0 для 1 уровня, или 1, зависит от логики игры
        }},
        {"hp", { // Схема требует объект с полями integer min 0
            {"max", 1}, // Максимум хитов для 1 уровня
            {"current", 1}, // Текущие хиты начинаются с максимума
            {"temp", 0} // Временные хиты
        }},
        {"inspiration", false}, // Схема требует boolean
        {"attacks_and_spells", { // Схема требует entries (array) и description (string)
            {"entries", nlohmann::json::array()}, // Начинаем с пустого списка атак
            {"description", ""} // Описание заклинаний/атак
        }},
        // --- Новые поля из схемы ---
        {"proficiency_bonus", 0}, // Схема требует integer min 0
        {"passive_perception", 0}, // Схема требует integer min 0 (обычно рассчитывается, но как поле - integer)
        {"other_proficiencies_languages", ""}, // Схема требует string
        {"features_traits", ""}, // Схема требует string
        {"death_saves", { // Схема требует объект с полями integer min 0, max 3
             {"successes", 0},
             {"failures", 0}
        }},
        {"image", "https://png.pngtree.com/png-vector/20220218/ourmid/pngtree-icon-of-a-users-profile-symbol-of-a-person-avataring-a-human-vector-image-with-white-background-vector-png-image_43983202.jpg"}
    };

    return j;
} //TODO убрать хардкод

bool FileService::updateFilename(int fileId, std::string newFilename) {
    try {
        SQLite::Statement query(db_, "UPDATE files SET file_name = ? WHERE id = ?");

        query.bind(1, newFilename);
        query.bind(2, fileId);

        query.exec();
        return true;
    }
    catch (const std::exception& e) {
        std::cerr << "SQLiteCpp error: " << e.what() << std::endl;
        return false;
    }
}
