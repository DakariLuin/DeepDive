#pragma once

#include "Server.hpp"

class Api {
private:
    Server& server_;
    crow::response createUser(const crow::request& req) {
        crow::json::wvalue response;
        crow::json::rvalue json_data = crow::json::load(req.body);

        std::string username;
        std::string password;
        int role = 0; // 0 - пользователь

        try
        {
            username = json_data["username"].s();
            password = json_data["password"].s();
        }
        catch (const std::exception& e)
        {
            response["status"] = "error";
            response["message"] = "invalid format of username or password";
            std::cerr << e.what() << '\n';
            return crow::response{ response };
        }

        if (server_.createUser(username, password, role)) {
            response["status"] = "success";
            response["message"] = "user is created";
        }
        else {
            response["status"] = "error";
            response["message"] = "user is not created";
        }

        return crow::response{ response };
    }

    crow::response authorizationUser(const crow::request& req) {
        crow::json::wvalue response;
        crow::json::rvalue json_data = crow::json::load(req.body);

        std::string username;
        std::string password;

        bool result;
        result = server_.authorizationUser(username, password);

        if (!result) {
            response["status"] = "error";
            response["message"] = "user is not authorizated";
            return crow::response{ response };
        }

        std::pair<std::string, std::string> tokens;
        tokens = server_.generateTokens(username);

        response["status"] = "success";
        response["access_token"] = tokens.first;
        response["refresh_token"] = tokens.second;

        return crow::response{ response };
    }
public:
    Api(Server& server) : server_(server) {}

    void startApi() {
        CROW_ROUTE(server_.getApp(), "/api/createUser").methods("POST"_method)([this](const crow::request& req) { return createUser(req); });
        CROW_ROUTE(server_.getApp(), "/api/authorizationUser").methods("POST"_method)([this](const crow::request& req) { return authorizationUser(req); });
    }
};