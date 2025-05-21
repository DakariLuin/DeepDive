#pragma once

#include "Services.hpp"
#include <crow/middlewares/cors.h>

class Api {
private:
    AuthService authService_;
    UserService userService_;
    FileService fileService_;
    crow::App<crow::CORSHandler>& app_;

    bool checkAccessToken(const crow::request& req);

    crow::response createUser(const crow::request& req);
    crow::response authorizationUser(const crow::request& req);
    crow::response refreshAccesToken(const crow::request& req);

    crow::response getUserInfo(const crow::request& req);

    crow::response getFiles(const crow::request& req);
    crow::response getFile(const crow::request& req);
    crow::response createFile(const crow::request& req);
    crow::response editFile(const crow::request& req);
    crow::response deleteFile(const crow::request& req);
    crow::response shareFile(const crow::request& req);
    crow::response getSharedFile(const crow::request& req, const std::string& shareToken);
    std::string extractTokenFromRequest(const crow::request& req)
    {
        auto authHeader = req.get_header_value("Authorization");
        const std::string prefix = "Bearer ";
        if (authHeader.size() > prefix.size() && authHeader.compare(0, prefix.size(), prefix) == 0)
        {
            return authHeader.substr(prefix.size());
        }
        throw std::runtime_error("Authorization header missing or malformed");
    }

    std::string extractTokenFromBody(const crow::request& req)
    {
        auto json_data = crow::json::load(req.body);
        if (!json_data)
            throw std::runtime_error("Invalid JSON body");

        try
        {
            return json_data["token"].s();
        }
        catch (...)
        {
            throw std::runtime_error("Token missing in body");
        }
    }


public:
    Api(crow::App<crow::CORSHandler>& app, SQLite::Database& db, std::string secretKey, Validator& validator, std::string ip, int port) : app_(app), authService_(db, secretKey), userService_(db, validator), fileService_(ip, port, db, validator) {}

    void startApi() {
        CROW_ROUTE(app_, "/api/createUser").methods("POST"_method)([this](const crow::request& req) { return createUser(req); });
        CROW_ROUTE(app_, "/api/authorization").methods("POST"_method)([this](const crow::request& req) { return authorizationUser(req); });
        CROW_ROUTE(app_, "/api/refreshAccesToken").methods("PUT"_method)([this](const crow::request& req) { return refreshAccesToken(req); });

        CROW_ROUTE(app_, "/api/user").methods("GET"_method)([this](const crow::request& req) { return getUserInfo(req); });

        CROW_ROUTE(app_, "/api/files").methods("GET"_method)([this](const crow::request& req) { return getFiles(req); });
        CROW_ROUTE(app_, "/api/files/getFile").methods("GET"_method)([this](const crow::request& req) { return getFile(req); });
        CROW_ROUTE(app_, "/api/files/createFile").methods("POST"_method)([this](const crow::request& req) { return createFile(req); });
        CROW_ROUTE(app_, "/api/files/edit").methods("PUT"_method)([this](const crow::request& req) { return editFile(req); });
        CROW_ROUTE(app_, "/api/files/delete").methods("DELETE"_method)([this](const crow::request& req) { return deleteFile(req); });
        CROW_ROUTE(app_, "/api/files/share").methods("GET"_method)([this](const crow::request& req) { return shareFile(req); });
        CROW_ROUTE(app_, "/api/files/shared/<string>").methods("GET"_method)([this](const crow::request& req, const std::string& shareToken) {return getSharedFile(req, shareToken);});
        CROW_ROUTE(app_, "/api/protected").methods("POST"_method)([this](const crow::request& req) { // Тестовый роут
            if (checkAccessToken(req)) {
                return crow::response(200);
            }
            else {
                return crow::response(400);
            };
            });
    }
};