#pragma once

#include <winsock2.h>
#include <crow.h>
#include <sys/stat.h>

#include <sqlite3.h>
#include <SQLiteCpp/SQLiteCpp.h>

#include "jwt-cpp/jwt.h"
#include "bcrypt/bcrypt.h"

#include "Validator.hpp"
#include <nlohmann/json.hpp>
#include <vector>

class AuthService {
private:
    SQLite::Database& db_;
    std::string secretKey_;

    std::string generateToken(int userId, int expiresInSeconds);

public:
    AuthService(SQLite::Database& db, std::string secretKey);
    std::pair<std::string, std::string> generateTokens(int userId);
    bool checkAccessToken(std::string token);
    std::pair<std::string, std::string> refreshAccesToken(std::string refreshToken);
    int extractUserIdFromToken(const std::string& token);
};

class UserService {
private:
    SQLite::Database& db_;
    Validator& validator_;
public:
    UserService(SQLite::Database& db, Validator& validator);
    int getUserId(const std::string& username);
    bool createUser(std::string username, std::string password, int role);
    bool authorizationUser(std::string username, std::string password);
    crow::response changeUsername(const crow::request& req);
    crow::response changeUserPassword(const crow::request& req);
    crow::response changeUserRole(const crow::request& req);
    std::vector<std::string> getUserInfo(int userId);
};


struct FileInfo {
    std::string character_name;
    std::string file_name;
    std::string image;
};

class FileService {
private:
    SQLite::Database& db_;
    const std::string userDataPath = "./data/usersFiles";
    Validator& validator_;
    const int port_;
    const std::string ip_;
    nlohmann::json schema_;
    std::string schemaPath_ = "./data/schema";

    std::string generateShareToken();
    std::string getFilePath(int fileid);
    bool isFileOwner(int fileid, int userid);
    nlohmann::json generateTemplateCharacterList(const nlohmann::json& schema);
public:
    FileService(const std::string& ip, int port, SQLite::Database& db, Validator& validator);
    bool createUserFolder(std::string username);
    int createNewFile(int userId);
    bool deleteFile(int fileid, int userid);
    bool editFile(int fileid, const std::string& newContent, int userid);
    std::string getSharingToken(int fileid, int userid);
    int getFileIdBySharingToken(std::string shareToken);
    bool updateFilename(int fileId, std::string newCharacterName);
    std::string getFileContent(const int userid, int fileId);
    std::vector<FileInfo> getAllUserFiles(const int userid);
};