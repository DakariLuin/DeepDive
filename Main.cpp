// Подключаем заголовочные файлы
#include "Server.hpp"
#include "FrontRouter.hpp"
#include "ApiRouter.hpp"
#include "Validator.hpp"

// Настраиваем путь к статическим файлам
#define CROW_STATIC_DIRECTORY "static/"
#define CROW_STATIC_ENDPOINT "/static/<path>"

int main(int argc, char* argv[])
{
    // Валидируем и извлекаем параметры
    Validator& validator = Validator::getInstance();
    validator.validateArgsCount(argc);
    validator.validateAddress(argv[1]);
    validator.validatePort(argv[2]);

    std::string ip = argv[1];
    int port = std::stoi(argv[2]);

    Server server(ip, port, validator);

    server.runServer();
    return 0;
}

// Использовать синглтон для Api и Front возможно заприватить методы start