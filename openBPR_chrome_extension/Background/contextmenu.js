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

function ContextMenu() {

}

ContextMenu.forHeal = function () {
    ContextMenu.destroy();
    chrome.contextMenus.create(
        { "title": "SpyMode", "type": "checkbox", "onclick": toggleSpyForHeal });
};

ContextMenu.init = function () {
    ContextMenu.destroy();
    ContextMenuList.menus.forEach(function (menu) {
        chrome.contextMenus.create({ "title": menu.capitalize(), "contexts": ["all"], "id": menu });
    });
    for (var subMenu in ContextMenuList.subMenus) {
        chrome.contextMenus.create({ "title": subMenu, "contexts": ["all"], "id": subMenu });
        ContextMenuList.subMenus[subMenu].forEach(function (menu) {
            if (menu === "---")
                chrome.contextMenus.create({ "type": "separator", "parentId": subMenu });
            else
                chrome.contextMenus.create({ "title": menu.capitalize(), "parentId": subMenu, "contexts": ["all"], "id": menu });
        });
    }
    chrome.contextMenus.onClicked.addListener(contextClick);
};

ContextMenu.destroy = function () {
    chrome.contextMenus.onClicked.removeListener(contextClick);
    chrome.contextMenus.removeAll();
};

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

function contextClick(info, tab) {
    var menuText = info.menuItemId;
    var message;

    if (menuText.includes("Text")) {
        message = { type: "ContextMenu", command: menuText, getElement: true, getInput: true };
    }

    else if (menuText.includes("Title")) {
        message = { type: "ContextMenu", command: menuText, input: "@" + tab.title };
    }

    else if (menuText.includes("Url") || menuText === "Open") {
        message = { type: "ContextMenu", command: menuText, input: "@" + tab.url };
    }

    else if (menuText.includes("Add")) {
        switch (menuText) {
            case "AddElementWithInput":
                message = { type: "ContextMenu", getElement: true, getInput: true };
                break;
            case "AddElement":
                message = { type: "ContextMenu", getElement: true };
                break;
            case "AddBrowserWithInput":
                message = { type: "ContextMenu", getInput: true };
                break;
        }
    }

    else if (menuText.includes("Element")) {
        message = { type: "ContextMenu", command: menuText, getElement: true };
    }
    else if (menuText === "capturePageTimings") {
        message = { type: "ContextMenu", command: menuText, input: "@" + tab.title.split(" ")[0] };
    }
    else {
        message = { type: "ContextMenu", command: menuText };
    }

    sendMessageToTab(message, tab);
}