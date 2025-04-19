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

#include "ApiRouter.hpp"
#include "FrontRouter.hpp"

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
    std::string dbPath_ = "data/data.db";
    Api api;
    Front front;

    static std::string loadSecretKeyFromFile(const std::string& filePath) {
        std::ifstream file(filePath);
        if (!file.is_open()) {
            std::cout << "Error: cannot open secret key file: " << filePath << '\n';
            std::exit(1);
        }

        std::string key;
        std::getline(file, key);
        if (key.empty()) {
            std::cout << "Error: secret key file is empty: " << filePath << '\n';
            std::exit(1);
        }
        return key;
    }

    Server(const std::string& ip, int port, Validator& validator, SQLite::Database&& db, const std::string& secretKey)
        : ip_(ip),
        port_(port),
        validator_(validator),
        db_(std::move(db)),
        secretKey_(secretKey),
        api(app_, db_, secretKey_, validator_),
        front(app_)
    {
        try {
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
        catch (const std::exception& e) {
            std::cout << "Database error: " << e.what() << '\n';
            std::exit(1);
        }
    }

public:
    Server(const std::string& ip, int port, Validator& validator)
        : Server(ip, port, validator,
            SQLite::Database(dbPath_, SQLite::OPEN_READWRITE | SQLite::OPEN_CREATE),
            loadSecretKeyFromFile(secretKeyPath_))
    {
    }

    void runServer();
    crow::SimpleApp& getApp();
};


void Server::runServer() {
    // Конфигурируем роуты
    api.startApi();
    front.startFront();

    app_.bindaddr(ip_).port(port_).multithreaded().run();
}

crow::SimpleApp& Server::getApp() {
    return app_;
}