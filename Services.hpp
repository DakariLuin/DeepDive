#pragma once

#include <winsock2.h>
#include <crow.h>

#include <sqlite3.h>
#include <SQLiteCpp/SQLiteCpp.h>

#include "jwt-cpp/jwt.h"
#include "bcrypt/bcrypt.h"

#include "Validator.hpp"

class AuthService {
private:
    SQLite::Database& db_;
    std::string secretKey_;

    std::string generateToken(const std::string& userId, int expiresInSeconds);

public:
    AuthService(SQLite::Database& db, std::string secretKey);
    std::pair<std::string, std::string> generateTokens(const std::string& username);
    bool checkAccessToken(std::string username, std::string token);
    std::pair<std::string, std::string> refreshAccesToken(std::string username, std::string refreshToken);
};

class UserService {
private:
    SQLite::Database& db_;
    Validator& validator_;
public:
    UserService(SQLite::Database& db, Validator& validator);

    bool createUser(std::string username, std::string password, int role);
    bool authorizationUser(std::string username, std::string password);
    crow::response changeUsername(const crow::request& req);
    crow::response changeUserPassword(const crow::request& req);
    crow::response changeUserRole(const crow::request& req);
};