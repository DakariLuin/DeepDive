#pragma once

#include "Server.hpp"

class Front {
private:
    Server& server_;

    crow::response handlerHomePage() {
        return crow::response{ crow::mustache::load("Index.html").render() };
    }

    crow::response handlerUserRegPage() {
        return crow::response{ crow::mustache::load("Registration.html").render() };
    }

    crow::response handlerAuthorizationPage() {
        return crow::response{ crow::mustache::load("Authorization.html").render() };
    }

public:
    Front(Server& server) : server_(server) {}

    void startFront() {
        CROW_ROUTE(server_.getApp(), "/")([this]() { return handlerHomePage(); });
        CROW_ROUTE(server_.getApp(), "/Registration")([this]() { return handlerUserRegPage(); });
        CROW_ROUTE(server_.getApp(), "/Authorization")([this]() { return handlerAuthorizationPage(); });
    }
};