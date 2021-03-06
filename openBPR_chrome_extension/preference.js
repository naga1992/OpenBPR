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

function Settings() {

}

function Attributes() {
}

Attributes.id = "id";
Attributes.Name = "name";
Attributes.linktext = "link_text";
Attributes.rxpath = "relative_xpath";
Attributes.xpath = "xpath";
Attributes.css = "css";
Attributes.classname = "class";

//Browser Api
chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (key in changes) {
        var storageChange = changes[key];
        switch (key) {
            case "highlightColor":
                Settings.highlightColor = storageChange.newValue;
                break;
            case "highlightColorBg":
                Settings.highlightColorBg = storageChange.newValue;
                break;
            case "ObjectPropertyList":
                Settings.ObjectPropertyList = storageChange.newValue;
                break;
			case "UserObjectPropertyList":
                Settings.UserObjectPropertyList = storageChange.newValue;
                break;
            case "XpathOrder":
                Settings.XpathOrder = storageChange.newValue;
                break;
            case "AttributeOrder":
                Settings.AttributeOrder = data.AttributeOrder;
                break;
        }
    }
});

//Browser Api
chrome.storage.sync.get({
    spyMode: "off",
    recordMode: "off",
    highlightColor: "#1B4060",
    highlightColorBg: "rgba(142,201,244,0.3)",
    ObjectPropertyList: [
        { "grab": "true", "type": "id" },
        { "grab": "true", "type": "name" },
        { "grab": "true", "type": "class" },
        { "grab": "true", "type": "link_text" },
        { "grab": "true", "type": "xpath" },
        { "grab": "true", "type": "relative_xpath" },
        { "grab": "true", "type": "css" }
    ],
    XpathOrder: [
        { "type": "IdRelative", "grab": "true" },
        { "type": "Attribute", "grab": "true" },
        { "type": "Image", "grab": "true" },
        { "type": "Link", "grab": "true" },
        { "type": "Href", "grab": "true" },
        { "type": "Text", "grab": "true" },
        { "type": "Position", "grab": "true" },
        { "type": "Text and Class", "grab": "true" }
    ],
    UserObjectPropertyList: [
    ],
    AttributeOrder: ["placeholder", "title", "value", "name", "type", "action", "onclick"]
},
    function (data) {
        Settings.highlightColor = data.highlightColor;
        Settings.highlightColorBg = data.highlightColorBg;
        Settings.ObjectPropertyList = data.ObjectPropertyList;
        Settings.UserObjectPropertyList = data.UserObjectPropertyList;
        Settings.XpathOrder = data.XpathOrder;
        Settings.AttributeOrder = data.AttributeOrder;
        if (data.spyMode === "on")
            Spy.register();
        if (data.recordMode === "on")
            Recorder.register();
    }
);
