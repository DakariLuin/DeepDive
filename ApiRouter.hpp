#pragma once

#include "Services.hpp"

class Api {
private:
    AuthService authService_;
    UserService userService_;
    crow::SimpleApp& app_;

    crow::response createUser(const crow::request& req);

    crow::response authorizationUser(const crow::request& req);

    crow::response checkAccessToken(const crow::request& req);

    crow::response refreshAccesToken(const crow::request& req);

public:
    Api(crow::SimpleApp& app, SQLite::Database& db, std::string secretKey, Validator& validator) : app_(app), authService_(db, secretKey), userService_(db, validator) {}

    void startApi() {
        CROW_ROUTE(app_, "/api/createUser").methods("POST"_method)([this](const crow::request& req) { return createUser(req); });
        CROW_ROUTE(app_, "/api/authorization").methods("POST"_method)([this](const crow::request& req) { return authorizationUser(req); });
        CROW_ROUTE(app_, "/api/refreshAccesToken").methods("PUT"_method)([this](const crow::request& req) { return refreshAccesToken(req); });
        CROW_ROUTE(app_, "/api/checkToken").methods("PUT"_method)([this](const crow::request& req) { return checkAccessToken(req); });
    }
};