#pragma once
#include <winsock2.h>
#include <crow.h>

#include <sqlite3.h>
#include <SQLiteCpp/SQLiteCpp.h>

#include "bcrypt/bcrypt.h"

#include <iostream>
#include <fstream>
#include <string>
#include "Validator.hpp"

#include <vector>
#include "jwt-cpp/jwt.h"

class Api;
class Front;

class Server
{
private:
    const int port_;
    const std::string ip_;
    crow::SimpleApp app_;
    Validator& validator_;
    SQLite::Database db_;
    std::string secretKey_;
    std::string secretKeyPath_ = "data/secret.txt";

    std::string generateToken(const std::string& userId, int expiresInSeconds) {
        return jwt::create()
            .set_issuer("auth_server")
            .set_type("JWT")
            .set_subject(userId)
            .set_issued_at(std::chrono::system_clock::now())
            .set_expires_at(std::chrono::system_clock::now() + std::chrono::seconds{ expiresInSeconds })
            .sign(jwt::algorithm::hs256{ secretKey_ });
    }

    void loadSecretKey(const std::string& filePath) {
        std::ifstream file(filePath);
        if (!file.is_open()) {
            std::cout << "Error: cannot open secret key file: " << filePath << '\n';
            std::exit(1);
        }
        std::getline(file, secretKey_);
        if (secretKey_.empty()) {
            std::cout << "Error: secret key file is empty: " << filePath << '\n';
            std::exit(1);
        }
    }

public:
    Server(const std::string& ip, const int port, Validator& validator, std::string dbPath) : ip_(ip), port_(port), validator_(validator), db_(dbPath, SQLite::OPEN_READWRITE | SQLite::OPEN_CREATE) {
        loadSecretKey(secretKeyPath_);
        try
        {
            db_.exec(R"(
                CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT,
                role INTEGER,
                access_token TEXT,
                refresh_token TEXT
                ))");
        }
        catch (const std::exception& e)
        {
            std::cout << "Database error: " << e.what() << '\n';
            std::exit(1);
        }
    }

    void runServer();

    crow::SimpleApp& getApp();

    bool createUser(std::string username, std::string password, int role) {
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

    bool authorizationUser(std::string username, std::string password) {
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

    std::pair<std::string, std::string> generateTokens(const std::string& username) {
        std::string accessToken = generateToken(username, 3600);  // 1 час
        std::string refreshToken = generateToken(username, 604800); // 7 дней

        SQLite::Statement query(db_, "UPDATE users SET access_token = ?, refresh_token = ? WHERE username = ?");
        query.bind(1, accessToken);
        query.bind(2, refreshToken);
        query.bind(3, username);
        query.exec();

        return { accessToken, refreshToken };
    }

    bool checkAccessToken(std::string username, std::string token) {
        try {
            std::string dbToken;
            SQLite::Statement query(db_, "SELECT access_token FROM users WHERE username = ?");
            query.bind(1, username);
            if (query.executeStep()) {
                dbToken = query.getColumn(0).getString();
            }
            else {
                return false;
            }

            if (token != dbToken) {
                return false;
            }

            auto decoded = jwt::decode(token);

            auto expClaim = decoded.get_expires_at();
            auto now = std::chrono::system_clock::now();
            if (expClaim <= now) {
                return false;
            }

            auto verifier = jwt::verify()
                .allow_algorithm(jwt::algorithm::hs256{ secretKey_ })
                .with_issuer("auth_server");

            verifier.verify(decoded);

            return true;
        }
        catch (const std::exception& e) {
            std::cerr << "token cheking error: " << e.what() << std::endl;
            return false;
        }
    }

    std::pair<std::string, std::string> refreshAccesToken(std::string username, std::string refreshToken) {
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
        if (checkAccessToken(username, storedAccessToken)) {
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
};

void Server::runServer() {
    app_.bindaddr(ip_).port(port_).multithreaded().run();
}

crow::SimpleApp& Server::getApp() {
    return app_;
}