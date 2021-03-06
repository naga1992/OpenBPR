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

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        resetOptions();
    } else if (details.reason == "update") {
        var thisVersion = chrome.runtime.getManifest().version;
        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
        resetOptions();
    }
});


function resetOptions() {
    var defaultData = {
        "AttributeOrder": [
            "placeholder", "title", "value", "name", "type", "action", "onclick"
        ],
        "ObjectPropertyList": [
            { "grab": "true", "type": "id" },
            { "grab": "true", "type": "name" },
            { "grab": "true", "type": "class" },
            { "grab": "true", "type": "link_text" },
            { "grab": "true", "type": "xpath" },
            { "grab": "true", "type": "relative_xpath" },
            { "grab": "true", "type": "css" }
        ],
        "UserObjectPropertyList": [
        ],
        "XpathOrder": [
            { "grab": "true", "type": "IdRelative", "format": "(//div[@id='gs_lc0']/input)[1]" },
            { "grab": "true", "type": "Attribute", "format": "//input[@name='bSubmit']", "advance": "<input id = \"attributeOrder\" class = \"form-control\" style = \"width:500px;\" value = \"placeholder, title, value, name, type, action, onclick\">" },
            { "grab": "true", "type": "Image", "format": "//img[@alt='Logo']" },
            { "grab": "true", "type": "Link", "format": "//a[contains(text(),'Gmail')]" },
            { "grab": "true", "type": "Href", "format": "(//a[contains(@href, 'https://mail.google.com/mail/?tab=wm&authuser=0')])[1]" },
            { "grab": "true", "type": "Text", "format": "//*[text()='System Status']", "advance": "<input type=\"checkbox\" style = \"width: 20px;height: 20px;\"><label>Tag</label><input type=\"checkbox\" style = \"width: 20px;height: 20px;\"><label>Contains</label>" },
            { "grab": "true", "type": "Position", "format": "//p[2]/em" },
            { "grab": "true", "type": "Text and Class", "format": "//*[text()='System Status'][@class='ux-desktop-shortcut-text']", "advance": "<input type=\"checkbox\" style = \"width: 20px;height: 20px;\"><label>Tag</label><input type=\"checkbox\" style = \"width: 20px;height: 20px;\"><label>Contains</label>" }
        ],
        "highlightColor": "#0080c0",
        "highlightColorBg": "rgba(192,192,192,0.3)",
        "socketHost": "localhost",
        "socketPort": "8887"
    };

    chrome.storage.sync.set({
        "socketHost": defaultData.socketHost,
        "socketPort": defaultData.socketPort,
        "socketURI": "ws://" + defaultData.socketHost + ":" + defaultData.socketPort,
        "highlightColor": defaultData.highlightColor,
        "highlightColorBg": defaultData.highlightColorBg,
        "AttributeOrder": [
            "placeholder", "title", "value", "name", "type", "action", "onclick"
        ],
        "ObjectPropertyList": defaultData.ObjectPropertyList,
        "UserObjectPropertyList": defaultData.UserObjectPropertyList,
        "XpathOrder": defaultData.XpathOrder
    }, function () {
    }
    );

}

chrome.browserAction.onClicked.addListener(checkForConnection);

function checkForConnection() {
    if (Server.isRunning())
        toggleAll();
    Server.startServer(function (connected, showErrorMessage) {
        if (!connected) {
            if (showErrorMessage) {
                showNotification("Error in connecting .Refer FAQ");
            }
        }
    });
}

chrome.commands.onCommand.addListener(function (command) {
    switch (command) {
        case "Toggle Spy":
            toggleSpyForHeal();
            break;
        case "Open Options":
            openOptions();
            break;
    }
});

//Listen to changes in chrome local storage
chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (key in changes) {
        var storageChange = changes[key];
        switch (key) {
            case "socketURI":
                Server.setSocketURI(storageChange.newValue);
                break;
        }
    }
});

//Load socketUrl from Storage First Time
chrome.storage.sync.get({
    socketURI: "ws://localhost:8887"
}, function (data) {
    Server.socketURI = data.socketURI;
});

function toggleAll() {
    getStatus(function (data) {
        chrome.browserAction.getBadgeText({},
            function (bdata) {
                if (bdata === "H" | bdata === "HS")
                    toggleHeal(data.healMode === "on");
                else if (bdata === "S")
                    toggleSpy(data.spyMode === "on");
                else if (bdata === "R")
                    toggleRecord(data.recordMode === "on");
            });

    });
}

function toggleSpyForHeal() {
    getStatus(function (data) {
        if (data.healMode === "on") {
            var sMode = data.spyMode === "on";
            var text = sMode ? "H" : "HS";
            toggleSpy(sMode, function () {
                setBadgeText(text);
            });
        } else {
            showNotification("App Not Running in Heal Mode");
        }
    });
}

function toggleSpy(isSpyOn, callback) {
    if (isSpyOn) {
        stopSpy();
        changeBadgeColor();
        callback();
    }
    else {
        startSpyFromServer(callback);
    }
}

