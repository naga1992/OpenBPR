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

function Util() {

}

Util.isNullOrEmpty = function(value) {
    if (value)
        return value.toString().trim().length === 0;
    return true;
};

Util.isNotNullOrEmpty = function(value) {
    return !this.isNullOrEmpty(value);
};

Util.removeWhiteSpace = function(value) {
    if(Util.isNotNullOrEmpty(value))
        return value.toString().replace(/\s+/g, " ").trim();
    return "";
};

Util.highlightElement = function(element) {
    if (element) {
        element.style.outline = Settings.highlightColor + " solid 2px";
        if (!Util.rgbMatch(element.style.backgroundColor))
            element.prevbackgroundColor = element.style.backgroundColor;
        element.style.backgroundColor = Settings.highlightColorBg;
    }
};

Util.deghlightElement = function(element) {
    if (element) {
        element.style.outline = "none";
        element.style.backgroundColor = element.prevbackgroundColor;
    }
};

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function(str) {
        return this.indexOf(str) === 0;
    };
}

Util.rgb2hex = function(rgb) {
    if (rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    }
    return rgb;
};

Util.rgbMatch = function(rgb) {
    if (rgb) {
        rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        if (rgb) {
            var checkrgb = Settings.highlightColorBg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
            for (var i = 1; i < 4; i++)
                if (checkrgb[i] !== rgb[i])
                    return false;
            return (rgb[4] && checkrgb[4] === parseFloat(rgb[4]).toPrecision(1));
        }
    }
    return false;
};