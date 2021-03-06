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

function LocatorBuilder() {

}

LocatorBuilder.id = function (e) {
    if (e.id) {
        return e.id;
    }
    return null;
};

LocatorBuilder.Name = function (e) {
    if (e.name) {
        return e.name;
    }
    return null;
};

LocatorBuilder.className = function (e) {
    if (e.className) {
        return e.className;
    }
    return null;
};

LocatorBuilder.link = function (e) {
    if (e.nodeName === 'A') {
        var text = e.textContent;
        if (!text.match(/^\s*$/)) {
            return exactMatchPattern(text.replace(/\xA0/g, " ").replace(/^\s*(.*?)\s*$/, "$1"));
        }
    }
    return null;
};

LocatorBuilder.css = function (e) {
    var current = e;
    var sub_path = LocatorBuilder.getCSSSubPath(e);
    while (LocatorBuilder.findElement("css=" + sub_path) !== e && current.nodeName.toLowerCase() !== 'html') {
        sub_path = LocatorBuilder.getCSSSubPath(current.parentNode) + ' > ' + sub_path;
        current = current.parentNode;
    }
    return sub_path;
};

LocatorBuilder.fullXpath = function (e) {
    return LocatorBuilder.preciseXPath("/html" + LocatorBuilder.positionXpath(e, true), e)
}

