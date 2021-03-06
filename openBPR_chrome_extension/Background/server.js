/**
Copyright 2014 - 2017 Cognizant Technology Solutions

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

function Server() {

}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.type) {
        case "sendMessageToServer":
            Server.send(message.data);
            break;
    }
});

Server.send = function (message) {
    sendToServer(message);
};

var websocket;
Server.socketURI = "ws://localhost:8080";

Server.findObjects = false;

var isConnecting = false;

Server.isRunning = function () {
    return isSocketOpen();
};

Server.startServer = function (callback) {
    if (!isSocketOpen()) {
        if (!isConnecting) {
            isConnecting = true;
            showNotification("Please wait.Trying to connect with App");
            websocket = new WebSocket(Server.socketURI);
            websocket.onmessage = function (evt) {
                socketMessage(JSON.parse(evt.data));
            };
            websocket.onopen = function (evt) {
                console.log("Connected");
                callback(true);
            };
            websocket.onerror = function (evt) {
                isConnecting = false;
                console.log("Connection Failed");
                callback(false, true);
            };
            websocket.onclose = function (evt) {
                isConnecting = false;
                console.log("Connection Closed");
                callback(false);
                stopAll();
            };
        }
    } else {
        callback(true);
    }
};

function socketMessage(message) {
    switch (message.action) {
        case "find":
            checkForObjectInContext(message);
            break;
        case "serverStop":
            stopAll();
            break;
        case "startSpy":
            startSpyFromServer();
            break;
        case "startHeal":
            startHealFromServer();
            break;
        case "startRecord":
            startRecordFromServer();
            break;
    }
}

var checkForObjectInContext = function (data) {
    if (Server.findObjects) {
        var message = { type: "findObject", data: data };
        sendMessageToAllTabs(message);
    }
};

function sendToServer(values) {
    if (isSocketOpen())
        websocket.send(values);
    else
        stopAll();
}

function isSocketOpen() {
    return websocket && websocket.readyState === WebSocket.OPEN;
}

Server.setSocketURI = function (socketuri) {
    Server.socketURI = socketuri;
    startServer();
};

function stopSocket() {
    if (!isSocketOpen()) {
        websocket.close();
    }
}