function toggleHeal(isHealOn) {
    if (isHealOn) {
        stopHeal();
        stopSpy();
        changeBadgeColor();
    }
    else {
        startHealFromServer();
    }
}

function toggleRecord(isRecordOn) {
    if (isRecordOn) {
        stopRecord();
        changeBadgeColor();
    }
    else {
        startRecordFromServer();
    }
}

function startSpy(messageFromUI, callback) {
    Server.startServer(function (connected, showErrorMessage) {
        if (connected) {
            chrome.storage.sync.set({
                spyMode: "on"
            }, function () {
                var message = { type: "StartSpy" };
                sendMessageToAllTabs(message);
                showNotification(messageFromUI);
            });
        }
        else {
            if (showErrorMessage) {
                showNotification("Error in connecting App Refer FAQ");
            }
            callback();
        }
    });
}

function startSpyFromServer(callback) {
    chrome.storage.sync.set({
        spyMode: "on"
    }, function () {
        var message = { type: "StartSpy" };
        sendMessageToAllTabs(message);
        showNotification("Press Ctrl+RightClick to Save/Update the highlighted Object");
        setBadgeText("S");
        callback();
    });
}

function stopSpy() {
    chrome.storage.sync.set({
        spyMode: "off"
    }, function () {
        var message = { type: "StopSpy" };
        sendMessageToAllTabs(message);
    });
}


function startHeal(messageFromUI, callback) {
    Server.startServer(function (connected, showErrorMessage) {
        if (connected) {
            chrome.storage.sync.set({
                healMode: "on"
            }, function () {
                Server.findObjects = true;
                ContextMenu.forHeal();
                showNotification(messageFromUI);
            });
        }
        else {
            Server.findObjects = false;
            if (showErrorMessage) {
                showNotification("Error in connecting App Refer FAQ");
            }
            callback();
        }
    });
}

function startHealFromServer() {
    chrome.storage.sync.set({
        healMode: "on"
    }, function () {
        Server.findObjects = true;
        ContextMenu.forHeal();
        showNotification("Select the object in tree to highlight, Press Alt+S to enable Spy");
        setBadgeText("H");
    });
}

function stopHeal() {
    chrome.storage.sync.set({
        healMode: "off"
    }, function () {
        Server.findObjects = false;
        var message = { type: "StopHeal" };
        sendMessageToAllTabs(message);
    });
}

function startRecord(messageFromUI, callback) {

    Server.startServer(function (connected, showErrorMessage) {
        if (connected) {
            chrome.storage.sync.set({
                recordMode: "on"
            }, function () {
                var message = { type: "StartRecord" };
                sendMessageToAllTabs(message);
                ContextMenu.init();
                window.alert("Please refresh the page before start recording")
                showNotification(messageFromUI);
                
            });
        }
        else {
            if (showErrorMessage) {
                showNotification("Error in connecting App Refer FAQ");
            }
            callback();
        }
    });
}

function startRecordFromServer() {
    chrome.storage.sync.set({
        recordMode: "on"
    }, function () {
        var message = { type: "StartRecord" };
        sendMessageToAllTabs(message);
        ContextMenu.init();
        showNotification("Check Context menu for assertions and other functionalities");
        setBadgeText("R");
        showNotification("Please Refresh Page")
    });
}

function stopRecord() {
    chrome.storage.sync.set({
        recordMode: "off"
    }, function () {
        var message = { type: "StopRecord" };
        sendMessageToAllTabs(message);
        ContextMenu.destroy();
    });
}

function stopAll() {
    stopSpy();
    stopHeal();
    stopRecord();
    setBadgeText("");
}

function sendMessageToAllTabs(message) {
    chrome.tabs.query({}, function (tabs) {
        for (i = tabs.length - 1; i >= 0; i--) {
            chrome.tabs.sendMessage(tabs[i].id, message);
        }
    });
}

function sendMessageToTab(message, tab) {
    if (message) {
        chrome.tabs.sendMessage(tab.id, message);
    }
}

function showNotification(message) {
    var n = new Notification(message);
    n.onshow = function () {
        setTimeout(n.close.bind(n), 3000);
    };
}

function setBadgeText(btext) {
    chrome.browserAction.setBadgeText({ text: btext });
    chrome.browserAction.setBadgeBackgroundColor({ color: "#145912" });
}

function changeBadgeColor() {
    chrome.browserAction.setBadgeBackgroundColor({ color: "#b93904" });
}


function getStatus(callback) {
    chrome.storage.sync.get({
        spyMode: "off",
        healMode: "off",
        recordMode: "off"
    }, function (data) {
        callback(data);
    });
}

function openOptions() {
    if (chrome.runtime.openOptionsPage) {
        // New way to open options pages, if supported (Chrome 42+).
        chrome.runtime.openOptionsPage();
    } else {
        // Reasonable fallback.
        window.open(chrome.runtime.getURL('Options/index.html'));
    }
}