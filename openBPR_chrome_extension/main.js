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

var previousElement;

//Browser Api
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	console.log(JSON.stringify(message))
    switch (message.type) {
        case "StartSpy":
            Spy.register();
            break;
        case "StopSpy":
            Spy.deregister();
            break;
        case "StartRecord":
            Recorder.register();
            break;
        case "StopRecord":
            Recorder.deregister();
            break;
        case"findObject":
            Heal.search(message.data);
            break;
        case"StopHeal":
            Heal.deregister();
            break;
        case"ContextMenu":
            Recorder.recordContextEvent(message);
            break;
    }
});

function openBPR() {
}

openBPR.deHighlightPreviousElement = function () {
    Util.deghlightElement(previousElement);
};

openBPR.sendSpiedObject = function (element, flag) {
    var data = {};
    data.type = "Object";
    data.action = flag ? "SAVE" : "PREV";
    setObjectProperties(element, data);
    sendValues(JSON.stringify(data));
};

openBPR.sendHealResult = function (data) {
    data.action = "heal";
    sendValues(JSON.stringify(data));
};

openBPR.sendRecordedObject = function (element, method, input) {
    var data = {};
    data.action = "record";
    data.method = method;
    data.input = input;
    setObjectProperties(element, data);
    sendValues(JSON.stringify(data));
};

openBPR.getFrameValue = function () {
    return getFrameData();
};

function setObjectProperties(element, data) {
    if (element)
        setObjectPropertiesForElement(element, data);
    else
        setObjectPropertiesForBrowser(data);
}

function setObjectPropertiesForElement(element, data) {
    openBPR.deHighlightPreviousElement();
    previousElement = element;
    Util.highlightElement(element);
    data.type = "Object";
    data.page = {};
    data.page.title = getTitle();
    data.prop = Properties.getProperties(element);
    data.frame = getFrameData();
    data.objectname = Object.getObjectName(element, data.prop);
}

function setObjectPropertiesForBrowser(data) {
    data.type = "Browser";
}

function getTitle() {
    return document.title ? document.title : "Page";
}

function getFrameData() {
    try {
        if (window.frameElement) {
            if (window.frameElement.name)
                return window.frameElement.name;
            else if (window.frameElement.id)
                return window.frameElement.id;
            else {
                var x = window.frameElement.parentElement;
                for (var i = 0; i < x.children.length; i++)
                    if (x.children[i] === window.frameElement)
                        return i;
            }
        }
    }
    catch (Exception) {
        console.log("Error accessing frame value");
        console.log(Exception);
    }
    finally {
        try {
            var frameLength = window.parent.frames.length;
            if (frameLength > 0) {
                for (var i = 0; i < frameLength; i++)
                    if (window.parent.frames[i] === window)
                        return getIframeData(i);
            }
        }
        catch (Exception) {
            console.log("Error accessing frame index");
            console.log(Exception);
        }
    }
    return null;
}

function getIframeData(index) {
    var iframes = window.parent.document.getElementsByTagName("iframe");
    var selectedIframe = iframes[index];
    if (selectedIframe.id)
        return selectedIframe.id;
    if (selectedIframe.name)
        return selectedIframe.name;
    return index + "";
}

//Browser Api
function sendValues(values) {
    chrome.runtime.sendMessage({type: "sendMessageToServer", data: values});
}

