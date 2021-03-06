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

function Object() {

}

Object.getObjectName = function (element, prop) {
    var objectName = getObjectText(element);
    if (Util.isNotNullOrEmpty(objectName))
        return Util.removeWhiteSpace(objectName);
    objectName = Util.removeWhiteSpace(LocatorBuilder.link(element));
    if (Util.isNotNullOrEmpty(objectName))
        return objectName;
    objectName = Util.removeWhiteSpace(LocatorBuilder.Name(element));
    if (Util.isNotNullOrEmpty(objectName))
        return objectName;
    objectName = Util.removeWhiteSpace(LocatorBuilder.id(element));
    if (Util.isNotNullOrEmpty(objectName))
        return objectName;
    objectName = Util.removeWhiteSpace(LocatorBuilder.className(element));
    if (Util.isNotNullOrEmpty(objectName))
        return objectName;
    if (Util.isNotNullOrEmpty(prop.type))
        return prop.type;
};

function getObjectText(element) {
    switch (element.tagName.toLowerCase()) {
        case "img":
            if (Util.isNotNullOrEmpty(element.alt))
                return element.alt;
            if (Util.isNotNullOrEmpty(element.title))
                return element.title;
            break;
        case "input":
            var type = element.type;
            if (type === "button" || type === "submit" || type === "reset") {
                if (element.value)
                    return element.value;
            }
            else
                return getLabelValue(element);
            break;
        case "textarea":
            return getLabelValue(element);
        case "ul":
        case "select":
            break;
        default:
            return getTextForObjectName(element);
    }
    return null;
}

function getLabelValue(element) {
    var value = checkForLabel(element);
    if (Util.isNotNullOrEmpty(value))
        return value;
    if (Util.isNotNullOrEmpty(element.placeholder))
        return element.placeholder;
    if (Util.isNotNullOrEmpty(element.title))
        return element.title;
    return null;
}

function checkForLabel(element) {
    var value = checkForSuitableElement(element);
    if (value)
        return value;
    element = element.parentElement;
    while (element) {
        if (element.tagName === "DD" || element.tagName === "TD")
            return checkForSuitableElement(element);
        element = element.parentElement;
    }
    return null;
}

function checkForSuitableElement(element) {
    if (element.previousElementSibling) {
        if (element.previousElementSibling.tagName === "LABEL")
            return element.previousElementSibling.textContent;
        if (element.previousElementSibling.querySelector("label"))
            return element.previousElementSibling.querySelector("label").textContent;
        if (element.parentElement.querySelector("label"))
            return element.parentElement.querySelector("label").textContent;
    }
    return null;
}

function getTextForObjectName(element) {
    var txt = getText(element);
    if (txt && txt.length > 30)
        txt = txt.substring(0, 30);
    return txt;
}

function getText(element) {
    var txt = element.text ? element.text : element.textContent;
    return txt ? Util.removeWhiteSpace(txt) : null;
}

Object.getTextORValue = function (element) {
    var txt = getText(element);
    if (Util.isNotNullOrEmpty(txt))
        return txt;
    return element.value;
};

function Properties() {
}

Properties.getProperties = function (element) {
    var prop = [];
    Settings.ObjectPropertyList.forEach(
        function (data) {
            var obj = { "prop": data.type, "val": "" }
            if (data.grab === 'true') {
                obj.val = parseAndGet(element, data.type);
            }
            prop.push(obj);
        }
    );
    Settings.UserObjectPropertyList.forEach(
        function (data) {
            var obj = { "prop": data.type, "val": "" }
            if (data.grab === 'true') {
                obj.val = element.getAttribute(data.type);
            }
            prop.push(obj);
        }
    );
    prop.push({ "prop": "type", "val": Properties.getType(element) });
    return prop;
};


function parseAndGet(element, type) {
    switch (type) {
        case "id":
            return Util.removeWhiteSpace(LocatorBuilder.id(element));
        case "name":
            return Util.removeWhiteSpace(LocatorBuilder.Name(element));
        case "class":
            return Util.removeWhiteSpace(LocatorBuilder.className(element));
        case "link_text":
            return Util.removeWhiteSpace(LocatorBuilder.link(element));
        case "xpath":
            return Util.removeWhiteSpace(LocatorBuilder.fullXpath(element, true));
        case "relative_xpath":
            return Util.removeWhiteSpace(LocatorBuilder.RelativeXpath(element));
        case "css":
            return Util.removeWhiteSpace(LocatorBuilder.css(element));
        default:
            return element.getAttribute(type);
    }
}

Properties.getType = function (element) {
    return Util.removeWhiteSpace(element.type ? element.type : element.tagName.toLowerCase());
};

