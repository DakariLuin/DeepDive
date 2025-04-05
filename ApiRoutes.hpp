#pragma once

#include "Server.hpp"

class Api {
private:
    Server& server_;
    crow::response createUser(const crow::request& req) {
        crow::json::wvalue response;
        crow::json::rvalue jsonData = crow::json::load(req.body);

        std::string username;
        std::string password;

        int role = 0; // 0 - пользователь
        try
        {
            username = jsonData["username"].s();
            password = jsonData["password"].s();
        }
        catch (const std::exception& e)
        {
            response["status"] = "error";
            response["message"] = "invalid format of username or password";
            std::cerr << e.what() << '\n';
            return crow::response(400, response);
        }

        if (server_.createUser(username, password, role)) {
            response["status"] = "success";
            response["message"] = "user is created";
            return crow::response(201, response);
        }
        else {
            response["status"] = "error";
            response["message"] = "user is not created";
            return crow::response(409, response);
        }
    }

    crow::response authorizationUser(const crow::request& req) {
        crow::json::wvalue response;
        crow::json::rvalue json_data = crow::json::load(req.body);

        std::string username;
        std::string password;

        try {
            username = json_data["username"].s();
            password = json_data["password"].s();
        }
        catch (const std::exception& e) {
            response["status"] = "error";
            response["message"] = "invalid format of username or password";
            std::cerr << e.what() << '\n';
            return crow::response(400, response);
        }

        if (!server_.authorizationUser(username, password)) {
            response["status"] = "error";
            response["message"] = "user is not authorizated";
            return crow::response(401, response);
        }

        std::pair<std::string, std::string> tokens;
        tokens = server_.generateTokens(username);

        response["status"] = "success";
        response["access_token"] = tokens.first;
        response["refresh_token"] = tokens.second;

        return crow::response(200, response);
    }

    crow::response checkAccessToken(const crow::request& req) {
        crow::json::wvalue response;
        crow::json::rvalue json_data = crow::json::load(req.body);

        std::string username;
        std::string token;

        try
        {
            username = json_data["username"].s();
            token = json_data["token"].s();
        }
        catch (const std::exception& e)
        {
            response["status"] = "error";
            response["message"] = "invalid format of username or token";
            std::cerr << e.what() << '\n';
            return crow::response{ response };
        }

        if (!server_.checkAccessToken(username, token)) {
            response["status"] = "error";
            response["message"] = "invalid token";
            return crow::response{ response };
        }

        response["status"] = "ok";
        response["message"] = "token is valid";
        return crow::response{ response };
    }

    crow::response refreshAccesToken(const crow::request& req) {
        crow::json::wvalue response;
        crow::json::rvalue json_data = crow::json::load(req.body);

        std::string username;
        std::string token;

        try
        {
            username = json_data["username"].s();
            token = json_data["token"].s();
        }
        catch (const std::exception& e)
        {
            response["status"] = "error";
            response["message"] = "invalid format of username or token";
            std::cerr << e.what() << '\n';
            return crow::response{ response };
        }

        std::pair<std::string, std::string> tokens = server_.refreshAccesToken(username, token);

        if (tokens.first.empty()) {
            response["status"] = "error";
            response["message"] = "invalid token";
            return crow::response{ response };
        }

        response["status"] = "ok";
        response["accessToken"] = tokens.first;
        response["refreshToken"] = tokens.second;
        return crow::response{ response };
    }

public:
    Api(Server& server) : server_(server) {}

    void startApi() {
        CROW_ROUTE(server_.getApp(), "/api/createUser").methods("POST"_method)([this](const crow::request& req) { return createUser(req); });
        CROW_ROUTE(server_.getApp(), "/api/authorization").methods("POST"_method)([this](const crow::request& req) { return authorizationUser(req); });
        CROW_ROUTE(server_.getApp(), "/api/refreshAccesToken").methods("PUT"_method)([this](const crow::request& req) { return refreshAccesToken(req); });
        CROW_ROUTE(server_.getApp(), "/api/checkToken").methods("PUT"_method)([this](const crow::request& req) { return checkAccessToken(req); });
    }
};