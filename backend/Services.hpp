#pragma once

#include <winsock2.h>
#include <crow.h>
#include <sys/stat.h>

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
    bool checkAccessToken(std::string token);
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

class FileService {
private:
    SQLite::Database& db_;
    const std::string userDataPath = "./data/usersFiles";
    Validator& validator_;
    const int port_;
    const std::string ip_;
    nlohmann::json schema_;
    std::string schemaPath_ = "data/schema";

    std::string generateShareToken();
    std::string getFilePath(int fileid);
    bool isFileOwner(int fileid, int userid);
public:
    FileService(const std::string& ip, int port, SQLite::Database& db, Validator& validator);
    bool createUserFolder(std::string username);
    int createNewFile(int userId, const std::string& filename, const std::string& content);
    bool deleteFile(int fileid, int userid);
    bool editFile(int fileid, const std::string& newContent, int userid);
    std::string createSharingURL(int fileid, int userid);
    std::string getFileContent(const int userid, int fileId);
    std::string getAllUserFiles(const int userid, int fileId);
};