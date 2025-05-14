#pragma once

#include <crow.h>

class Front {
private:
    crow::SimpleApp& app_;

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
    Front(crow::SimpleApp& app) : app_(app) {}

    void startFront() {
        CROW_ROUTE(app_, "/")([this]() { return handlerHomePage(); });
        CROW_ROUTE(app_, "/Registration")([this]() { return handlerUserRegPage(); });
        CROW_ROUTE(app_, "/Authorization")([this]() { return handlerAuthorizationPage(); });
    }
};