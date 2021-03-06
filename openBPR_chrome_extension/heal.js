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


function Heal() {
}

var elementList = [""];

Heal.search = function (message) {
    findAndHighlightElement(message);
};

Heal.deregister = function () {
    dehighlightOldElements();
    openBPR.deHighlightPreviousElement();
};

function dehighlightOldElements() {
    elementList.forEach(function (element) {
        Util.deghlightElement(element);
    });
    elementList = [""];
}

function highlightElements(element) {
    elementList.push(element);
    Util.highlightElement(element);
}

function findAndHighlightElement(message) {
    dehighlightOldElements();
    searchElements(message.objects, openBPR.getFrameValue());
}

function searchElements(objects, frame) {
    for (var i = 0; i < objects.length; i++) {
        var object = objects[i];
        object.frame = object.frame === "" ? null : object.frame;
        if (frame === object.frame) {
            searchElement(object);
        }
    }
}

function searchElement(object) {
    var exist = "false";
    var result = findElement(object);
    if (result) {
        exist = result.count > 1 ? "partial" : "true";
        highlightElements(result.element);
    }
    sendResult(object.pageName, object.objectname, exist);
}

function findElement(object) {
    for (var i = 0; i < object.prop.length; i++) {
        var property = object.prop[i].property;
        var value = object.prop[i].value;
        if (Util.isNotNullOrEmpty(value)) {
            var result = getElement(property, value);
            if (result)
                return result;
        }
    }
    return null;
}

function getElement(property, value) {
    try {
        switch (property) {
            case Attributes.id:
                var element = document.getElementById(value);
                return element ? { element: element, count: 0 } : null;
            case Attributes.Name:
                var element = document.getElementsByName(value);
                return element.length > 0 ? { element: element[0], count: element.length } : null;
            case Attributes.linktext:
                var element = getByLinkText(value);
                return element.length > 0 ? { element: element[0], count: element.length } : null;
            case Attributes.rxpath:
            case Attributes.xpath:
                var element = LocatorBuilder.getElementsFromXpath(value);
                return element.length > 0 ? { element: element[0], count: element.length } : null;
            case Attributes.css:
                var element = document.querySelectorAll(value);
                return element.length > 0 ? { element: element[0], count: element.length } : null;
            case Attributes.classname:
                var element = document.getElementsByClassName(value);
                return element.length > 0 ? { element: element[0], count: element.length } : null;
            default:
                var element = LocatorBuilder.getElementsFromXpath(value);
                return element.length > 0 ? { element: element[0], count: element.length } : null;
        }
    }
    catch (exception) {
        console.error(exception);
        return null;
    }
}

function getByLinkText(linkText) {
    var elementList = [];
    for (i = 0; i < document.links.length; i++)
        if (document.links[i].text === linkText) {
            elementList.push(document.links[i]);
        }
    return elementList;
}

function sendResult(pageName, objectName, exist) {
    var data = { pageName: pageName, objectname: objectName, exist: exist };
    openBPR.sendHealResult(data);
}