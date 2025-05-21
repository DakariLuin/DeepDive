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
    int userId = userService_.getUserId(username);

    if (userId == -1) {
        response["status"] = "error";
        response["message"] = "user is not authorizated";
        return crow::response(401, response);
    }

    tokens = authService_.generateTokens(userId);

    response["status"] = "success";
    response["access_token"] = tokens.first;
    response["refresh_token"] = tokens.second;

    return crow::response(200, response);
}

bool Api::checkAccessToken(const crow::request& req) {
    crow::json::rvalue json_data = crow::json::load(req.body);

    std::string token;

    try
    {
        token = json_data["token"].s();
    }
    catch (const std::exception& e)
    {
        return false;
    }

    if (!authService_.checkAccessToken(token)) {
        return false;
    }

    return true;
}

crow::response Api::refreshAccesToken(const crow::request& req) {
    crow::json::wvalue response;
    crow::json::rvalue json_data = crow::json::load(req.body);

    std::string token;

    try
    {
        token = json_data["token"].s();
    }
    catch (const std::exception& e)
    {
        response["status"] = "error";
        response["message"] = "invalid format of username or token";
        std::cerr << e.what() << '\n';
        return crow::response{ response };
    }

    std::pair<std::string, std::string> tokens = authService_.refreshAccesToken(token);

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

crow::response Api::getFiles(const crow::request& req)
{
    try {
        auto token = extractTokenFromRequest(req);
        if (!authService_.checkAccessToken(token)) {
            return crow::response(401, "Unauthorized");
        }

        int userId = authService_.extractUserIdFromToken(token);
        auto files = fileService_.getAllUserFiles(userId);
        crow::json::wvalue response;

        response["files"] = crow::json::wvalue::list();

        int index = 0;
        for (const auto& fileInfo : files)
        {
            crow::json::wvalue fileJson;
            fileJson["character_name"] = fileInfo.character_name;
            fileJson["file_name"] = fileInfo.file_name;
            fileJson["image"] = fileInfo.image;
            response["files"][index++] = std::move(fileJson);
        }
        return crow::response(200, response);
    }
    catch (const std::exception& e) {
        std::cerr << "Api::getFiles error: " << e.what() << std::endl;
        return crow::response(500, "Internal Server Error");
    }
}

crow::response Api::getFile(const crow::request& req)
{
    try {
        auto token = extractTokenFromRequest(req);
        if (!authService_.checkAccessToken(token)) {
            return crow::response(401, "Unauthorized");
        }

        int userId = authService_.extractUserIdFromToken(token);

        auto urlParams = crow::query_string(req.url_params);
        if (!urlParams.get("fileId")) {
            return crow::response(400, "Missing fileId parameter");
        }

        int fileId = 0;
        try {
            fileId = std::stoi(urlParams.get("fileId"));
        }
        catch (...) {
            return crow::response(400, "Invalid fileId parameter");
        }

        std::string content = fileService_.getFileContent(userId, fileId);
        if (content.empty()) {
            std::cerr << "404! getFile error FILE not found: " << std::endl;
            return crow::response(404, "File not found or access denied");
        }

        return crow::response(200, content);
    }
    catch (const std::exception& e) {
        std::cerr << "getFile error: " << e.what() << std::endl;
        return crow::response(500, "Internal Server Error");
    }
}

crow::response Api::createFile(const crow::request& req)
{
    try {
        auto token = extractTokenFromRequest(req);

        if (!authService_.checkAccessToken(token)) {
            return crow::response(401, "Unauthorized");
        }

        int userId = authService_.extractUserIdFromToken(token);
        int fileId = fileService_.createNewFile(userId);
        if (fileId == -1) {
            return crow::response(500, "Failed to create file");
        }

        crow::json::wvalue response;
        response["file_name"] = fileId;
        response["character_name"] = "Безымянный";

        return crow::response(200, response);
    }
    catch (const std::exception& e) {
        std::cerr << "createFile error: " << e.what() << std::endl;
        return crow::response(500, "Internal Server Error");
    }
}

crow::response Api::editFile(const crow::request& req)
{
    try {
        auto json_data = crow::json::load(req.body);
        if (!json_data)
            return crow::response(400, "Invalid JSON");

        if (!json_data.has("token") || !json_data.has("fileId") || !json_data.has("content"))
            return crow::response(400, "Missing fields");

        std::string token = json_data["token"].s();
        if (!authService_.checkAccessToken(token))
            return crow::response(401, "Unauthorized");

        int userId = authService_.extractUserIdFromToken(token);
        int fileId = json_data["fileId"].i();
        std::string newContent = json_data["content"].s();

        std::string newCharacterName;

        try {
            auto parsed = crow::json::load(newContent);
            if (!parsed) {
                std::cerr << "Failed to parse newContent" << std::endl;
            }
            else if (parsed.has("character_name")) {
                newCharacterName = parsed["character_name"].s();
            }
        }
        catch (const std::exception& e) {
            std::cerr << "JSON parse error: " << e.what() << std::endl;
        }

        bool success = fileService_.editFile(fileId, newContent, userId);
        if (!success)
            return crow::response(403, "Forbidden or invalid content");

        if (!newCharacterName.empty()) {
            fileService_.updateFilename(fileId, newCharacterName);
        }
        return crow::response(200, "File edited successfully");
    }
    catch (const std::exception& e) {
        std::cerr << "editFile error: " << e.what() << std::endl;
        return crow::response(500, "Internal Server Error");
    }
}

crow::response Api::deleteFile(const crow::request& req)
{
    try {
        std::string token = extractTokenFromRequest(req);
        if (!authService_.checkAccessToken(token))
            return crow::response(401, "Unauthorized");

        const char* fileIdStr = req.url_params.get("fileId");
        if (!fileIdStr)
            return crow::response(400, "Missing fileId");

        int fileId;
        try {
            fileId = std::stoi(fileIdStr);
        }
        catch (...) {
            return crow::response(400, "Invalid fileId");
        }

        int userId = authService_.extractUserIdFromToken(token);
        bool success = fileService_.deleteFile(fileId, userId);
        if (!success)
            return crow::response(403, "Forbidden or file not found");

        return crow::response(200, "File deleted successfully");
    }
    catch (const std::exception& e) {
        std::cerr << "deleteFile error: " << e.what() << std::endl;
        return crow::response(500, "Internal Server Error");
    }
}

crow::response Api::shareFile(const crow::request& req) {
    try {
        std::string token = extractTokenFromRequest(req);
        if (!authService_.checkAccessToken(token))
            return crow::response(401, "Unauthorized");

        const char* fileIdStr = req.url_params.get("fileId");
        if (!fileIdStr)
            return crow::response(400, "Missing fileId");

        int fileId;
        try {
            fileId = std::stoi(fileIdStr);
        }
        catch (...) {
            return crow::response(400, "Invalid fileId");
        }

        int userId = authService_.extractUserIdFromToken(token);

        std::string url = fileService_.getSharingToken(fileId, userId);
        if (url.empty())
            return crow::response(403, "Forbidden or file not found");

        crow::json::wvalue res;
        res["url"] = url;
        std::cout << url;
        return crow::response(200, res);
    }
    catch (const std::exception& e) {
        std::cerr << "shareFile error: " << e.what() << std::endl;
        return crow::response(500, "Internal Server Error");
    }
}

crow::response Api::getSharedFile(const crow::request& req, const std::string& shareToken) {
    try {
        std::string token = extractTokenFromRequest(req);
        if (!authService_.checkAccessToken(token))
            return crow::response(401, "Unauthorized");
        int userId = authService_.extractUserIdFromToken(token);

        int fileId = -1;
        fileId = fileService_.getFileIdBySharingToken(shareToken);

        if (fileId == -1) {
            return crow::response(404, "Invalid or expired sharing token");
        }

        std::string fileContent = fileService_.getFileContent(userId, fileId);
        crow::json::wvalue res;
        res["content"] = fileContent;
        return res;
    }
    catch (const std::exception& e) {
        std::cout << shareToken << std::endl;
        std::cerr << e.what() << std::endl;
        return crow::response(500, "Error retrieving shared file");
    }
}


crow::response Api::getUserInfo(const crow::request& req) {
    try {
        std::string token = extractTokenFromRequest(req);
        std::cout << token;

        if (!authService_.checkAccessToken(token)) {
            return crow::response(401, "Invalid token");
        }

        int userId = authService_.extractUserIdFromToken(token); // или authService_

        auto userInfo = userService_.getUserInfo(userId);
        if (userInfo.empty()) {
            return crow::response(404, "User not found");
        }

        crow::json::wvalue result;
        result["id"] = userInfo[0];
        result["username"] = userInfo[1];
        result["role"] = userInfo[2];

        return crow::response{ result };

    }
    catch (const std::exception& e) {
        return crow::response(401, e.what());
    }
}