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
#include <crow/middlewares/cors.h>

class Server
{
private:
    const int port_;
    const std::string ip_;
    crow::App<crow::CORSHandler> app_;
    Validator& validator_;
    SQLite::Database db_;
    std::string secretKey_;
    std::string secretKeyPath_ = "data/secret.txt";
    std::string dbPath_ = "data/data.db";
    Api api;

    static std::string loadSecretKeyFromFile(const std::string& filePath) {
        std::ifstream file(filePath);
        if (!file.is_open()) {
            throw std::runtime_error("Error: cannot open secret key file: " + filePath);
        }

        std::string key;
        std::getline(file, key);
        if (key.empty()) {
            throw std::runtime_error("Error: secret key file is empty: " + filePath);
        }
        return key;
    }

    Server(const std::string& ip, int port, Validator& validator, SQLite::Database&& db, const std::string& secretKey)
        : ip_(ip),
        port_(port),
        validator_(validator),
        db_(std::move(db)),
        secretKey_(secretKey),
        api(app_, db_, secretKey_, validator_)
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
            std::cerr << "Database error: " << e.what() << '\n';
            throw; // выбрасываем исключение, чтобы избежать дальнейших проблем
        }

        try {
            db_.exec(R"(
                    CREATE TABLE IF NOT EXISTS files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    owner INTEGER NOT NULL,
                    filename TEXT NOT NULL,
                    filepath TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_shared BOOLEAN DEFAULT 0,
                    shared_token TEXT UNIQUE
                ))");
        }
        catch (const std::exception& e) {
            std::cerr << "Database error: " << e.what() << '\n';
            throw; // выбрасываем исключение, чтобы избежать дальнейших проблем
        }
    }

public:
    static Server create(const std::string& ip, int port, Validator& validator) {
        try {
            SQLite::Database db("data/data.db", SQLite::OPEN_READWRITE | SQLite::OPEN_CREATE);
            std::string secretKey = loadSecretKeyFromFile("data/secret.txt");
            return Server(ip, port, validator, std::move(db), secretKey);
        }
        catch (const std::exception& e) {
            std::cerr << "Failed to initialize Server: " << e.what() << std::endl;
            throw; // обработка ошибок при создании
        }
    }

    void runServer() {
        // Конфигурируем роуты
        api.startApi();

        auto& cors = app_.get_middleware<crow::CORSHandler>();
        cors.global()
            .origin("*")
            .headers("Content-Type", "Authorization")
            .methods(crow::HTTPMethod::Get, crow::HTTPMethod::Put, crow::HTTPMethod::Post, crow::HTTPMethod::Delete, crow::HTTPMethod::Options);

        CROW_ROUTE(app_, "/*").methods("GET"_method)
            ([this](const crow::request& req, crow::response& res) {
            std::string requested_path = req.url;

            if (!requested_path.empty() && requested_path[0] == '/') {
                requested_path = requested_path.substr(1);
            }

            std::string static_dir = CROW_STATIC_DIRECTORY;

            std::string file_to_serve;

            if (requested_path.empty() || requested_path == "index.html") {
                file_to_serve = static_dir + "index.html";
            }
            else {
                if (requested_path.find("..") != std::string::npos) {
                    res.code = 403;
                    res.end();
                    return;
                }
                file_to_serve = static_dir + requested_path;
            }

            struct stat buffer;
            if (stat(file_to_serve.c_str(), &buffer) == 0 && !(buffer.st_mode & S_IFDIR)) {
                res.set_static_file_info(file_to_serve);
            }
            else {
                res.set_static_file_info(static_dir + "index.html");
            }

            res.end();
                });



        app_.bindaddr(ip_).port(port_).multithreaded().run();
    }

    crow::App<crow::CORSHandler>& getApp() {
        return app_;
    }
};