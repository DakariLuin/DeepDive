#pragma once
#include <string>
#include <regex>
#include <iostream>

enum Status
{
    OK = 0,
    INVALID_CHARACTER,
    TOO_SHORT,
    TO_LONG,
    SHUD_BE_UNIQUE
};

class Validator
{
private:
    Validator() {};
    static const int COUNT_OF_ARGS_ = 3;
    std::string messageFail = "Please write arguments to program: <address> <port>\nFor example:\n\t127.0.0.1 8080";

public:
    Validator(const Validator&) = delete;
    Validator& operator=(const Validator&) = delete;

    static Validator& getInstance()
    {
        static Validator instance;
        return instance;
    }

    void validateAddress(const std::string& address)
    {
        std::regex addr_pattern("^([0-9]{1,3}\\.){3}[0-9]{1,3}$");

        // Проверка, соответствует ли адрес формату IPv4
        if (!std::regex_match(address, addr_pattern))
        {
            std::cout << "Invalid address format. Please use the format <xxx.xxx.xxx.xxx>" << std::endl;
            exit(1);
        }

        // Проверка, чтобы каждая часть адреса была в пределах от 0 до 255
        size_t pos = 0;
        int octet_count = 0;
        std::string addr_copy = address; // Сделаем копию, чтобы работать с ней
        while ((pos = addr_copy.find('.')) != std::string::npos)
        {
            int octet = std::stoi(addr_copy.substr(0, pos));
            if (octet < 0 || octet > 255)
            {
                std::cout << "Invalid address: octet out of range (0-255)." << std::endl;
                exit(1);
            }
            addr_copy.erase(0, pos + 1);
            octet_count++;
        }
        int last_octet = std::stoi(addr_copy);

        if (last_octet < 0 || last_octet > 255)
        {
            std::cout << "Invalid address: octet out of range (0-255)." << std::endl;
            exit(1);
        }

        if (octet_count != 3)
        {
            std::cout << "Invalid address: incorrect number of octets." << std::endl;
            exit(1);
        }
    }

    void validatePort(const std::string& port)
    {
        try
        {
            int port_num = std::stoi(port);
            if (port_num < 1024 || port_num > 65535)
            {
                std::cout << "Port must be in the range [1024-65535]." << std::endl;
                exit(1);
            }
        }
        catch (const std::invalid_argument&)
        {
            std::cout << "Invalid port: must be a valid integer." << std::endl;
            exit(1);
        }
    }

    void validateArgsCount(int argc)
    {
        // Проверка, что число аргументов верно
        if (argc != COUNT_OF_ARGS_)
        {
            std::cout << messageFail << std::endl;
            exit(1);
        }
    }

    bool validateUsername(const std::string& username)
    {
        const std::regex usernamePattern("^[a-zA-Z0-9_-]{3,30}$");
        return std::regex_match(username, usernamePattern);
    }

    bool validatePassword(const std::string& password)
    {
        const std::regex patternPassword("^(?=.*[a-zA-Z])(?=.*\\d)[a-zA-Z0-9$#%&*]{8,64}$");
        return std::regex_match(password, patternPassword);
    }
};