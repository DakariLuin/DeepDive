#pragma once

#include "Services.hpp"
#include <crow/middlewares/cors.h>

class Api {
private:
    AuthService authService_;
    UserService userService_;
    crow::App<crow::CORSHandler>& app_;

    crow::response createUser(const crow::request& req);

    crow::response authorizationUser(const crow::request& req);

    bool checkAccessToken(const crow::request& req);

    crow::response refreshAccesToken(const crow::request& req);


public:
    Api(crow::App<crow::CORSHandler>& app, SQLite::Database& db, std::string secretKey, Validator& validator) : app_(app), authService_(db, secretKey), userService_(db, validator) {}

    void startApi() {
        CROW_ROUTE(app_, "/api/createUser").methods("POST"_method)([this](const crow::request& req) { return createUser(req); });
        CROW_ROUTE(app_, "/api/authorization").methods("POST"_method)([this](const crow::request& req) { return authorizationUser(req); });
        CROW_ROUTE(app_, "/api/refreshAccesToken").methods("PUT"_method)([this](const crow::request& req) { return refreshAccesToken(req); });
        CROW_ROUTE(app_, "/api/protected").methods("POST"_method)([this](const crow::request& req) {
            if (checkAccessToken(req)) {
                return crow::response(200);
            }
            else {
                return crow::response(400);
            };
            });
    }
};