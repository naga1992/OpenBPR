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

$ = jQuery;
$(document).ready(function () {
    defaultValues();
    var defaultData = {
        "AttributeOrder": [
            "placeholder", "title", "value", "name", "type", "action", "onclick"
        ],
        "ObjectPropertyList": [
            { "grab": "true", "type": "id" },
            { "grab": "true", "type": "name" },
            { "grab": "true", "type": "class" },
            { "grab": "true", "type": "link_text" },
            { "grab": "true", "type": "relative_xpath" },
            { "grab": "true", "type": "xpath" },
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
    function setValues(allValues) {
        chrome.storage.sync.set({
            "socketHost": allValues.socketHost,
            "socketPort": allValues.socketPort,
            "socketURI": "ws://" + allValues.socketHost + ":" + allValues.socketPort,
            "highlightColor": allValues.highlightColor,
            "highlightColorBg": getRgb(allValues.highlightColorBg),
            "AttributeOrder": [
                "placeholder", "title", "value", "name", "type", "action", "onclick"
            ],
            "ObjectPropertyList": allValues.ObjectPropertyList,
            "UserObjectPropertyList": allValues.UserObjectPropertyList,
            "XpathOrder": allValues.XpathOrder
        }, function () {
        }
        );
    }

    function getRgb(value) {
        if (value.indexOf("#") === 0) {
            var rgb = hexToRgb(value);
            return "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0.3)";
        }
        return value;
    }

    function hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    var rgb2hex = function (rgb) {
        if (rgb) {
            rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
            if (rgb) {
                function hex(x) {
                    return ("0" + parseInt(x).toString(16)).slice(-2);
                }
                return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
            }
        }
        return rgb;
    };

    function defaultValues() {
        chrome.storage.sync.get({
            "socketHost": "",
            "socketPort": "",
            "highlightColor": "",
            "highlightColorBg": "",
            "AttributeOrder": [
            ],
            "ObjectPropertyList": [
            ],
            "UserObjectPropertyList": [
            ],
            "XpathOrder": [
            ]
        },
            function (data) {
                initializeAll(data);
            }
        );
    }

    // for header
    $(".nav-link").click(function () {
        $($(".current").attr("href")).css("display", "none");
        $(".current").removeClass("current");
        $(this).addClass("current");
        $($(this).attr("href")).css("display", "block");
    });
    // for Object lists
    var objectContents = "";
    var objProperties;
    var nativeObjProperties;
    var addObjProInput = "<div class=\"add_normal_checkbox\"><img src = \"img/add.png\" class = \"add_object\"><input type = \"text\" class = \"in_object\" placeholder = \"Add object property\"><div class = \"objErrors\" style = \"color: #ed5565;position: absolute;\"></div></div>";
    var oldVal, newVal;
    var xpathContent;
    var xPathList;
    var globalData;

    function initializeAll(data) {
        globalData = data;
        globalData.highlightColorBg = rgb2hex(globalData.highlightColorBg);

        objProperties = globalData.UserObjectPropertyList;
        nativeObjProperties = globalData.ObjectPropertyList;
        xPathList = globalData.XpathOrder;

        $("#socketHost").val(globalData.socketHost);
        $("#socketPort").val(globalData.socketPort);

        // setting colour values
        $("#highlightcolor").val(globalData.highlightColor);
        $("#highlightcolorBg").val(globalData.highlightColorBg);
        $(".example_box").css("outline-color", "" + globalData.highlightColor + "");
        $(".example_box").css("background-color", "" + globalData.highlightColorBg + "");

        // initializing native object properties
        for (var i = 0; i < nativeObjProperties.length; i++) {
            objectContents += "<div class=\"normal_checkbox\"><input type=\"checkbox\" style = \"width: 20px;height: 20px;\" "
                + (nativeObjProperties[i]["grab"] === "true" ? "checked" : "")
                + "><input type = \"text\" value = \""
                + nativeObjProperties[i]["type"] + "\" disabled></div>";
        }
        $(".native_object_list").html(objectContents);
        objectContents = "";

        //Initializing the user Object Properties if exist
        $(".all_object_list").html(addObjProInput);
        if (objProperties.length > 0) {
            $(".all_object_list").html("");
            for (var i = 0; i < objProperties.length; i++) {
                objectContents += "<div class=\"normal_checkbox\"><input type=\"checkbox\" style = \"width: 20px;height: 20px;\" "
                    + (objProperties[i]["grab"] === "true" ? "checked" : "")
                    + "><input type = \"text\" class = \"userObj\" value = \""
                    + objProperties[i]["type"] + "\" disabled><img src = \"img/delete.png\" class = \"deleteObjProp\" alt=\"Delete\"><img src = \"img/edit.png\" class = \"editObjProp\" alt=\"Edit\"></div>";
            }
            objectContents += addObjProInput;
            $(".all_object_list").html(objectContents);
        }

        //*********************************************************** Relative Xpath Priority
        xpathContent = "";
        for (var i = 0; i < xPathList.length; i++) {
            if (xPathList[i]["advance"] === undefined) {
                xpathContent += "<tr id = \"" + xPathList[i]["type"]
                    + "\"><td><input type = \"checkbox\" style = \"width: 20px;height: 20px;\" "
                    + (xPathList[i]["grab"] === "true" ? "checked" : "")
                    + "></td><td>"
                    + xPathList[i]["type"]
                    + "</td ><td>"
                    + xPathList[i]["format"]
                    + "</td></tr>";
            } else {
                xpathContent += "<tr id = \""
                    + xPathList[i]["type"]
                    + "\"><td><input type = \"checkbox\" style = \"width: 20px;height: 20px;\" "
                    + (xPathList[i]["grab"] === "true" ? "checked" : "")
                    + "></td><td><a class = \"accordion-title\" href = \"#accordion-"
                    + i + "\">"
                    + xPathList[i]["type"]
                    + "</a></td ><td>"
                    + xPathList[i]["format"]
                    + "</td></tr><tr id = \"accordion-"
                    + i + "\" class = \"accordion-content\"><td colspan = \"3\">"
                    + xPathList[i]["advance"]
                    + "</td></tr>";
            }
        }
        $(".xPathTr").empty();
        $(".xPathTr").html(xpathContent);

    } //END OF INITIALIZATION

    $(".all_object_list").on("mouseenter", ".normal_checkbox", function () {
        $(this).children("img").show();
    }).on("mouseleave", ".normal_checkbox", function () {
        $(this).children("img").hide();
    });

    $(".all_object_list").on("click", ".editObjProp", function () {
        if ($(".doneObjProp").size() > 0) {     //checking if any other editing textbox is open or not
            $(".doneObjProp").click();
        }
        $(this).siblings("input[type = 'text']").css({ "background-color": "#fff", "box-shadow": "0px 0px 1px 1px #ccc", "padding": "2px 8px 2px 8px" });
        $(this).siblings("input[type = 'text']").removeAttr("disabled");
        oldVal = $(this).siblings("input[type = 'text']").val();
        $(this).siblings("input[type = 'text']").focus().val(oldVal);
        $(this).attr("class", "doneObjProp");
        $(this).attr("src", "img/done.png");
    });

    $(".all_object_list").on("click", ".doneObjProp", function () {
        newVal = $(this).siblings("input[type = 'text']").val();
        var confirmed = false;
        var errorVal = checkPropExist(newVal);
        if (errorVal === -1 && errorVal !== -2) {
            if (newVal === '') {
                newVal = oldVal;
            }
            confirmed = true;
        } else {
            if (errorVal !== checkPropExist(oldVal)) {
                alert("This value already exist!");
                $(this).siblings("input[type = 'text']").focus();
            } else
                confirmed = true;
        }
        if (confirmed) {
            $(this).siblings("input[type = 'text']").attr("disabled", "");
            $(this).attr("src", "img/edit.png");
            $(this).attr("class", "editObjProp");
            objProperties[checkPropExist(oldVal)]["type"] = newVal;
            globalData.UserObjectPropertyList = objProperties;
            updateObjectContent();
        }
    });

    $(".all_object_list").on("click", ".deleteObjProp", function () {
        if ($(this).siblings("input[type = 'text']").attr("disabled") === undefined) {
            $(this).siblings("input[type = 'text']").val("kl&kl");
        }
        $(this).parent().fadeOut();
        var index = checkPropExist($(this).siblings("input[type = 'text']").val());
        objProperties.splice(index, 1);
        updateObjectContent();
    });

    $(".all_object_list").on("keyup", ".in_object", function () {
        $(".objErrors").fadeOut();
    }).focusout(function () {
        $(".objErrors").fadeOut();
    });

    function updateObjectContent() {
        objectContents = "";
        for (var i = 0; i < objProperties.length; i++) {
            objectContents += "<div class=\"normal_checkbox\"><input type=\"checkbox\" style = \"width: 20px;height: 20px;\" "
                + (objProperties[i]["grab"] === "true" ? "checked" : "")
                + "><input class = \"userObj\" type = \"text\" value = \""
                + objProperties[i]["type"]
                + "\" disabled><img src = \"img/delete.png\" class = \"deleteObjProp\" alt=\"Delete\"><img src = \"img/edit.png\" class = \"editObjProp\" alt=\"Edit\"></div>";
        }
        objectContents += addObjProInput;
        $(".all_object_list").empty();
        $(".all_object_list").html(objectContents);
        globalData.UserObjectPropertyList = objProperties;
    }

    function addNewUserObjProp(newObjProp) {
        objProperties.push({ "grab": "true", "type": newObjProp });
    }

    function checkPropExist(objProp) {
        var exist = -1;
        if (objProperties.length > 0) {
            for (var i = 0; i < objProperties.length; i++) {
                if (objProperties[i]["type"] === objProp) {
                    exist = i;
                    break;
                }
            }
        }
        for (var i = 0; i < nativeObjProperties.length; i++) {
            if (nativeObjProperties[i]["type"] === objProp) {
                exist = -2;
                break;
            }
        }
        return exist;
    }
    $(".all_object_list").on("click", ".add_object", function () {
        var input_val = $(".in_object").val().trim();
        if (input_val.length > 0) {
            var index = checkPropExist(input_val);
            if (index === -1 && index !== -2) {
                addNewUserObjProp(input_val);
                $(".in_object").val("");
                updateObjectContent();
            } else {
                $(".objErrors").html("<p style = \"font-size: 13px;margin-top: 3px;\">This Object property already exist!</p>").show();
                $(".in_object").focus();
            }
        } else {
            $(".objErrors").html("<p>Input field can not be empty!</p>").show();
            $(".in_object").focus();
        }
    });

    /*********************** Checkbox functionalities **************************/

    /**************************** Native Object *************************************/

    $(".native_object_list").on("click", "input[type = 'checkbox']", function () {
        var val = $(this).siblings("input[type = 'text']").val();
        var check = toggle_checkboxVal(globalData.ObjectPropertyList, val);
    });
    /**************************** User defined *************************************/
    $(".all_object_list").on("click", "input[type = 'checkbox']", function () {
        var val = $(this).siblings("input[type = 'text']").val();
        toggle_checkboxVal(globalData.UserObjectPropertyList, val);
    });
    /**************************** xPath *************************************/
    $(".xPathTr").on("click", "input[type = 'checkbox']", function () {
        var val = $(this).closest('tr').attr("id");
        toggle_checkboxVal(globalData.XpathOrder, val);
    });

    function toggle_checkboxVal(obj, typeVal) {
        for (var i = 0; i < obj.length; i++) {
            if (obj[i]["type"] === typeVal) {
                if (obj[i]["grab"] !== "") {
                    obj[i]["grab"] = "";
                    return false;
                } else {
                    obj[i]["grab"] = "true";
                    return true;
                }
            }
        }
    }


    //************************************************************* code to set the prority of xPath
    $(".xPathTr").on("click", "tr", function () {
        $(".select_tr").removeClass("select_tr");
        $(this).addClass("select_tr");
    });

    function updateXpathPriority(propName, action) {
        var swap = true;
        var i = 0;
        var pos;
        while (swap && i < xPathList.length) {
            if (xPathList[i]["type"] === propName) {
                var temp = xPathList[i];
                if (action === "moveUp" && i !== 0) {
                    xPathList[i] = xPathList[i - 1];
                    xPathList[i - 1] = temp;
                    pos = -2;
                } else if (action === "moveDown" && i !== xPathList.length - 1) {
                    xPathList[i] = xPathList[i + 1];
                    xPathList[i + 1] = temp;
                    pos = 0;
                }
                swap = false;
            }
            i++;
        }
        if (i === 1 && action === "moveUp") {
            pos = -1;
        } else if (i === 8 && action === "moveDown") {
            pos = -1;
        }
        pos = i + pos;
        globalData.XpathOrder = xPathList;
        xpathContent = "";
        for (var i = 0; i < xPathList.length; i++) {
            if (pos !== i) {        // this pos check is to track the moving tr
                if (xPathList[i]["advance"] === undefined) {
                    xpathContent += "<tr id = \""
                        + xPathList[i]["type"]
                        + "\"><td><input type = \"checkbox\" style = \"width: 20px;height: 20px;\" "
                        + (xPathList[i]["grab"] === "true" ? "checked" : "")
                        + "></td><td>"
                        + xPathList[i]["type"]
                        + "</td ><td>"
                        + xPathList[i]["format"]
                        + "</td></tr>";
                } else {
                    xpathContent += "<tr id = \""
                        + xPathList[i]["type"]
                        + "\"><td><input type = \"checkbox\" style = \"width: 20px;height: 20px;\" "
                        + (xPathList[i]["grab"] === "true" ? "checked" : "")
                        + "></td><td><a class = \"accordion-title\" href = \"#accordion-"
                        + i + "\">"
                        + xPathList[i]["type"]
                        + "</a></td ><td>"
                        + xPathList[i]["format"]
                        + "</td></tr><tr id = \"accordion-"
                        + i + "\" class = \"accordion-content\"><td colspan = \"3\">"
                        + xPathList[i]["advance"]
                        + "</td></tr>";
                }
            } else
                if (xPathList[i]["advance"] === undefined) {
                    xpathContent += "<tr id = \""
                        + xPathList[i]["type"]
                        + "\" class = \"select_tr\"><td><input type = \"checkbox\" style = \"width: 20px;height: 20px;\" "
                        + (xPathList[i]["grab"] === "true" ? "checked" : "")
                        + "></td><td>"
                        + xPathList[i]["type"]
                        + "</td ><td>"
                        + xPathList[i]["format"] + "</td></tr>";
                } else {
                    xpathContent += "<tr id = \""
                        + xPathList[i]["type"]
                        + "\" class = \"select_tr\"><td><input type = \"checkbox\" style = \"width: 20px;height: 20px;\" "
                        + (xPathList[i]["grab"] === "true" ? "checked" : "")
                        + "></td><td><a class = \"accordion-title\" href = \"#accordion-"
                        + i + "\">" + xPathList[i]["type"]
                        + "</a></td ><td>"
                        + xPathList[i]["format"]
                        + "</td></tr><tr id = \"accordion-"
                        + i + "\" class = \"accordion-content\"><td colspan = \"3\">"
                        + xPathList[i]["advance"]
                        + "</td></tr>";
                }
        }
        $(".xPathTr").empty();
        $(".xPathTr").html(xpathContent);
    }

    $("#moveUp, #moveDown").click(function () {
        var propName = $(".select_tr").attr("id");
        updateXpathPriority(propName, $(this).attr("id"));
    });

    //********************************************************* accordian code
    function close_accordion_section() {
        $('.accordion .accordion-title').removeClass('active');
        $('.accordion .accordion-content').slideUp(300).removeClass('open');
    }

    $('.xPathTr').on("click", ".accordion-title", function (e) {
        var currentAttrValue = $(this).attr('href');
        if ($(e.target).is('.active')) {
            close_accordion_section();
        } else {
            close_accordion_section();
            $(this).addClass('active');
            $('.accordion ' + currentAttrValue).slideDown(300).addClass('open');
        }
        e.preventDefault();
    });

    $("#socketHost").change("", function () {
        globalData.socketHost = $(this).val();
    });

    $("#socketPort").change("", function () {
        globalData.socketPort = $(this).val();
    });

    /************************** Colour chooser *****************************************/
    $("input[type = 'color']").change("", function () {
        if ($(this).attr("id") === "highlightcolor") {
            globalData.highlightColor = $(this).val();
            $(".example_box").css("outline-color", "" + $(this).val() + "");
        } else {
            globalData.highlightColorBg = $(this).val();
            $(".example_box").css("background-color", "" + $(this).val() + "");
        }
    });

    $(".nav-link").click(function () {
        setTimeout(function () {
            $("body").scrollTop(0);
        }, 1);
        if ($(this).attr("href") === "#help") {
            $(".saveAll, .resetAll").hide();
        } else {
            $(".saveAll, .resetAll").show();
        }
    });
    $(".saveAll").click(function () {
        setValues(globalData);
        $("#popup").fadeIn();
        $("#popup").fadeOut(1500);
    });
    $(".resetAll").click(function () {
        if (confirm("Are you sure?")) {
            setValues(defaultData);
            location.reload();
        }
    });

    $(".btn-test").click(function () {

        $(".connectionTest").attr("src", "img/load.png");
        var url = globalData.socketHost + ":" + globalData.socketPort;
        $(".connectionStatus").attr("href", "https://" + url + "/status");
        var websocket = new WebSocket("ws://" + url);
        websocket.onopen = function (evt) {
            console.log("Connected");
            $(".connectionTest").attr("src", "img/pass.png");
            websocket.close();
        };
        websocket.onerror = function (evt) {
            $(".connectionTest").attr("src", "img/fail.png");
        };

    });

    window.addEventListener("keydown", function (e) {
        if ([38, 40].indexOf(e.which) > -1) {
            e.preventDefault();
        }
        if (e.which === 13 && $(e.target).attr("class") === "in_object") {
            $(".add_object").click();
        } else
            if (e.which === 13 && $(e.target).attr("class") === "userObj") {
                $(".doneObjProp").click();
            }
        if ((e.which === 38 || e.which === 40) && $(".select_tr").css("background-color") !== undefined) {
            if (e.which === 38) {
                $("#moveUp").click();
            } else {
                $("#moveDown").click();
            }
        }
    }, false);

});