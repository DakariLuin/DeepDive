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

    std::string generateToken(const std::string& userId, int expiresInSeconds) {
        return jwt::create()
            .set_issuer("auth_server")
            .set_type("JWT")
            .set_subject(userId)
            .set_issued_at(std::chrono::system_clock::now())
            .set_expires_at(std::chrono::system_clock::now() + std::chrono::seconds{ expiresInSeconds })
            .sign(jwt::algorithm::hs256{ secretKey_ });
    }

public:
    Server(const std::string& ip, const int port, Validator& validator, std::string dbPath) : ip_(ip), port_(port), validator_(validator), db_(dbPath, SQLite::OPEN_READWRITE | SQLite::OPEN_CREATE) {
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

};

void Server::runServer() {
    app_.bindaddr(ip_).port(port_).multithreaded().run();
}

crow::SimpleApp& Server::getApp() {
    return app_;
}