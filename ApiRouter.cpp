#include "Services.hpp"
#include "ApiRouter.hpp"

crow::response Api::createUser(const crow::request& req) {
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

    if (userService_.createUser(username, password, role)) {
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

crow::response Api::authorizationUser(const crow::request& req) {
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

    if (!userService_.authorizationUser(username, password)) {
        response["status"] = "error";
        response["message"] = "user is not authorizated";
        return crow::response(401, response);
    }

    std::pair<std::string, std::string> tokens;
    tokens = authService_.generateTokens(username);

    response["status"] = "success";
    response["access_token"] = tokens.first;
    response["refresh_token"] = tokens.second;

    return crow::response(200, response);
}

crow::response Api::checkAccessToken(const crow::request& req) {
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

    if (!authService_.checkAccessToken(username, token)) {
        response["status"] = "error";
        response["message"] = "invalid token";
        return crow::response{ response };
    }

    response["status"] = "ok";
    response["message"] = "token is valid";
    return crow::response{ response };
}

crow::response Api::refreshAccesToken(const crow::request& req) {
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

    std::pair<std::string, std::string> tokens = authService_.refreshAccesToken(username, token);

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