LocatorBuilder.RelativeXpath = function (e) {
    var xpath = null;
    for (var i = 0; i < Settings.XpathOrder.length; i++) {
        if (Settings.XpathOrder[i].grab) {
            try {
                switch (Settings.XpathOrder[i].type) {
                    case "IdRelative":
                        xpath = LocatorBuilder.idRelativeXpath(e);
                        if (xpath)
                            return xpath;
                        break;
                    case "Text":
                        xpath = LocatorBuilder.TextXpath(e);
                        if (xpath)
                            return xpath;
                        break;
                    case "TextTag":
                        xpath = LocatorBuilder.TextXpath(e, true);
                        if (xpath)
                            return xpath;
                        break;
                    case "TextContains":
                        xpath = LocatorBuilder.TextXpath(e, false, true);
                        if (xpath)
                            return xpath;
                        break;
                    case "TextTC":
                        xpath = LocatorBuilder.TextXpath(e, true, true);
                        if (xpath)
                            return xpath;
                        break;
                    case "Text and Class":
                        xpath = LocatorBuilder.TextandClassXpath(e);
                        if (xpath)
                            return xpath;
                        break;
                    case "Text and ClassT":
                        xpath = LocatorBuilder.TextandClassXpath(e, true);
                        if (xpath)
                            return xpath;
                        break;
                    case "Text and ClassC":
                        xpath = LocatorBuilder.TextandClassXpath(e, false, true);
                        if (xpath)
                            return xpath;
                        break;
                    case "Text and ClassTC":
                        xpath = LocatorBuilder.TextandClassXpath(e, true, true);
                        if (xpath)
                            return xpath;
                        break;
                    case "Attribute":
                        xpath = LocatorBuilder.attributesXpath(e);
                        if (xpath)
                            return xpath;
                        break;
                    case "Link":
                        xpath = LocatorBuilder.linkXpath(e);
                        if (xpath)
                            return xpath;
                        break;
                    case "Image":
                        xpath = LocatorBuilder.imgXpath(e);
                        if (xpath)
                            return xpath;
                        break;
                    case "Href":
                        xpath = LocatorBuilder.hrefXpath(e);
                        if (xpath)
                            return xpath;
                        break;
                    case "Position":
                        xpath = LocatorBuilder.positionXpath(e);
                        if (xpath)
                            return xpath;
                        break;
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    return xpath;
};


LocatorBuilder.idRelativeXpath = function (e) {
    var path = '';
    var current = e;
    while (current !== null && current.nodeName.toLowerCase() !== 'html') {
        if (current.parentNode !== null) {
            path = LocatorBuilder.relativeXPathFromParent(current) + path;
            if (1 === current.parentNode.nodeType && // ELEMENT_NODE
                current.parentNode.getAttribute("data-x")) {
                return LocatorBuilder.preciseXPath("//" + LocatorBuilder.xpathHtmlElement(current.parentNode.nodeName.toLowerCase()) +
                    "[@data-x=" + LocatorBuilder.attributeValue(current.parentNode.getAttribute('id')) + "]" +
                    path, e);
            }
        } else {
            return null;
        }
        current = current.parentNode;
    }
    return null;
};

LocatorBuilder.linkXpath = function (e) {
    if (e.nodeName === 'A') {
        var text = e.textContent;
        if (!text.match(/^\s*$/)) {
            return LocatorBuilder.preciseXPath("//" + LocatorBuilder.xpathHtmlElement("a") + "[contains(normalize-space(text()),'" + text.replace(/^\s+/, '').replace(/\s+$/, '') + "')]", e);
        }
    }
    return null;
};

LocatorBuilder.imgXpath = function (e) {
    if (e.nodeName === 'IMG') {
        if (e.alt !== '') {
            return LocatorBuilder.preciseXPath("//" + LocatorBuilder.xpathHtmlElement("img") + "[@alt=" + LocatorBuilder.attributeValue(e.alt) + "]", e);
        } else if (e.title !== '') {
            return LocatorBuilder.preciseXPath("//" + LocatorBuilder.xpathHtmlElement("img") + "[@title=" + LocatorBuilder.attributeValue(e.title) + "]", e);
        } else if (e.src !== '') {
            return LocatorBuilder.preciseXPath("//" + LocatorBuilder.xpathHtmlElement("img") + "[contains(@src," + LocatorBuilder.attributeValue(e.src) + ")]", e);
        }
    }
    return null;
};

LocatorBuilder.attributesXpath = function (e) {
    var PREFERRED_ATTRIBUTES = Settings.AttributeOrder;//['placeholder', 'title', 'value', 'name', 'type', 'action', 'onclick'];
    var i = 0;

    function attributesXPath(name, attNames, attributes) {
        var locator = "//" + LocatorBuilder.xpathHtmlElement(name) + "[";
        for (i = 0; i < attNames.length; i++) {
            if (i > 0) {
                locator += " and ";
            }
            var attName = attNames[i];
            locator += '@' + attName + "=" + LocatorBuilder.attributeValue(attributes[attName]);
        }
        locator += "]";
        return LocatorBuilder.preciseXPath(locator, e);
    }

    if (e.attributes) {
        var atts = e.attributes;
        var attArray = [];
        var attsMap = {};
        for (i = 0; i < atts.length; i++) {
            var att = atts[i];
            attsMap[att.name] = att.value;
            attArray.push(att.name);
        }
        var names = [];
        // try preferred attributes
        for (i = 0; i < PREFERRED_ATTRIBUTES.length; i++) {
            var name = PREFERRED_ATTRIBUTES[i].trim();
            var matchAttr = attArray.MatchInArray(name);
            if (matchAttr !== -1) {
                names.push(attArray[matchAttr]);
                var locator = attributesXPath.call(this, e.nodeName.toLowerCase(), names, attsMap);
                if (e === this.findElement(locator)) {
                    return locator;
                }
            }
        }
    }
    return null;
};

LocatorBuilder.hrefXpath = function (e) {
    if (e.attributes && e.hasAttribute("href")) {
        href = e.getAttribute("href");
        if (href.search(/^http?:\/\//) >= 0) {
            return LocatorBuilder.preciseXPath("//" + LocatorBuilder.xpathHtmlElement("a") + "[@href=" + LocatorBuilder.attributeValue(href) + "]", e);
        } else {
            // use contains(), because in IE getAttribute("href") will return absolute path
            return LocatorBuilder.preciseXPath("//" + LocatorBuilder.xpathHtmlElement("a") + "[contains(@href, " + LocatorBuilder.attributeValue(href) + ")]", e);
        }
    }
    return null;
};

LocatorBuilder.positionXpath = function (e, isFullPath, opt_contextNode) {
    var path = '';
    var current = e;
    while (current !== null && current !== opt_contextNode && current.nodeName.toLowerCase() !== 'html') {
        var currentPath;
        if (current.parentNode !== null) {
            currentPath = LocatorBuilder.relativeXPathFromParent(current);
        } else {
            currentPath = '/' + LocatorBuilder.xpathHtmlElement(current.nodeName.toLowerCase());
        }
        path = currentPath + path;
        var locator = '/' + path;
        if (!isFullPath && e === this.findElement(locator)) {
            return locator;
        }
        current = current.parentNode;
    }
    return path;
};

LocatorBuilder.TextXpath = function (e, tag, iscontains) {
    if (LocatorBuilder.isElementValidForText(e)) {
        tag = tag ? LocatorBuilder.xpathHtmlElement(e.tagName.toLowerCase()) : "*";
        var text = e.textContent;
        if (!text.match(/^\s*$/) && text.length < 50) {
            if (iscontains)
                return LocatorBuilder.TextContainsXpath(e, tag, text);
            return LocatorBuilder.TextEqualsXpath(e, tag, text);
        }
    }
    return null;
};

LocatorBuilder.TextContainsXpath = function (e, tag, text) {
    return LocatorBuilder.preciseXPath("//" + tag + "[contains(normalize-space(text()),'" +
        LocatorBuilder.getClearText(text) + "')]", e);
};

LocatorBuilder.TextEqualsXpath = function (e, tag, text) {
    return LocatorBuilder.preciseXPath("//" + tag + "[normalize-space(text())='" + LocatorBuilder.getClearText(text) + "']", e);
};

LocatorBuilder.TextandClassXpath = function (e, tag, isContains) {
    if (LocatorBuilder.isElementValidForText(e)) {
        if (e.className) {
            tag = tag ? LocatorBuilder.xpathHtmlElement(e.tagName.toLowerCase()) : "*";
            var text = e.textContent;
            if (!text.match(/^\s*$/) && text.length < 50) {
                if (isContains)
                    return LocatorBuilder.TextandClassContainsXpath(e, tag, text);
                else
                    return LocatorBuilder.TextandClassEqualsXpath(e, tag, text);

            }
        }
    }
    return null;
};

LocatorBuilder.TextandClassEqualsXpath = function (e, tag, text) {
    return LocatorBuilder.preciseXPath("//" + tag + "[contains(normalize-space(text()),'" +
        LocatorBuilder.getClearText(text) + "')]"
        + "[@class='" + e.className + "']"
        , e);
};

LocatorBuilder.TextandClassContainsXpath = function (e, tag, text) {
    return LocatorBuilder.preciseXPath("//" + tag + "[normalize-space(text())='" + LocatorBuilder.getClearText(text) + "']"
        + "[@class='" + e.className + "']"
        , e);
};

LocatorBuilder.getClearText = function (text) {
    return text.replace(/^\s+/, '').replace(/\s+$/, '');
};

LocatorBuilder.isElementValidForText = function (e) {
    return e.tagName.toLowerCase() !== "select";
};

LocatorBuilder.attributeValue = function (value) {
    if (value) {
        if (value.indexOf("'") < 0) {
            return "'" + value + "'";
        } else if (value.indexOf('"') < 0) {
            return '"' + value + '"';
        } else {
            var result = 'concat(';
            var part = "";
            while (true) {
                var apos = value.indexOf("'");
                var quot = value.indexOf('"');
                if (apos < 0) {
                    result += "'" + value + "'";
                    break;
                } else if (quot < 0) {
                    result += '"' + value + '"';
                    break;
                } else if (quot < apos) {
                    part = value.substring(0, apos);
                    result += "'" + part + "'";
                    value = value.substring(part.length);
                } else {
                    part = value.substring(0, quot);
                    result += '"' + part + '"';
                    value = value.substring(part.length);
                }
                result += ',';
            }
            result += ')';
            return result;
        }
    }
};

LocatorBuilder.xpathHtmlElement = function (name) {
    if (window.document.contentType === 'application/xhtml+xml') {
        // "x:" prefix is required when testing XHTML pages
        return "x:" + name;
    } else {
        return name;
    }
};

LocatorBuilder.relativeXPathFromParent = function (current) {
    var index = LocatorBuilder.getNodeNbr(current);
    var currentPath = '/' + LocatorBuilder.xpathHtmlElement(current.nodeName.toLowerCase());
    if (index > 0) {
        currentPath += '[' + (index + 1) + ']';
    }
    return currentPath;
};

LocatorBuilder.getNodeNbr = function (current) {
    var childNodes = current.parentNode.childNodes;
    var total = 0;
    var index = -1;
    for (var i = 0; i < childNodes.length; i++) {
        var child = childNodes[i];
        if (child.nodeName === current.nodeName) {
            if (child === current) {
                index = total;
            }
            total++;
        }
    }
    return index;
};

LocatorBuilder.getCSSSubPath = function (e) {
    var css_attributes = ['id', 'name', 'class', 'type', 'alt', 'title', 'value'];
    for (var i = 0; i < css_attributes.length; i++) {
        var attr = css_attributes[i];
        var value = e.getAttribute(attr);
        if (value) {
            if (attr === 'id')
                return '#' + value;
            if (attr === 'class')
                return (e.nodeName.toLowerCase() + '.' + value.replace(" ", ".")).replace("..", ".");
            return e.nodeName.toLowerCase() + '[' + attr + '="' + value + '"]';
        }
    }
    if (LocatorBuilder.getNodeNbr(e))
        return e.nodeName.toLowerCase() + ':nth-of-type(' + LocatorBuilder.getNodeNbr(e) + ')';
    else
        return e.nodeName.toLowerCase();
};

LocatorBuilder.preciseXPath = function (xpath, e) {
    //only create more precise xpath if needed
    if (LocatorBuilder.findElement(xpath) !== e) {
        var result = e.ownerDocument.evaluate(xpath, e.ownerDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        //skip first element (result:0 xpath index:1)
        for (var i = 0, len = result.snapshotLength; i < len; i++) {
            var newPath = '(' + xpath + ')[' + (i + 1) + ']';
            if (LocatorBuilder.findElement(newPath) === e) {
                return newPath;
            }
        }
    }
    return xpath;
};

LocatorBuilder.findElement = function (locator) {
    try {
        var list = [];
        if (locator.indexOf("css") === 0)
            list = document.querySelectorAll(locator.replace("css=", ""));
        else
            list = LocatorBuilder.getElementsFromXpath(locator.replace("xpath=", ""));
        return list.length > 1 ? null : list[0];
    } catch (error) {
        //        console.log("findElement failed: " + error + ", locator=" + locator);
        return null;
    }
};

LocatorBuilder.getElementsFromXpath = function (xpathToExecute) {
    var result = [];
    var nodesSnapshot = document.evaluate(xpathToExecute, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < nodesSnapshot.snapshotLength; i++) {
        result.push(nodesSnapshot.snapshotItem(i));
    }
    return result;
};

function exactMatchPattern(string) {
    if (string !== null && (string.match(/^\w*:/) || string.indexOf('?') >= 0 || string.indexOf('*') >= 0)) {
        return "exact:" + string;
    } else {
        return string;
    }
}

Array.prototype.MatchInArray = function (value) {

    var i;

    for (i = 0; i < this.length; i++) {

        if (this[i].match(value)) {

            return i;

        }

    }

    return -1;

};