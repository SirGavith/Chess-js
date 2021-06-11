// general utils

function findSubtringPairsBetweenChars(str, openChar, closeChar, maxPairs) {
    /// used for parsing PGN key-object pairs 
    var pairs = [];
    var pairOpen = -1;
    for (var i = 0; i < str.length; i++) {
        var char = str.charAt(i);
        if (char == openChar && pairOpen < 0) {
            pairOpen = i;
            continue;
        } else if (char == closeChar) {
            var pair = str.slice(pairOpen + 1, i);
            pairs.push(pair);
            pairOpen = -1;
            if (maxPairs != undefined && pairs.length >= maxPairs) {
                return pairs;
            }
        }
    }
    return pairs;
}

function removeComments(str, openChar, closeChar) {
    /// removes all substrs between an open and close char
    while (true) {
        var x = undefined;
        var x = findCharPair(str, openChar, closeChar);
        if (!x) {
            break;
        }
        str = str.slice(0, x[0]) + str.slice(x[1] + 1, str.length);
    }
    return str;
}

function findCharPair(str, openChar, closeChar) {
    /// finds the char pair for removeComments()
    var openPos;
    for (var i = 0; i < str.length; i++) {
        var char = str.charAt(i);
        if (char == openChar && openPos == undefined) {
            openPos = i;
        } else if (openPos != undefined && char == closeChar) {
            return [openPos, i];
        }
    }
    return false;
}

function copyObj(obj) {
    /// returns a copy of the object
    var out = {};
    for (var p in obj) {
        if (obj[p] != undefined) {
            out[p] = obj[p];
        }
    }
    return out;
}

function keys(obj) {
    /// returns a list of the keys of an object
    var out = [];
    for (var k in obj) {
        out.push(k);
    }
    return out;
}

function replaceNums(str) {
    /// replaces nuberical characters in a str with that number of dashes
    var nums = "12345678";
    for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if (nums.includes(c)) {
            var n = Number(c);
            var empty = "-";
            empty = empty.repeat(n);
            str = [str.slice(0, i), empty, str.slice(i + 1, str.length)].join("");
        }
    }
    return str;
}