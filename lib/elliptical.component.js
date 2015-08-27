
/*
 Tested against Chromium build with Object.observe and acts EXACTLY the same,
 though Chromium build is MUCH faster

 Trying to stay as close to the spec as possible,
 this is a work in progress, feel free to comment/update

 Specification:
 http://wiki.ecmascript.org/doku.php?id=harmony:observe

 Built using parts of:
 https://github.com/tvcutsem/harmony-reflect/blob/master/examples/observer.js

 Limits so far;
 Built using polling... Will update again with polling/getter&setters to make things better at some point

 TODO:
 Add support for Object.prototype.watch -> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/watch
 */


//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function () {

    if(!Object.observe){
        (function(extend, global){
            "use strict";


            var isCallable = (function(toString){
                var s = toString.call(toString),
                    u = typeof u;
                return typeof global.alert === "object" ?
                    function isCallable(f){
                        return s === toString.call(f) || (!!f && typeof f.toString == u && typeof f.valueOf == u && /^\s*\bfunction\b/.test("" + f));
                    }:
                    function isCallable(f){
                        return s === toString.call(f);
                    }
                    ;
            })(extend.prototype.toString);
            // isNode & isElement from http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
            //Returns true if it is a DOM node
            var isNode = function isNode(o){
                return (
                    typeof Node === "object" ? o instanceof Node :
                    o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
                );
            };
            //Returns true if it is a DOM element
            var isElement = function isElement(o){
                return (
                    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
                    o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
                );
            };
            var _doCheckCallback=function(f){
                setTimeout(f, 10);
            };
            var _clearCheckCallback=function(id){
                clearTimeout(id);
            };
            var isNumeric=function isNumeric(n){
                return !isNaN(parseFloat(n)) && isFinite(n);
            };
            var sameValue = function sameValue(x, y){
                if(x===y){
                    return x !== 0 || 1 / x === 1 / y;
                }
                return x !== x && y !== y;
            };
            var isAccessorDescriptor = function isAccessorDescriptor(desc){
                if (typeof(desc) === 'undefined'){
                    return false;
                }
                return ('get' in desc || 'set' in desc);
            };
            var isDataDescriptor = function isDataDescriptor(desc){
                if (typeof(desc) === 'undefined'){
                    return false;
                }
                return ('value' in desc || 'writable' in desc);
            };

            var inArray=function(arr,val){
                var bool=false;
                arr.forEach(function(v){
                    if(v===val){
                        bool=true;
                    }
                });
                return bool;
            };

            var validateArguments = function validateArguments(O, callback, accept){
                if(typeof(O)!=='object'){
                    // Throw Error
                    throw new TypeError("Object.observeObject called on non-object");
                }
                if(isCallable(callback)===false){
                    // Throw Error
                    throw new TypeError("Object.observeObject: Expecting function");
                }
                if(Object.isFrozen(callback)===true){
                    // Throw Error
                    throw new TypeError("Object.observeObject: Expecting unfrozen function");
                }
                if (accept !== undefined) {
                    if (!Array.isArray(accept)) {
                        throw new TypeError("Object.observeObject: Expecting acceptList in the form of an array");
                    }
                }
            };

            var Observer = (function Observer(){
                var wraped = [];

                var Observer = function Observer(O, callback, accept){

                    if (Array.isArray(O)) {
                        Observer._oldValue= O.concat([]);
                    }

                    validateArguments(O, callback, accept);
                    if (!accept) {
                        accept = ["add", "update", "delete", "slice"];
                    }

                    Object.getNotifier(O).addListener(callback, accept);
                    if(wraped.indexOf(O)===-1){
                        wraped.push(O);
                    }else{
                        Object.getNotifier(O)._checkPropertyListing();
                    }
                };

                Observer.prototype.deliverChangeRecords = function Observer_deliverChangeRecords(O){
                    Object.getNotifier(O).deliverChangeRecords();
                };

                wraped.lastScanned = 0;
                var f = (function f(wrapped){
                    return function _f(){
                        var i = 0, l = wrapped.length, startTime = new Date(), takingTooLong=false;
                        for(i=wrapped.lastScanned; (i<l)&&(!takingTooLong); i++){
                            if(_indexes.indexOf(wrapped[i]) > -1){
                                Object.getNotifier(wrapped[i])._checkPropertyListing();
                                takingTooLong=((new Date())-startTime)>500; // make sure we don't take more than 100 milliseconds to scan all objects
                            }else{
                                wrapped.splice(i, 1);
                                i--;
                                l--;
                            }
                        }
                        wrapped.lastScanned=i<l?i:0; // reset wrapped so we can make sure that we pick things back up
                        _doCheckCallback(_f);
                    };
                })(wraped);
                _doCheckCallback(f);
                return Observer;
            })();

            var Notifier = function Notifier(watching){
                var _listeners = [], _acceptLists = [], _updates = [], _updater = false, properties = [], values = [];
                var self = this;

                Object.defineProperty(self, '_watching', {
                    enumerable: true,
                    get: (function(watched){
                        return function(){
                            return watched;
                        };
                    })(watching)
                });
                var wrapProperty = function wrapProperty(object, prop){
                    var propType = typeof(object[prop]), descriptor = Object.getOwnPropertyDescriptor(object, prop);
                    if((prop==='getNotifier')||isAccessorDescriptor(descriptor)||(!descriptor.enumerable)){
                        return false;
                    }
                    if((object instanceof Array)&&isNumeric(prop)){
                        var idx = properties.length;
                        properties[idx] = prop;
                        values[idx] = object[prop];
                        return true;
                    }
                    (function(idx, prop){
                        properties[idx] = prop;
                        values[idx] = object[prop];
                        Object.defineProperty(object, prop, {
                            get: function(){
                                return values[idx];
                            },
                            set: function(value){
                                if(!sameValue(values[idx], value)){
                                    Object.getNotifier(object).queueUpdate(object, prop, 'update', values[idx]);
                                    values[idx] = value;
                                }
                            }
                        });
                    })(properties.length, prop);
                    return true;
                };
                self._checkPropertyListing = function _checkPropertyListing(dontQueueUpdates) {
                    var object = self._watching, keys = Object.keys(object), i=0, l=keys.length;
                    var newKeys = [], oldKeys = properties.slice(0), updates = [];
                    var prop, queueUpdates = !dontQueueUpdates, propType, value, idx, aLength;

                    if(object instanceof Array){
                        aLength = self._oldLength;
                    }

                    for(i=0; i<l; i++){
                        prop = keys[i];
                        value = object[prop];
                        propType = typeof(value);
                        if((idx = properties.indexOf(prop))===-1){
                            if(wrapProperty(object, prop)&&queueUpdates){
                                self.queueUpdate(object, prop, 'add', null, object[prop]);
                            }
                        }else{
                            if(!(object instanceof Array)||(isNumeric(prop))){
                                if(values[idx] !== value){
                                    if(queueUpdates){
                                        self.queueUpdate(object, prop, 'update', values[idx], value);
                                    }
                                    values[idx] = value;
                                }
                            }
                            oldKeys.splice(oldKeys.indexOf(prop), 1);
                        }
                    }

                    if(object instanceof Array && object.length !== aLength){
                        if(queueUpdates){
                            self.queueUpdate(object, 'length', 'update', aLength, object);
                        }
                        self._oldLength = object.length;
                    }

                    if(queueUpdates){
                        l = oldKeys.length;
                        for(i=0; i<l; i++){
                            idx = properties.indexOf(oldKeys[i]);
                            self.queueUpdate(object, oldKeys[i], 'delete', values[idx]);
                            properties.splice(idx,1);
                            values.splice(idx,1);
                        }
                    }
                };
                self.addListener = function Notifier_addListener(callback, accept){
                    var idx = _listeners.indexOf(callback);
                    if(idx===-1){
                        _listeners.push(callback);
                        _acceptLists.push(accept);
                    }
                    else {
                        _acceptLists[idx] = accept;
                    }
                };
                self.removeListener = function Notifier_removeListener(callback){
                    var idx = _listeners.indexOf(callback);
                    if(idx>-1){
                        _listeners.splice(idx, 1);
                        _acceptLists.splice(idx, 1);
                    }
                };
                self.listeners = function Notifier_listeners(){
                    return _listeners;
                };
                self.queueUpdate = function Notifier_queueUpdate(what, prop, type, was){
                    this.queueUpdates([{
                        type: type,
                        object: what,
                        name: prop,
                        oldValue: was
                    }]);
                };
                self.queueUpdates = function Notifier_queueUpdates(updates){
                    var self = this, i = 0, l = updates.length||0, update;
                    for(i=0; i<l; i++){
                        update = updates[i];
                        _updates.push(update);
                    }
                    if(_updater){
                        _clearCheckCallback(_updater);
                    }
                    _updater = _doCheckCallback(function(){
                        _updater = false;
                        self.deliverChangeRecords();
                    });
                };
                self.deliverChangeRecords = function Notifier_deliverChangeRecords(){
                    var i = 0, l = _listeners.length,
                    //keepRunning = true, removed as it seems the actual implementation doesn't do this
                    // In response to BUG #5
                        retval;

                    for(i=0; i<l; i++){
                        if(_listeners[i]){
                            var currentUpdates;
                            if (_acceptLists[i]) {
                                currentUpdates = [];
                                for (var j = 0, updatesLength = _updates.length; j < updatesLength; j++) {
                                    if (_acceptLists[i].indexOf(_updates[j].type) !== -1) {
                                        currentUpdates.push(_updates[j]);
                                    }
                                }
                            }
                            else {
                                currentUpdates = _updates;
                            }
                            if (currentUpdates.length) {
                                //support 'splice' for arrays

                                if(inArray(_acceptLists[i],'splice')){
                                    var spliceUpdates=self._arrayObserverSplice(currentUpdates);
                                    currentUpdates=(spliceUpdates) ? spliceUpdates : currentUpdates;
                                }

                                if(_listeners[i]===console.log){
                                    console.log(currentUpdates);
                                }else{
                                    _listeners[i](currentUpdates);
                                }
                            }
                        }
                    }
                    _updates=[];
                };
                self.notify = function Notifier_notify(changeRecord) {
                    if (typeof changeRecord !== "object" || typeof changeRecord.type !== "string") {
                        throw new TypeError("Invalid changeRecord with non-string 'type' property");
                    }
                    changeRecord.object = watching;
                    self.queueUpdates([changeRecord]);
                };
                self._checkPropertyListing(true);
                self._arrayObserverSplice=function(updates){
                    var currentValue=updates[0].object;
                    if (!Array.isArray(currentValue)) {
                        return false;
                    }
                    var oldValue=Observer._oldValue;
                    if(oldValue===undefined){
                        return false;
                    }
                    var oldLength=oldValue.length;
                    var currentLength=currentValue.length;
                    if(currentLength===oldLength){
                        return false;
                    }
                    var cr=self._spliceChangeRecord();
                    cr.object=currentValue;
                    var oldLastIndex=oldLength -1;
                    var currentLastIndex=currentLength-1;
                    if(currentLength > oldLength){
                        //add
                        cr.addedCount=currentLength-oldLength;
                        //get the index
                        //test for push
                        if(!(oldValue[oldLastIndex]===currentValue[currentLastIndex])){
                            cr.index=oldLastIndex +1;
                        }else if(!(oldValue[0]===currentValue[0])){//unshift
                            cr.index=0
                        }else{
                            //iterate for arbitrary splice
                            for(var i=0;i<oldLength;i++){
                                if(!(oldValue[i]===currentValue[i])){
                                    cr.index=i;
                                    break;
                                }
                            }
                        }
                    }else{
                        //delete
                        var removedCount=oldLength-currentLength;
                        //test the end
                        if(!(oldValue[oldLastIndex]===currentValue[currentLastIndex])){
                            cr.index=currentLastIndex + 1;
                        }else if(!(oldValue[0]===currentValue[0])){//shift
                            cr.index=0;
                        }else{
                            //iterate for arbitrary splice
                            for(var i=0;i<oldLength;i++){
                                if(!(oldValue[i]===currentValue[i])){
                                    cr.index=i;
                                    break;
                                }
                            }
                        }
                        cr.removed=self._removedArray(oldValue,cr.index,removedCount);
                    }

                    Observer._oldValue=currentValue.concat([]);//reset oldValue to the current value
                    return [cr];

                };
                self._spliceChangeRecord=function(){
                    return{
                        addedCount:0,
                        index:undefined,
                        object:[],
                        removed:[],
                        type:'splice'
                    }
                };
                self._removedArray=function(arr,index,count){
                    var rm=[];
                    var length=index+count;
                    for(var i=index;i<length;i++){
                        rm.push(arr[i])
                    }
                    return rm;
                }
            };

            var _notifiers=[], _indexes=[];
            extend.getNotifier = function Object_getNotifier(O){
                var idx = _indexes.indexOf(O), notifier = idx>-1?_notifiers[idx]:false;
                if(!notifier){
                    idx = _indexes.length;
                    _indexes[idx] = O;
                    notifier = _notifiers[idx] = new Notifier(O);
                }
                return notifier;
            };
            extend.observe = function Object_observe(O, callback, accept){
                // For Bug 4, can't observe DOM elements tested against canry implementation and matches
                if(!isElement(O)){
                    return new Observer(O, callback, accept);
                }
            };
            extend.unobserve = function Object_unobserve(O, callback){
                validateArguments(O, callback);
                var idx = _indexes.indexOf(O),
                    notifier = idx>-1?_notifiers[idx]:false;
                if (!notifier){
                    return;
                }
                notifier.removeListener(callback);
                if (notifier.listeners().length === 0){
                    _indexes.splice(idx, 1);
                    _notifiers.splice(idx, 1);
                }
            };
        })(Object, this);
    }



}));



// Copyright 2012 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function(global) {
    'use strict';

    var testingExposeCycleCount = global.testingExposeCycleCount;

    // Detect and do basic sanity checking on Object/Array.observe.
    function detectObjectObserve() {


        return true;
    }

    var hasObserve = detectObjectObserve();

    function detectEval() {
        // Don't test for eval if we're running in a Chrome App environment.
        // We check for APIs set that only exist in a Chrome App context.
        if (typeof chrome !== 'undefined' && chrome.app && chrome.app.runtime) {
            return false;
        }

        // Firefox OS Apps do not allow eval. This feature detection is very hacky
        // but even if some other platform adds support for this function this code
        // will continue to work.
        if (navigator.getDeviceStorage) {
            return false;
        }

        try {
            var f = new Function('', 'return true;');
            return f();
        } catch (ex) {
            return false;
        }
    }

    var hasEval = detectEval();

    function isIndex(s) {
        return +s === s >>> 0;
    }

    function toNumber(s) {
        return +s;
    }

    function isObject(obj) {
        return obj === Object(obj);
    }

    var numberIsNaN = global.Number.isNaN || function(value) {
            return typeof value === 'number' && global.isNaN(value);
        }

    function areSameValue(left, right) {
        if (left === right)
            return left !== 0 || 1 / left === 1 / right;
        if (numberIsNaN(left) && numberIsNaN(right))
            return true;

        return left !== left && right !== right;
    }

    var createObject = ('__proto__' in {}) ?
        function(obj) { return obj; } :
        function(obj) {
            var proto = obj.__proto__;
            if (!proto)
                return obj;
            var newObject = Object.create(proto);
            Object.getOwnPropertyNames(obj).forEach(function(name) {
                Object.defineProperty(newObject, name,
                    Object.getOwnPropertyDescriptor(obj, name));
            });
            return newObject;
        };

    var identStart = '[\$_a-zA-Z]';
    var identPart = '[\$_a-zA-Z0-9]';
    var identRegExp = new RegExp('^' + identStart + '+' + identPart + '*' + '$');

    function getPathCharType(char) {
        if (char === undefined)
            return 'eof';

        var code = char.charCodeAt(0);

        switch(code) {
            case 0x5B: // [
            case 0x5D: // ]
            case 0x2E: // .
            case 0x22: // "
            case 0x27: // '
            case 0x30: // 0
                return char;

            case 0x5F: // _
            case 0x24: // $
                return 'ident';

            case 0x20: // Space
            case 0x09: // Tab
            case 0x0A: // Newline
            case 0x0D: // Return
            case 0xA0:  // No-break space
            case 0xFEFF:  // Byte Order Mark
            case 0x2028:  // Line Separator
            case 0x2029:  // Paragraph Separator
                return 'ws';
        }

        // a-z, A-Z
        if ((0x61 <= code && code <= 0x7A) || (0x41 <= code && code <= 0x5A))
            return 'ident';

        // 1-9
        if (0x31 <= code && code <= 0x39)
            return 'number';

        return 'else';
    }

    var pathStateMachine = {
        'beforePath': {
            'ws': ['beforePath'],
            'ident': ['inIdent', 'append'],
            '[': ['beforeElement'],
            'eof': ['afterPath']
        },

        'inPath': {
            'ws': ['inPath'],
            '.': ['beforeIdent'],
            '[': ['beforeElement'],
            'eof': ['afterPath']
        },

        'beforeIdent': {
            'ws': ['beforeIdent'],
            'ident': ['inIdent', 'append']
        },

        'inIdent': {
            'ident': ['inIdent', 'append'],
            '0': ['inIdent', 'append'],
            'number': ['inIdent', 'append'],
            'ws': ['inPath', 'push'],
            '.': ['beforeIdent', 'push'],
            '[': ['beforeElement', 'push'],
            'eof': ['afterPath', 'push']
        },

        'beforeElement': {
            'ws': ['beforeElement'],
            '0': ['afterZero', 'append'],
            'number': ['inIndex', 'append'],
            "'": ['inSingleQuote', 'append', ''],
            '"': ['inDoubleQuote', 'append', '']
        },

        'afterZero': {
            'ws': ['afterElement', 'push'],
            ']': ['inPath', 'push']
        },

        'inIndex': {
            '0': ['inIndex', 'append'],
            'number': ['inIndex', 'append'],
            'ws': ['afterElement'],
            ']': ['inPath', 'push']
        },

        'inSingleQuote': {
            "'": ['afterElement'],
            'eof': ['error'],
            'else': ['inSingleQuote', 'append']
        },

        'inDoubleQuote': {
            '"': ['afterElement'],
            'eof': ['error'],
            'else': ['inDoubleQuote', 'append']
        },

        'afterElement': {
            'ws': ['afterElement'],
            ']': ['inPath', 'push']
        }
    }

    function noop() {}

    function parsePath(path) {
        var keys = [];
        var index = -1;
        var c, newChar, key, type, transition, action, typeMap, mode = 'beforePath';

        var actions = {
            push: function() {
                if (key === undefined)
                    return;

                keys.push(key);
                key = undefined;
            },

            append: function() {
                if (key === undefined)
                    key = newChar
                else
                    key += newChar;
            }
        };

        function maybeUnescapeQuote() {
            if (index >= path.length)
                return;

            var nextChar = path[index + 1];
            if ((mode == 'inSingleQuote' && nextChar == "'") ||
                (mode == 'inDoubleQuote' && nextChar == '"')) {
                index++;
                newChar = nextChar;
                actions.append();
                return true;
            }
        }

        while (mode) {
            index++;
            c = path[index];

            if (c == '\\' && maybeUnescapeQuote(mode))
                continue;

            type = getPathCharType(c);
            typeMap = pathStateMachine[mode];
            transition = typeMap[type] || typeMap['else'] || 'error';

            if (transition == 'error')
                return; // parse error;

            mode = transition[0];
            action = actions[transition[1]] || noop;
            newChar = transition[2] === undefined ? c : transition[2];
            action();

            if (mode === 'afterPath') {
                return keys;
            }
        }

        return; // parse error
    }

    function isIdent(s) {
        return identRegExp.test(s);
    }

    var constructorIsPrivate = {};

    function Path(parts, privateToken) {
        if (privateToken !== constructorIsPrivate)
            throw Error('Use Path.get to retrieve path objects');

        for (var i = 0; i < parts.length; i++) {
            this.push(String(parts[i]));
        }

        if (hasEval && this.length) {
            this.getValueFrom = this.compiledGetValueFromFn();
        }
    }

    // TODO(rafaelw): Make simple LRU cache
    var pathCache = {};

    function getPath(pathString) {
        if (pathString instanceof Path)
            return pathString;

        if (pathString == null || pathString.length == 0)
            pathString = '';

        if (typeof pathString != 'string') {
            if (isIndex(pathString.length)) {
                // Constructed with array-like (pre-parsed) keys
                return new Path(pathString, constructorIsPrivate);
            }

            pathString = String(pathString);
        }

        var path = pathCache[pathString];
        if (path)
            return path;

        var parts = parsePath(pathString);
        if (!parts)
            return invalidPath;

        var path = new Path(parts, constructorIsPrivate);
        pathCache[pathString] = path;
        return path;
    }

    Path.get = getPath;

    function formatAccessor(key) {
        if (isIndex(key)) {
            return '[' + key + ']';
        } else {
            return '["' + key.replace(/"/g, '\\"') + '"]';
        }
    }

    Path.prototype = createObject({
        __proto__: [],
        valid: true,

        toString: function() {
            var pathString = '';
            for (var i = 0; i < this.length; i++) {
                var key = this[i];
                if (isIdent(key)) {
                    pathString += i ? '.' + key : key;
                } else {
                    pathString += formatAccessor(key);
                }
            }

            return pathString;
        },

        getValueFrom: function(obj, directObserver) {
            for (var i = 0; i < this.length; i++) {
                if (obj == null)
                    return;
                obj = obj[this[i]];
            }
            return obj;
        },

        iterateObjects: function(obj, observe) {
            for (var i = 0; i < this.length; i++) {
                if (i)
                    obj = obj[this[i - 1]];
                if (!isObject(obj))
                    return;
                observe(obj, this[0]);
            }
        },

        compiledGetValueFromFn: function() {
            var str = '';
            var pathString = 'obj';
            str += 'if (obj != null';
            var i = 0;
            var key;
            for (; i < (this.length - 1); i++) {
                key = this[i];
                pathString += isIdent(key) ? '.' + key : formatAccessor(key);
                str += ' &&\n     ' + pathString + ' != null';
            }
            str += ')\n';

            var key = this[i];
            pathString += isIdent(key) ? '.' + key : formatAccessor(key);

            str += '  return ' + pathString + ';\nelse\n  return undefined;';
            return new Function('obj', str);
        },

        setValueFrom: function(obj, value) {
            if (!this.length)
                return false;

            for (var i = 0; i < this.length - 1; i++) {
                if (!isObject(obj))
                    return false;
                obj = obj[this[i]];
            }

            if (!isObject(obj))
                return false;

            obj[this[i]] = value;
            return true;
        }
    });

    var invalidPath = new Path('', constructorIsPrivate);
    invalidPath.valid = false;
    invalidPath.getValueFrom = invalidPath.setValueFrom = function() {};

    var MAX_DIRTY_CHECK_CYCLES = 1000;

    function dirtyCheck(observer) {
        var cycles = 0;
        while (cycles < MAX_DIRTY_CHECK_CYCLES && observer.check_()) {
            cycles++;
        }
        if (testingExposeCycleCount)
            global.dirtyCheckCycleCount = cycles;

        return cycles > 0;
    }

    function objectIsEmpty(object) {
        for (var prop in object)
            return false;
        return true;
    }

    function diffIsEmpty(diff) {
        return objectIsEmpty(diff.added) &&
            objectIsEmpty(diff.removed) &&
            objectIsEmpty(diff.changed);
    }

    function diffObjectFromOldObject(object, oldObject) {
        var added = {};
        var removed = {};
        var changed = {};

        for (var prop in oldObject) {
            var newValue = object[prop];

            if (newValue !== undefined && newValue === oldObject[prop])
                continue;

            if (!(prop in object)) {
                removed[prop] = undefined;
                continue;
            }

            if (newValue !== oldObject[prop])
                changed[prop] = newValue;
        }

        for (var prop in object) {
            if (prop in oldObject)
                continue;

            added[prop] = object[prop];
        }

        if (Array.isArray(object) && object.length !== oldObject.length)
            changed.length = object.length;

        return {
            added: added,
            removed: removed,
            changed: changed
        };
    }

    var eomTasks = [];
    function runEOMTasks() {
        if (!eomTasks.length)
            return false;

        for (var i = 0; i < eomTasks.length; i++) {
            eomTasks[i]();
        }
        eomTasks.length = 0;
        return true;
    }

    var runEOM = hasObserve ? (function(){
        var eomObj = { pingPong: true };
        var eomRunScheduled = false;

        Object.observe(eomObj, function() {
            runEOMTasks();
            eomRunScheduled = false;
        });

        return function(fn) {
            eomTasks.push(fn);
            if (!eomRunScheduled) {
                eomRunScheduled = true;
                eomObj.pingPong = !eomObj.pingPong;
            }
        };
    })() :
        (function() {
            return function(fn) {
                eomTasks.push(fn);
            };
        })();

    var observedObjectCache = [];

    function newObservedObject() {
        var observer;
        var object;
        var discardRecords = false;
        var first = true;

        function callback(records) {
            if (observer && observer.state_ === OPENED && !discardRecords)
                observer.check_(records);
        }

        return {
            open: function(obs) {
                if (observer)
                    throw Error('ObservedObject in use');

                if (!first)
                    Object.deliverChangeRecords(callback);

                observer = obs;
                first = false;
            },
            observe: function(obj, arrayObserve) {
                object = obj;
                if (arrayObserve)
                    Array.observe(object, callback);
                else
                    Object.observe(object, callback);
            },
            deliver: function(discard) {
                discardRecords = discard;
                Object.deliverChangeRecords(callback);
                discardRecords = false;
            },
            close: function() {
                observer = undefined;
                Object.unobserve(object, callback);
                observedObjectCache.push(this);
            }
        };
    }

    /*
     * The observedSet abstraction is a perf optimization which reduces the total
     * number of Object.observe observations of a set of objects. The idea is that
     * groups of Observers will have some object dependencies in common and this
     * observed set ensures that each object in the transitive closure of
     * dependencies is only observed once. The observedSet acts as a write barrier
     * such that whenever any change comes through, all Observers are checked for
     * changed values.
     *
     * Note that this optimization is explicitly moving work from setup-time to
     * change-time.
     *
     * TODO(rafaelw): Implement "garbage collection". In order to move work off
     * the critical path, when Observers are closed, their observed objects are
     * not Object.unobserve(d). As a result, it's possible that if the observedSet
     * is kept open, but some Observers have been closed, it could cause "leaks"
     * (prevent otherwise collectable objects from being collected). At some
     * point, we should implement incremental "gc" which keeps a list of
     * observedSets which may need clean-up and does small amounts of cleanup on a
     * timeout until all is clean.
     */

    function getObservedObject(observer, object, arrayObserve) {
        var dir = observedObjectCache.pop() || newObservedObject();
        dir.open(observer);
        dir.observe(object, arrayObserve);
        return dir;
    }

    var observedSetCache = [];

    function newObservedSet() {
        var observerCount = 0;
        var observers = [];
        var objects = [];
        var rootObj;
        var rootObjProps;

        function observe(obj, prop) {
            if (!obj)
                return;

            if (obj === rootObj)
                rootObjProps[prop] = true;

            if (objects.indexOf(obj) < 0) {
                objects.push(obj);
                Object.observe(obj, callback);
            }

            observe(Object.getPrototypeOf(obj), prop);
        }

        function allRootObjNonObservedProps(recs) {
            for (var i = 0; i < recs.length; i++) {
                var rec = recs[i];
                if (rec.object !== rootObj ||
                    rootObjProps[rec.name] ||
                    rec.type === 'setPrototype') {
                    return false;
                }
            }
            return true;
        }

        function callback(recs) {
            if (allRootObjNonObservedProps(recs))
                return;

            var observer;
            for (var i = 0; i < observers.length; i++) {
                observer = observers[i];
                if (observer.state_ == OPENED) {
                    observer.iterateObjects_(observe);
                }
            }

            for (var i = 0; i < observers.length; i++) {
                observer = observers[i];
                if (observer.state_ == OPENED) {
                    observer.check_();
                }
            }
        }

        var record = {
            object: undefined,
            objects: objects,
            open: function(obs, object) {
                if (!rootObj) {
                    rootObj = object;
                    rootObjProps = {};
                }

                observers.push(obs);
                observerCount++;
                obs.iterateObjects_(observe);
            },
            close: function(obs) {
                observerCount--;
                if (observerCount > 0) {
                    return;
                }

                for (var i = 0; i < objects.length; i++) {
                    Object.unobserve(objects[i], callback);
                    Observer.unobservedCount++;
                }

                observers.length = 0;
                objects.length = 0;
                rootObj = undefined;
                rootObjProps = undefined;
                observedSetCache.push(this);
            }
        };

        return record;
    }

    var lastObservedSet;

    function getObservedSet(observer, obj) {
        if (!lastObservedSet || lastObservedSet.object !== obj) {
            lastObservedSet = observedSetCache.pop() || newObservedSet();
            lastObservedSet.object = obj;
        }
        lastObservedSet.open(observer, obj);
        return lastObservedSet;
    }

    var UNOPENED = 0;
    var OPENED = 1;
    var CLOSED = 2;
    var RESETTING = 3;

    var nextObserverId = 1;

    function Observer() {
        this.state_ = UNOPENED;
        this.callback_ = undefined;
        this.target_ = undefined; // TODO(rafaelw): Should be WeakRef
        this.directObserver_ = undefined;
        this.value_ = undefined;
        this.id_ = nextObserverId++;
    }

    Observer.prototype = {
        open: function(callback, target) {
            if (this.state_ != UNOPENED)
                throw Error('Observer has already been opened.');

            addToAll(this);
            this.callback_ = callback;
            this.target_ = target;
            this.connect_();
            this.state_ = OPENED;
            return this.value_;
        },

        close: function() {
            if (this.state_ != OPENED)
                return;

            removeFromAll(this);
            this.disconnect_();
            this.value_ = undefined;
            this.callback_ = undefined;
            this.target_ = undefined;
            this.state_ = CLOSED;
        },

        deliver: function() {
            if (this.state_ != OPENED)
                return;

            dirtyCheck(this);
        },

        report_: function(changes) {
            try {
                this.callback_.apply(this.target_, changes);
            } catch (ex) {
                Observer._errorThrownDuringCallback = true;
                console.error('Exception caught during observer callback: ' +
                    (ex.stack || ex));
            }
        },

        discardChanges: function() {
            this.check_(undefined, true);
            return this.value_;
        }
    }

    var collectObservers = !hasObserve;
    var allObservers;
    Observer._allObserversCount = 0;

    if (collectObservers) {
        allObservers = [];
    }

    function addToAll(observer) {
        Observer._allObserversCount++;
        if (!collectObservers)
            return;

        allObservers.push(observer);
    }

    function removeFromAll(observer) {
        Observer._allObserversCount--;
    }

    var runningMicrotaskCheckpoint = false;

    var hasDebugForceFullDelivery = hasObserve && hasEval && (function() {
            try {
                eval('%RunMicrotasks()');
                return true;
            } catch (ex) {
                return false;
            }
        })();

    global.Platform = global.Platform || {};

    global.Platform.performMicrotaskCheckpoint = function() {
        if (runningMicrotaskCheckpoint)
            return;

        if (hasDebugForceFullDelivery) {
            eval('%RunMicrotasks()');
            return;
        }

        if (!collectObservers)
            return;

        runningMicrotaskCheckpoint = true;

        var cycles = 0;
        var anyChanged, toCheck;

        do {
            cycles++;
            toCheck = allObservers;
            allObservers = [];
            anyChanged = false;

            for (var i = 0; i < toCheck.length; i++) {
                var observer = toCheck[i];
                if (observer.state_ != OPENED)
                    continue;

                if (observer.check_())
                    anyChanged = true;

                allObservers.push(observer);
            }
            if (runEOMTasks())
                anyChanged = true;
        } while (cycles < MAX_DIRTY_CHECK_CYCLES && anyChanged);

        if (testingExposeCycleCount)
            global.dirtyCheckCycleCount = cycles;

        runningMicrotaskCheckpoint = false;
    };

    if (collectObservers) {
        global.Platform.clearObservers = function() {
            allObservers = [];
        };
    }

    function ObjectObserver(object) {
        Observer.call(this);
        this.value_ = object;
        this.oldObject_ = undefined;
    }

    ObjectObserver.prototype = createObject({
        __proto__: Observer.prototype,

        arrayObserve: false,

        connect_: function(callback, target) {
            if (hasObserve) {
                //this.directObserver_ = getObservedObject(this, this.value_,this.arrayObserve);
            } else {
                this.oldObject_ = this.copyObject(this.value_);
            }

        },

        copyObject: function(object) {
            var copy = Array.isArray(object) ? [] : {};
            for (var prop in object) {
                copy[prop] = object[prop];
            };
            if (Array.isArray(object))
                copy.length = object.length;
            return copy;
        },

        check_: function(changeRecords, skipChanges) {
            var diff;
            var oldValues;
            if (hasObserve) {
                if (!changeRecords)
                    return false;

                oldValues = {};
                diff = diffObjectFromChangeRecords(this.value_, changeRecords,
                    oldValues);
            } else {
                oldValues = this.oldObject_;
                diff = diffObjectFromOldObject(this.value_, this.oldObject_);
            }

            if (diffIsEmpty(diff))
                return false;

            if (!hasObserve)
                this.oldObject_ = this.copyObject(this.value_);

            this.report_([
                diff.added || {},
                diff.removed || {},
                diff.changed || {},
                function(property) {
                    return oldValues[property];
                }
            ]);

            return true;
        },

        disconnect_: function() {
            if (hasObserve) {
                this.directObserver_.close();
                this.directObserver_ = undefined;
            } else {
                this.oldObject_ = undefined;
            }
        },

        deliver: function() {
            if (this.state_ != OPENED)
                return;

            if (hasObserve)
                this.directObserver_.deliver(false);
            else
                dirtyCheck(this);
        },

        discardChanges: function() {
            if (this.directObserver_)
                this.directObserver_.deliver(true);
            else
                this.oldObject_ = this.copyObject(this.value_);

            return this.value_;
        }
    });

    function ArrayObserver(array) {
        if (!Array.isArray(array))
            throw Error('Provided object is not an Array');
        ObjectObserver.call(this, array);
    }

    ArrayObserver.prototype = createObject({

        __proto__: ObjectObserver.prototype,

        arrayObserve: true,

        copyObject: function(arr) {
            return arr.slice();
        },

        check_: function(changeRecords) {
            var splices;
            if (hasObserve) {
                if (!changeRecords)
                    return false;
                splices = projectArraySplices(this.value_, changeRecords);
            } else {
                splices = calcSplices(this.value_, 0, this.value_.length,
                    this.oldObject_, 0, this.oldObject_.length);
            }

            if (!splices || !splices.length)
                return false;

            if (!hasObserve)
                this.oldObject_ = this.copyObject(this.value_);

            this.report_([splices]);
            return true;
        }
    });

    ArrayObserver.applySplices = function(previous, current, splices) {
        splices.forEach(function(splice) {
            var spliceArgs = [splice.index, splice.removed.length];
            var addIndex = splice.index;
            while (addIndex < splice.index + splice.addedCount) {
                spliceArgs.push(current[addIndex]);
                addIndex++;
            }

            Array.prototype.splice.apply(previous, spliceArgs);
        });
    };

    function PathObserver(object, path) {
        Observer.call(this);

        this.object_ = object;
        this.path_ = getPath(path);
        this.directObserver_ = undefined;
    }

    PathObserver.prototype = createObject({
        __proto__: Observer.prototype,

        get path() {
            return this.path_;
        },

        connect_: function() {
            if (hasObserve)
                this.directObserver_ = getObservedSet(this, this.object_);

            this.check_(undefined, true);
        },

        disconnect_: function() {
            this.value_ = undefined;

            if (this.directObserver_) {
                this.directObserver_.close(this);
                this.directObserver_ = undefined;
            }
        },

        iterateObjects_: function(observe) {
            this.path_.iterateObjects(this.object_, observe);
        },

        check_: function(changeRecords, skipChanges) {
            var oldValue = this.value_;
            this.value_ = this.path_.getValueFrom(this.object_);
            if (skipChanges || areSameValue(this.value_, oldValue))
                return false;

            this.report_([this.value_, oldValue, this]);
            return true;
        },

        setValue: function(newValue) {
            if (this.path_)
                this.path_.setValueFrom(this.object_, newValue);
        }
    });

    function CompoundObserver(reportChangesOnOpen) {
        Observer.call(this);

        this.reportChangesOnOpen_ = reportChangesOnOpen;
        this.value_ = [];
        this.directObserver_ = undefined;
        this.observed_ = [];
    }

    var observerSentinel = {};

    CompoundObserver.prototype = createObject({
        __proto__: Observer.prototype,

        connect_: function() {
            if (hasObserve) {
                var object;
                var needsDirectObserver = false;
                for (var i = 0; i < this.observed_.length; i += 2) {
                    object = this.observed_[i]
                    if (object !== observerSentinel) {
                        needsDirectObserver = true;
                        break;
                    }
                }

                if (needsDirectObserver)
                    this.directObserver_ = getObservedSet(this, object);
            }

            this.check_(undefined, !this.reportChangesOnOpen_);
        },

        disconnect_: function() {
            for (var i = 0; i < this.observed_.length; i += 2) {
                if (this.observed_[i] === observerSentinel)
                    this.observed_[i + 1].close();
            }
            this.observed_.length = 0;
            this.value_.length = 0;

            if (this.directObserver_) {
                this.directObserver_.close(this);
                this.directObserver_ = undefined;
            }
        },

        addPath: function(object, path) {
            if (this.state_ != UNOPENED && this.state_ != RESETTING)
                throw Error('Cannot add paths once started.');

            var path = getPath(path);
            this.observed_.push(object, path);
            if (!this.reportChangesOnOpen_)
                return;
            var index = this.observed_.length / 2 - 1;
            this.value_[index] = path.getValueFrom(object);
        },

        addObserver: function(observer) {
            if (this.state_ != UNOPENED && this.state_ != RESETTING)
                throw Error('Cannot add observers once started.');

            this.observed_.push(observerSentinel, observer);
            if (!this.reportChangesOnOpen_)
                return;
            var index = this.observed_.length / 2 - 1;
            this.value_[index] = observer.open(this.deliver, this);
        },

        startReset: function() {
            if (this.state_ != OPENED)
                throw Error('Can only reset while open');

            this.state_ = RESETTING;
            this.disconnect_();
        },

        finishReset: function() {
            if (this.state_ != RESETTING)
                throw Error('Can only finishReset after startReset');
            this.state_ = OPENED;
            this.connect_();

            return this.value_;
        },

        iterateObjects_: function(observe) {
            var object;
            for (var i = 0; i < this.observed_.length; i += 2) {
                object = this.observed_[i]
                if (object !== observerSentinel)
                    this.observed_[i + 1].iterateObjects(object, observe)
            }
        },

        check_: function(changeRecords, skipChanges) {
            var oldValues;
            for (var i = 0; i < this.observed_.length; i += 2) {
                var object = this.observed_[i];
                var path = this.observed_[i+1];
                var value;
                if (object === observerSentinel) {
                    var observable = path;
                    value = this.state_ === UNOPENED ?
                        observable.open(this.deliver, this) :
                        observable.discardChanges();
                } else {
                    value = path.getValueFrom(object);
                }

                if (skipChanges) {
                    this.value_[i / 2] = value;
                    continue;
                }

                if (areSameValue(value, this.value_[i / 2]))
                    continue;

                oldValues = oldValues || [];
                oldValues[i / 2] = this.value_[i / 2];
                this.value_[i / 2] = value;
            }

            if (!oldValues)
                return false;

            // TODO(rafaelw): Having observed_ as the third callback arg here is
            // pretty lame API. Fix.
            this.report_([this.value_, oldValues, this.observed_]);
            return true;
        }
    });

    function identFn(value) { return value; }

    function ObserverTransform(observable, getValueFn, setValueFn,
                               dontPassThroughSet) {
        this.callback_ = undefined;
        this.target_ = undefined;
        this.value_ = undefined;
        this.observable_ = observable;
        this.getValueFn_ = getValueFn || identFn;
        this.setValueFn_ = setValueFn || identFn;
        // TODO(rafaelw): This is a temporary hack. PolymerExpressions needs this
        // at the moment because of a bug in it's dependency tracking.
        this.dontPassThroughSet_ = dontPassThroughSet;
    }

    ObserverTransform.prototype = {
        open: function(callback, target) {
            this.callback_ = callback;
            this.target_ = target;
            this.value_ =
                this.getValueFn_(this.observable_.open(this.observedCallback_, this));
            return this.value_;
        },

        observedCallback_: function(value) {
            value = this.getValueFn_(value);
            if (areSameValue(value, this.value_))
                return;
            var oldValue = this.value_;
            this.value_ = value;
            this.callback_.call(this.target_, this.value_, oldValue);
        },

        discardChanges: function() {
            this.value_ = this.getValueFn_(this.observable_.discardChanges());
            return this.value_;
        },

        deliver: function() {
            return this.observable_.deliver();
        },

        setValue: function(value) {
            value = this.setValueFn_(value);
            if (!this.dontPassThroughSet_ && this.observable_.setValue)
                return this.observable_.setValue(value);
        },

        close: function() {
            if (this.observable_)
                this.observable_.close();
            this.callback_ = undefined;
            this.target_ = undefined;
            this.observable_ = undefined;
            this.value_ = undefined;
            this.getValueFn_ = undefined;
            this.setValueFn_ = undefined;
        }
    }

    var expectedRecordTypes = {
        add: true,
        update: true,
        delete: true
    };

    function diffObjectFromChangeRecords(object, changeRecords, oldValues) {
        var added = {};
        var removed = {};

        for (var i = 0; i < changeRecords.length; i++) {
            var record = changeRecords[i];
            if (!expectedRecordTypes[record.type]) {
                console.error('Unknown changeRecord type: ' + record.type);
                console.error(record);
                continue;
            }

            if (!(record.name in oldValues))
                oldValues[record.name] = record.oldValue;

            if (record.type == 'update')
                continue;

            if (record.type == 'add') {
                if (record.name in removed)
                    delete removed[record.name];
                else
                    added[record.name] = true;

                continue;
            }

            // type = 'delete'
            if (record.name in added) {
                delete added[record.name];
                delete oldValues[record.name];
            } else {
                removed[record.name] = true;
            }
        }

        for (var prop in added)
            added[prop] = object[prop];

        for (var prop in removed)
            removed[prop] = undefined;

        var changed = {};
        for (var prop in oldValues) {
            if (prop in added || prop in removed)
                continue;

            var newValue = object[prop];
            if (oldValues[prop] !== newValue)
                changed[prop] = newValue;
        }

        return {
            added: added,
            removed: removed,
            changed: changed
        };
    }

    function newSplice(index, removed, addedCount) {
        return {
            index: index,
            removed: removed,
            addedCount: addedCount
        };
    }

    var EDIT_LEAVE = 0;
    var EDIT_UPDATE = 1;
    var EDIT_ADD = 2;
    var EDIT_DELETE = 3;

    function ArraySplice() {}

    ArraySplice.prototype = {

        // Note: This function is *based* on the computation of the Levenshtein
        // "edit" distance. The one change is that "updates" are treated as two
        // edits - not one. With Array splices, an update is really a delete
        // followed by an add. By retaining this, we optimize for "keeping" the
        // maximum array items in the original array. For example:
        //
        //   'xxxx123' -> '123yyyy'
        //
        // With 1-edit updates, the shortest path would be just to update all seven
        // characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
        // leaves the substring '123' intact.
        calcEditDistances: function(current, currentStart, currentEnd,
                                    old, oldStart, oldEnd) {
            // "Deletion" columns
            var rowCount = oldEnd - oldStart + 1;
            var columnCount = currentEnd - currentStart + 1;
            var distances = new Array(rowCount);

            // "Addition" rows. Initialize null column.
            for (var i = 0; i < rowCount; i++) {
                distances[i] = new Array(columnCount);
                distances[i][0] = i;
            }

            // Initialize null row
            for (var j = 0; j < columnCount; j++)
                distances[0][j] = j;

            for (var i = 1; i < rowCount; i++) {
                for (var j = 1; j < columnCount; j++) {
                    if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
                        distances[i][j] = distances[i - 1][j - 1];
                    else {
                        var north = distances[i - 1][j] + 1;
                        var west = distances[i][j - 1] + 1;
                        distances[i][j] = north < west ? north : west;
                    }
                }
            }

            return distances;
        },

        // This starts at the final weight, and walks "backward" by finding
        // the minimum previous weight recursively until the origin of the weight
        // matrix.
        spliceOperationsFromEditDistances: function(distances) {
            var i = distances.length - 1;
            var j = distances[0].length - 1;
            var current = distances[i][j];
            var edits = [];
            while (i > 0 || j > 0) {
                if (i == 0) {
                    edits.push(EDIT_ADD);
                    j--;
                    continue;
                }
                if (j == 0) {
                    edits.push(EDIT_DELETE);
                    i--;
                    continue;
                }
                var northWest = distances[i - 1][j - 1];
                var west = distances[i - 1][j];
                var north = distances[i][j - 1];

                var min;
                if (west < north)
                    min = west < northWest ? west : northWest;
                else
                    min = north < northWest ? north : northWest;

                if (min == northWest) {
                    if (northWest == current) {
                        edits.push(EDIT_LEAVE);
                    } else {
                        edits.push(EDIT_UPDATE);
                        current = northWest;
                    }
                    i--;
                    j--;
                } else if (min == west) {
                    edits.push(EDIT_DELETE);
                    i--;
                    current = west;
                } else {
                    edits.push(EDIT_ADD);
                    j--;
                    current = north;
                }
            }

            edits.reverse();
            return edits;
        },

        /**
         * Splice Projection functions:
         *
         * A splice map is a representation of how a previous array of items
         * was transformed into a new array of items. Conceptually it is a list of
         * tuples of
         *
         *   <index, removed, addedCount>
         *
         * which are kept in ascending index order of. The tuple represents that at
         * the |index|, |removed| sequence of items were removed, and counting forward
         * from |index|, |addedCount| items were added.
         */

        /**
         * Lacking individual splice mutation information, the minimal set of
         * splices can be synthesized given the previous state and final state of an
         * array. The basic approach is to calculate the edit distance matrix and
         * choose the shortest path through it.
         *
         * Complexity: O(l * p)
         *   l: The length of the current array
         *   p: The length of the old array
         */
        calcSplices: function(current, currentStart, currentEnd,
                              old, oldStart, oldEnd) {
            var prefixCount = 0;
            var suffixCount = 0;

            var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
            if (currentStart == 0 && oldStart == 0)
                prefixCount = this.sharedPrefix(current, old, minLength);

            if (currentEnd == current.length && oldEnd == old.length)
                suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);

            currentStart += prefixCount;
            oldStart += prefixCount;
            currentEnd -= suffixCount;
            oldEnd -= suffixCount;

            if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
                return [];

            if (currentStart == currentEnd) {
                var splice = newSplice(currentStart, [], 0);
                while (oldStart < oldEnd)
                    splice.removed.push(old[oldStart++]);

                return [ splice ];
            } else if (oldStart == oldEnd)
                return [ newSplice(currentStart, [], currentEnd - currentStart) ];

            var ops = this.spliceOperationsFromEditDistances(
                this.calcEditDistances(current, currentStart, currentEnd,
                    old, oldStart, oldEnd));

            var splice = undefined;
            var splices = [];
            var index = currentStart;
            var oldIndex = oldStart;
            for (var i = 0; i < ops.length; i++) {
                switch(ops[i]) {
                    case EDIT_LEAVE:
                        if (splice) {
                            splices.push(splice);
                            splice = undefined;
                        }

                        index++;
                        oldIndex++;
                        break;
                    case EDIT_UPDATE:
                        if (!splice)
                            splice = newSplice(index, [], 0);

                        splice.addedCount++;
                        index++;

                        splice.removed.push(old[oldIndex]);
                        oldIndex++;
                        break;
                    case EDIT_ADD:
                        if (!splice)
                            splice = newSplice(index, [], 0);

                        splice.addedCount++;
                        index++;
                        break;
                    case EDIT_DELETE:
                        if (!splice)
                            splice = newSplice(index, [], 0);

                        splice.removed.push(old[oldIndex]);
                        oldIndex++;
                        break;
                }
            }

            if (splice) {
                splices.push(splice);
            }
            return splices;
        },

        sharedPrefix: function(current, old, searchLength) {
            for (var i = 0; i < searchLength; i++)
                if (!this.equals(current[i], old[i]))
                    return i;
            return searchLength;
        },

        sharedSuffix: function(current, old, searchLength) {
            var index1 = current.length;
            var index2 = old.length;
            var count = 0;
            while (count < searchLength && this.equals(current[--index1], old[--index2]))
                count++;

            return count;
        },

        calculateSplices: function(current, previous) {
            return this.calcSplices(current, 0, current.length, previous, 0,
                previous.length);
        },

        equals: function(currentValue, previousValue) {
            return currentValue === previousValue;
        }
    };

    var arraySplice = new ArraySplice();

    function calcSplices(current, currentStart, currentEnd,
                         old, oldStart, oldEnd) {
        return arraySplice.calcSplices(current, currentStart, currentEnd,
            old, oldStart, oldEnd);
    }

    function intersect(start1, end1, start2, end2) {
        // Disjoint
        if (end1 < start2 || end2 < start1)
            return -1;

        // Adjacent
        if (end1 == start2 || end2 == start1)
            return 0;

        // Non-zero intersect, span1 first
        if (start1 < start2) {
            if (end1 < end2)
                return end1 - start2; // Overlap
            else
                return end2 - start2; // Contained
        } else {
            // Non-zero intersect, span2 first
            if (end2 < end1)
                return end2 - start1; // Overlap
            else
                return end1 - start1; // Contained
        }
    }

    function mergeSplice(splices, index, removed, addedCount) {

        var splice = newSplice(index, removed, addedCount);

        var inserted = false;
        var insertionOffset = 0;

        for (var i = 0; i < splices.length; i++) {
            var current = splices[i];
            current.index += insertionOffset;

            if (inserted)
                continue;

            var intersectCount = intersect(splice.index,
                splice.index + splice.removed.length,
                current.index,
                current.index + current.addedCount);

            if (intersectCount >= 0) {
                // Merge the two splices

                splices.splice(i, 1);
                i--;

                insertionOffset -= current.addedCount - current.removed.length;

                splice.addedCount += current.addedCount - intersectCount;
                var deleteCount = splice.removed.length +
                    current.removed.length - intersectCount;

                if (!splice.addedCount && !deleteCount) {
                    // merged splice is a noop. discard.
                    inserted = true;
                } else {
                    var removed = current.removed;

                    if (splice.index < current.index) {
                        // some prefix of splice.removed is prepended to current.removed.
                        var prepend = splice.removed.slice(0, current.index - splice.index);
                        Array.prototype.push.apply(prepend, removed);
                        removed = prepend;
                    }

                    if (splice.index + splice.removed.length > current.index + current.addedCount) {
                        // some suffix of splice.removed is appended to current.removed.
                        var append = splice.removed.slice(current.index + current.addedCount - splice.index);
                        Array.prototype.push.apply(removed, append);
                    }

                    splice.removed = removed;
                    if (current.index < splice.index) {
                        splice.index = current.index;
                    }
                }
            } else if (splice.index < current.index) {
                // Insert splice here.

                inserted = true;

                splices.splice(i, 0, splice);
                i++;

                var offset = splice.addedCount - splice.removed.length
                current.index += offset;
                insertionOffset += offset;
            }
        }

        if (!inserted)
            splices.push(splice);
    }

    function createInitialSplices(array, changeRecords) {
        var splices = [];

        for (var i = 0; i < changeRecords.length; i++) {
            var record = changeRecords[i];
            switch(record.type) {
                case 'splice':
                    mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
                    break;
                case 'add':
                case 'update':
                case 'delete':
                    if (!isIndex(record.name))
                        continue;
                    var index = toNumber(record.name);
                    if (index < 0)
                        continue;
                    mergeSplice(splices, index, [record.oldValue], 1);
                    break;
                default:
                    console.error('Unexpected record type: ' + JSON.stringify(record));
                    break;
            }
        }

        return splices;
    }

    function projectArraySplices(array, changeRecords) {
        var splices = [];

        createInitialSplices(array, changeRecords).forEach(function(splice) {
            if (splice.addedCount == 1 && splice.removed.length == 1) {
                if (splice.removed[0] !== array[splice.index])
                    splices.push(splice);

                return
            };

            splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount,
                splice.removed, 0, splice.removed.length));
        });

        return splices;
    }

    global.Observer = Observer;
    global.Observer.runEOM_ = runEOM;
    global.Observer.observerSentinel_ = observerSentinel; // for testing.
    global.Observer.hasObjectObserve = hasObserve;
    global.ArrayObserver = ArrayObserver;
    global.ArrayObserver.calculateSplices = function(current, previous) {
        return arraySplice.calculateSplices(current, previous);
    };

    global.ArraySplice = ArraySplice;
    global.ObjectObserver = ObjectObserver;
    global.PathObserver = PathObserver;
    global.CompoundObserver = CompoundObserver;
    global.Path = Path;
    global.ObserverTransform = ObserverTransform;
})(typeof global !== 'undefined' && global && typeof module !== 'undefined' && module ? global : this || window);

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals (root is window)
        root._utils=root._utils || {};
        root._utils.forEach=factory();
        root.returnExports = root._utils.forEach;
    }
}(this, function () {
    var hasOwn = Object.prototype.hasOwnProperty;
    var toString = Object.prototype.toString;

    return function forEach (obj, fn, ctx) {
        if (toString.call(fn) !== '[object Function]') {
            throw new TypeError('iterator must be a function');
        }
        var l = obj.length;
        if (l === +l) {
            for (var i = 0; i < l; i++) {
                fn.call(ctx, obj[i], i, obj);
            }
        } else {
            for (var k in obj) {
                if (hasOwn.call(obj, k)) {
                    fn.call(ctx, obj[k], k, obj);
                }
            }
        }
    };

}));









(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('foreach'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['foreach'], factory);
    } else {
        // Browser globals (root is window)
        root._utils.jsonPointer=factory(root._utils.forEach);
        root.returnExports = root._utils.jsonPointer;
    }
}(this, function (forEach) {

    /**
     * Convenience wrapper around the api.
     * Calls `.get` when called with an `object` and a `pointer`.
     * Calls `.set` when also called with `value`.
     * If only supplied `object`, returns a partially applied function, mapped to the object.
     *
     * @param obj
     * @param pointer
     * @param value
     * @returns {*}
     */
    var each=forEach;
    function api (obj, pointer, value) {
        // .set()
        if (arguments.length === 3) {
            return api.set(obj, pointer, value);
        }
        // .get()
        if (arguments.length === 2) {
            return api.get(obj, pointer);
        }
        // Return a partially applied function on `obj`.
        var wrapped = api.bind(api, obj);

        // Support for oo style
        for (var name in api) {
            if (api.hasOwnProperty(name)) {
                wrapped[name] = api[name].bind(wrapped, obj);
            }
        }
        return wrapped;
    }


    /**
     * Lookup a json pointer in an object
     *
     * @param obj
     * @param pointer
     * @returns {*}
     */
    api.get = function get (obj, pointer) {
        var tok,
            refTokens = api.parse(pointer);
        while (refTokens.length) {
            tok = refTokens.shift();
            if (!obj.hasOwnProperty(tok)) {
                throw new Error('Invalid reference token: ' + tok);
            }
            obj = obj[tok];
        }
        return obj;
    };

    /**
     * Sets a value on an object
     *
     * @param obj
     * @param pointer
     * @param value
     */
    api.set = function set (obj, pointer, value) {
        var refTokens = api.parse(pointer),
            tok,
            nextTok = refTokens[0];
        while (refTokens.length > 1) {
            tok = refTokens.shift();
            nextTok = refTokens[0];

            if (!obj.hasOwnProperty(tok)) {
                if (nextTok.match(/^\d+$/)) {
                    obj[tok] = [];
                } else {
                    obj[tok] = {};
                }
            }
            obj = obj[tok];
        }
        obj[nextTok] = value;
        return this;
    };

    /**
     * Removes an attribute
     *
     * @param obj
     * @param pointer
     */
    api.remove = function (obj, pointer) {
        var refTokens = api.parse(pointer);
        var finalToken = refTokens.pop();
        if (finalToken === undefined) {
            throw new Error('Invalid JSON pointer for remove: "' + pointer + '"');
        }
        delete api.get(obj, api.compile(refTokens))[finalToken];
    };

    /**
     * Returns a (pointer -> value) dictionary for an object
     *
     * @param obj
     * @param {function} descend
     * @returns {}
     */
    api.dict = function dict (obj, descend) {
        var results = {};
        api.walk(obj, function (value, pointer) {
            results[pointer] = value;
        }, descend);
        return results;
    };

    /**
     * Iterates over an object
     * Iterator: function (value, pointer) {}
     *
     * @param obj
     * @param {function} iterator
     * @param {function} descend
     */
    api.walk = function walk (obj, iterator, descend) {
        var refTokens = [];

        descend = descend || function (value) {
                var type = Object.prototype.toString.call(value);
                return type === '[object Object]' || type === '[object Array]';
            };

        (function next (cur) {
            each(cur, function (value, key) {
                refTokens.push(String(key));
                if (descend(value)) {
                    next(value);
                } else {
                    iterator(value, api.compile(refTokens));
                }
                refTokens.pop();
            });
        }(obj));
    };

    /**
     * Tests if an object has a value for a json pointer
     *
     * @param obj
     * @param pointer
     * @returns {boolean}
     */
    api.has = function has (obj, pointer) {
        try {
            api.get(obj, pointer);
        } catch (e) {
            return false;
        }
        return true;
    };

    /**
     * Escapes a reference token
     *
     * @param str
     * @returns {string}
     */
    api.escape = function escape (str) {
        return str.toString().replace(/~/g, '~0').replace(/\//g, '~1');
    };

    /**
     * Unescapes a reference token
     *
     * @param str
     * @returns {string}
     */
    api.unescape = function unescape (str) {
        return str.replace(/~1/g, '/').replace(/~0/g, '~');
    };

    /**
     * Converts a json pointer into a array of reference tokens
     *
     * @param pointer
     * @returns {Array}
     */
    api.parse = function parse (pointer) {
        if (pointer === '') { return []; }
        if (pointer.charAt(0) !== '/') { throw new Error('Invalid JSON pointer: ' + pointer); }
        return pointer.substring(1).split(/\//).map(api.unescape);
    };

    /**
     * Builds a json pointer from a array of reference tokens
     *
     * @param refTokens
     * @returns {string}
     */
    api.compile = function compile (refTokens) {
        if (refTokens.length === 0) { return ''; }
        return '/' + refTokens.map(api.escape).join('/');
    };

    return api;


}));










(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('json-pointer'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['json-pointer'], factory);
    } else {
        // Browser globals (root is window)
        root.Nested=factory(root._utils.jsonPointer);
        root.returnExports = root.Nested;
    }
}(this, function (jsonPointer) {

    var pointer = jsonPointer;
    var Nested=Object.create(null);
// This weak map is used for `.deliverChangeRecords(callback)` calls, where the
// provided callback has to mapped to its corresponding delegate.
    var delegates = new WeakMap; // <callback, delegate>

// When using `.observe(obj, callback)`, instead of forwarding the provided
// `callback` to `Object.observe(obj, callback)` directly, a delegate for the
// `callback` is created. This delegate transforms changes before forwarding
// them to the actual `callback`.
    var Delegate = function(callback) {
        this.callback  = callback;
        this.observers = new WeakMap;

        var self = this;
        this.handleChangeRecords = function(records) {
            try {
                var changes = records.map(self.transform, self);
                changes = Array.prototype.concat.apply([], changes); // flatten
                self.callback(changes)
            } catch (err) {
                if (Nested.debug) console.error(err.stack)
            }
        }
    };

// This method transforms the received change record with using the
// corresponding observer for the object that got changed.
    Delegate.prototype.transform = function(record) {
        var observers = this.observers.get(record.object);
        observers = observers.filter(function(value, index, self) {
            return self.indexOf(value) === index
        });
        return observers.map(function(observer) {
            return observer.transform(record)
        })
    };

// Each callback/object pair gets its own observer, which is used to track
// positions of nested objects and transforms change records accordingly.
    var Observer = function(root, delegate, accept) {
        this.root     = root;
        this.delegate = delegate;
        this.callback = delegate.handleChangeRecords;
        this.accept   = accept;
        this.paths    = new WeakMap
    }

// Recursively observe an object and its nested objects.
    Observer.prototype.observe = function(obj, path, visited) {
        if (!path)    path = '';
        if (!visited) visited = new WeakMap;

        if (visited.has(obj)) {
            return
        }

        visited.set(obj, true);

        // if the object is already observed, i.e., already somewhere else in the
        // nested structure -> do not observe it again
        if (!hasAt(this.delegate.observers, obj, this)) {
            if (Array.isArray(obj) && !this.accept) {
                Object.observe(obj, this.callback, ['add', 'update', 'delete', 'splice'])
            } else {
                Object.observe(obj, this.callback, this.accept)
            }
        }

        // track path and belonging
        addAt(this.paths, obj, path);
        addAt(this.delegate.observers, obj, this);

        // traverse the properties to find nested objects and observe them, too
        for (var key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !==null) {
                this.observe(obj[key], path + '/' + pointer.escape(key), visited)
            }
        }
    };

// Recursively unobserve an object and its nested objects.
    Observer.prototype.unobserve = function(obj, path) {
        console.log(path);
        if (!obj)  obj = this.root;
        if (!path) path = '';

        if (!hasAt(this.delegate.observers, obj, this)) {
            return
        }

        // clean up
        removeAt(this.paths, obj, path);
        removeAt(this.delegate.observers, obj, this);

        if (!this.paths.has(obj)) {
            Object.unobserve(obj, this.callback)
        }

        // traverse the properties to find nested objects and unobserve them, too
        for (var key in obj) {
            if (typeof obj[key] === 'object') {
                this.unobserve(obj[key], path + '/' + pointer.escape(key))
            }
        }
    };

// Transform a change record, ie., add the following properties:
// - **root** - the root of the nested structure
// - **path** - a [JSON Pointer](http://tools.ietf.org/html/rfc6901)
//              (absolute from the root) to the changed property
    Observer.prototype.transform = function(change) {
        var key = String(change.name || change.index);

        var path = this.paths.get(change.object)[0] + '/' + pointer.escape(key);
        var record = {
            root: this.root,
            path: path
        };

        // the original change record ist not extensible -> copy
        for (var prop in change) {
            record[prop] = change[prop]
        }

        // unobserve deleted/replaced objects
        var deleted = change.oldValue && [change.oldValue] || change.removed || [];
        deleted.forEach(function(oldValue) {
            if (!oldValue || typeof oldValue !== 'object') {
                return
            }

            var invalidPaths = this.paths.get(oldValue).filter(function(path) {
                return !pointer.has(this.root, path) || pointer.get(this.root, path) !== oldValue
            }, this);

            //this.unobserve(oldValue, invalidPaths[0])
        }, this);

        // observe added/updated objects
        var value = change.object[key];
        if (typeof value === 'object') {
            var desc = Object.getOwnPropertyDescriptor(change.object, key);
            if (desc.enumerable === true) {
                this.observe(value, path)
            } else {
                this.unobserve(value, path)
            }
        }

        Object.preventExtensions(record);

        return record
    };

// Corresponds to `Object.observe()` but for nested objects.

    Nested.observe = function(obj, callback, accept) {
        if(obj===undefined || typeof obj !=='object'){return false;}
        var delegate;

        if (!delegates.has(callback)) {
            delegate = new Delegate(callback);
            delegates.set(callback, delegate)
        } else {
            delegate = delegates.get(callback)
        }

        var observers = delegate.observers;
        if (observers.has(obj)) {
            return
        }

        var observer = new Observer(obj, delegate, accept);
        observer.observe(obj)
    };

// Corresponds to `Object.unobserve()` but for nested objects.
    Nested.unobserve = function(obj, callback) {
        if (!delegates.has(callback)) return;
        var delegate = delegates.get(callback);

        if (!delegate.observers.has(obj)) {
            return
        }
        console.log('nested unobserve');
        var observers = delegate.observers.get(obj);
        observers.forEach(function(observer) {
            observer.unobserve()
        })
    };

// Corresponds to `Object.deliverChangeRecords()` but for nested objects.
    Nested.deliverChangeRecords = function(callback) {

        if (typeof callback !== 'function') {
            throw new TypeError('Callback must be a function, given: ' + callback)
        }

        if (!delegates.has(callback)) return;

        var delegate = delegates.get(callback);
        Object.deliverChangeRecords(delegate.handleChangeRecords)
    };

// whether to log exceptions thrown during change record delivery
    Nested.debug = false;

// Helper function to check if a value exists in the array at the provided
// position in the provided WeakMap.
    function hasAt(map, key, value) {
        if (!map.has(key)) return false;
        return map.get(key).indexOf(value) !== -1
    }

// Helper function to add a value to an array at the provided position
// in the provided WeakMap.
    function addAt(map, key, value) {
        var set = (!map.has(key) && map.set(key, []), map.get(key));
        // if (set.indexOf(value) === -1)
        set.push(value)
    }

// Helper function to remove a value from the array at the provided position
// in the provided WeakMap.
    function removeAt(map, key, value) {
        // if (!map.has(key)) return
        var set = map.get(key);

        var index = set.indexOf(value);
        /*if (index > -1) */
        set.splice(index, 1);

        // if the set is empty, remove it from the WeakMap
        if (!set.length) map.delete(key)

    }

    return Nested;

}));



//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('observe-js'),require('elliptical-utils'),require('nested-observe'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['observe-js','elliptical-utils','nested-observe'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root,root.elliptical.utils,root.Nested);
    }
}(this, function (global,utils,Nested) {

    var _=utils._;

    /* necessary  private method/variable definitions copied over from observe-js ************************************************** */


    // Detect and do basic sanity checking on Object/Array.observe.
    function detectObjectObserve() {
        if (typeof Object.observe !== 'function' ||
            typeof Array.observe !== 'function') {
            return false;
        }


        return true;
    }

    var hasObserve = detectObjectObserve();

    var OPENED = 1;

    function diffObjectFromOldObject(object, oldObject) {
        var added = {};
        var removed = {};
        var changed = {};

        for (var prop in oldObject) {
            var newValue = object[prop];

            if (newValue !== undefined && newValue === oldObject[prop])
                continue;

            if (!(prop in object)) {
                removed[prop] = undefined;
                continue;
            }

            if (newValue !== oldObject[prop])
                changed[prop] = newValue;
        }

        for (var prop in object) {
            if (prop in oldObject)
                continue;

            added[prop] = object[prop];
        }

        if (Array.isArray(object) && object.length !== oldObject.length)
            changed.length = object.length;

        return {
            added: added,
            removed: removed,
            changed: changed
        };
    }
    function getObservedObject(observer, object, arrayObserve) {
        var dir = observedObjectCache.pop() || newObservedObject();
        dir.open(observer);
        dir.observe(object, arrayObserve);
        return dir;
    }

    var observedObjectCache = [];

    function newObservedObject() {
        var observer;
        var object;
        var discardRecords = false;
        var first = true;

        function callback(records) {
            if (observer && observer.state_ === OPENED && !discardRecords)
                observer.check_(records);
        }
        return {
            open: function(obs) {
                if (observer)
                    throw Error('ObservedObject in use');

                if (!first)
                    Object.deliverChangeRecords(callback);

                observer = obs;
                first = false;
            },
            observe: function(obj, arrayObserve) {
                object = obj;
                if (arrayObserve)
                    Array.observe(object, callback);
                else
                    Object.observe(object, callback);
            },
            deliver: function(discard) {
                discardRecords = discard;
                Object.deliverChangeRecords(callback);
                discardRecords = false;
            },
            close: function() {
                observer = undefined;
                Object.unobserve(object, callback);
                observedObjectCache.push(this);
            }
        };
    }

    var expectedRecordTypes = {
        add: true,
        update: true,
        delete: true
    };


    function diffObjectFromChangeRecords(object, changeRecords, oldValues) {
        var added = {};
        var removed = {};

        for (var i = 0; i < changeRecords.length; i++) {
            var record = changeRecords[i];
            if (!expectedRecordTypes[record.type]) {
                console.error('Unknown changeRecord type: ' + record.type);
                console.error(record);
                continue;
            }

            if (!(record.name in oldValues))
                oldValues[record.name] = record.oldValue;

            if (record.type == 'update')
                continue;

            if (record.type == 'add') {
                if (record.name in removed)
                    delete removed[record.name];
                else
                    added[record.name] = true;

                continue;
            }

            // type = 'delete'
            if (record.name in added) {
                delete added[record.name];
                delete oldValues[record.name];
            } else {
                removed[record.name] = true;
            }
        }

        for (var prop in added)
            added[prop] = object[prop];

        for (var prop in removed)
            removed[prop] = undefined;

        var changed = {};
        for (var prop in oldValues) {
            if (prop in added || prop in removed)
                continue;

            var newValue = object[prop];
            if (oldValues[prop] !== newValue)
                changed[prop] = newValue;
        }

        return {
            added: added,
            removed: removed,
            changed: changed
        };
    }
    /* end of private method/variable declarations ****************************************************************/

    /* elliptical observe only uses the Polymer ObjectObserver and PathObserver implementations. It also uses
     its own object change report implementation
     */

    /* overwrite the ObjectObserver Constructor
     *  Note: if no id prop is passed to the constructor, the entire implementation defaults to the standard polymer one, including
     *  the change reporting
     * */

    //first, save the prototype
    var ObjectObserver_prototype=ObjectObserver.prototype;

    //modify the constructor
    ObjectObserver= function(object,id){
        Observer.call(this);
        this.value_ = object;
        this.oldObject_ = undefined;
        /* modification */
        if(typeof id !=='undefined'){
            this.__id=id;
        }
    };
    //reassign the old prototype back to the modified constructor
    ObjectObserver.prototype=ObjectObserver_prototype;

    //modifications to prototype methods to allow reporting custom to elliptical
    ObjectObserver.prototype.connect_=function(){
        /* modification
         * if __id exists on the Observer prototype, we implement elliptical assignment
         *
         note: elliptical shims Object.observe, so there is no hasObserve if..else condition
         */
        if(this.__id !=='undefined'){
            //elliptical assignment, use nested-observe for deliver changes, allowing for deep observe changes
            Nested.observe(this.value_,this.check_.bind(this));
        }else{
            //polymer assignment
            this.directObserver_ = getObservedObject(this, this.value_,this.arrayObserve);
        }

    };
    ObjectObserver.prototype.check_=function(changeRecords, skipChanges) {
        /* modification
         * if __id exists on the Observer prototype, we implement elliptical deep change reporting
         * */

        if(this.__id !=='undefined'){
            var diff_;
            if (!changeRecords){
                return false;
            }
            diff_=utils.nativeObjDiffReport(this.value_,changeRecords);
            this.callback_.call(this,diff_);

            return true;

        }else{
            //polymer reporting
            var diff;
            var oldValues;
            if (!changeRecords)
                return false;

            oldValues = {};
            diff = diffObjectFromChangeRecords(this.value_, changeRecords,
                oldValues);


            this.report_([
                diff.added || {},
                diff.removed || {},
                diff.changed || {},
                function(property) {
                    return oldValues[property];
                }
            ]);

            return true;
        }

    };

    ObjectObserver.prototype.disconnect_=function(){
        //elliptical
        if(this.__id !=='undefined'){
            Nested.unobserve(this.value_,function(){});
        }else{
            //polymer
            this.directObserver_.close();
            this.directObserver_ = undefined;
        }
    };



    global.ObjectObserver=ObjectObserver;



    return global;

}));


// Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
// This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
// The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
// The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
// Code distributed by Google as part of the polymer project is also
// subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt

(function(global) {
    'use strict';

    var filter = Array.prototype.filter.call.bind(Array.prototype.filter);

    function getTreeScope(node) {
        while (node.parentNode) {
            node = node.parentNode;
        }

        return typeof node.getElementById === 'function' ? node : null;
    }

    Node.prototype.bind = function(name, observable) {
        console.error('Unhandled binding to Node: ', this, name, observable);
    };

    Node.prototype.bindFinished = function() {};

    function updateBindings(node, name, binding) {
        var bindings = node.bindings_;
        if (!bindings)
            bindings = node.bindings_ = {};
        /* modification from original repo */
        if (bindings[name]){
            if(binding[name]){
                binding[name].close();
            }else{
                bindings[name].close();
            }
        }


        return bindings[name] = binding;

    }

    function returnBinding(node, name, binding) {
        return binding;
    }

    function sanitizeValue(value) {
        return value == null ? '' : value;
    }

    function updateText(node, value) {
        node.data = sanitizeValue(value);
    }

    function textBinding(node) {
        return function(value) {
            return updateText(node, value);
        };
    }

    var maybeUpdateBindings = returnBinding;

    Object.defineProperty(Platform, 'enableBindingsReflection', {
        get: function() {
            return maybeUpdateBindings === updateBindings;
        },
        set: function(enable) {
            maybeUpdateBindings = enable ? updateBindings : returnBinding;
            return enable;
        },
        configurable: true
    });

    Text.prototype.bind = function(name, value, oneTime) {
        if (name !== 'textContent')
            return Node.prototype.bind.call(this, name, value, oneTime);

        if (oneTime)
            return updateText(this, value);

        var observable = value;
        updateText(this, observable.open(textBinding(this)));
        return maybeUpdateBindings(this, name, observable);
    }

    function updateAttribute(el, name, conditional, value) {
        if (conditional) {
            if (value)
                el.setAttribute(name, '');
            else
                el.removeAttribute(name);
            return;
        }

        el.setAttribute(name, sanitizeValue(value));
    }

    function attributeBinding(el, name, conditional) {
        return function(value) {
            updateAttribute(el, name, conditional, value);
        };
    }

    Element.prototype.bind = function(name, value, oneTime) {
        var conditional = name[name.length - 1] == '?';
        if (conditional) {
            this.removeAttribute(name);
            name = name.slice(0, -1);
        }

        if (oneTime)
            return updateAttribute(this, name, conditional, value);


        var observable = value;
        updateAttribute(this, name, conditional,
            observable.open(attributeBinding(this, name, conditional)));

        return maybeUpdateBindings(this, name, observable);
    };

    var checkboxEventType;
    (function() {
        // Attempt to feature-detect which event (change or click) is fired first
        // for checkboxes.
        var div = document.createElement('div');
        var checkbox = div.appendChild(document.createElement('input'));
        checkbox.setAttribute('type', 'checkbox');
        var first;
        var count = 0;
        checkbox.addEventListener('click', function(e) {
            count++;
            first = first || 'click';
        });
        checkbox.addEventListener('change', function() {
            count++;
            first = first || 'change';
        });

        var event = document.createEvent('MouseEvent');
        event.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false,
            false, false, false, 0, null);
        checkbox.dispatchEvent(event);
        // WebKit/Blink don't fire the change event if the element is outside the
        // document, so assume 'change' for that case.
        checkboxEventType = count == 1 ? 'change' : first;
    })();

    function getEventForInputType(element) {
        switch (element.type) {
            case 'checkbox':
                return checkboxEventType;
            case 'radio':
            case 'select-multiple':
            case 'select-one':
                return 'change';
            case 'range':
                if (/Trident|MSIE/.test(navigator.userAgent))
                    return 'change';
            default:
                return 'input';
        }
    }

    function updateInput(input, property, value, santizeFn) {
        input[property] = (santizeFn || sanitizeValue)(value);
    }

    function inputBinding(input, property, santizeFn) {
        return function(value) {
            return updateInput(input, property, value, santizeFn);
        }
    }

    function noop() {}

    function bindInputEvent(input, property, observable, postEventFn) {
        var eventType = getEventForInputType(input);

        function eventHandler() {
            observable.setValue(input[property]);
            observable.discardChanges();
            (postEventFn || noop)(input);
            Platform.performMicrotaskCheckpoint();
        }
        input.addEventListener(eventType, eventHandler);

        return {
            close: function() {
                input.removeEventListener(eventType, eventHandler);
                observable.close();
            },

            observable_: observable
        }
    }

    function booleanSanitize(value) {
        return Boolean(value);
    }

    // |element| is assumed to be an HTMLInputElement with |type| == 'radio'.
    // Returns an array containing all radio buttons other than |element| that
    // have the same |name|, either in the form that |element| belongs to or,
    // if no form, in the document tree to which |element| belongs.
    //
    // This implementation is based upon the HTML spec definition of a
    // "radio button group":
    //   http://www.whatwg.org/specs/web-apps/current-work/multipage/number-state.html#radio-button-group
    //
    function getAssociatedRadioButtons(element) {
        if (element.form) {
            return filter(element.form.elements, function(el) {
                return el != element &&
                    el.tagName == 'INPUT' &&
                    el.type == 'radio' &&
                    el.name == element.name;
            });
        } else {
            var treeScope = getTreeScope(element);
            if (!treeScope)
                return [];
            var radios = treeScope.querySelectorAll(
                'input[type="radio"][name="' + element.name + '"]');
            return filter(radios, function(el) {
                return el != element && !el.form;
            });
        }
    }

    function checkedPostEvent(input) {
        // Only the radio button that is getting checked gets an event. We
        // therefore find all the associated radio buttons and update their
        // check binding manually.
        if (input.tagName === 'INPUT' &&
            input.type === 'radio') {
            getAssociatedRadioButtons(input).forEach(function(radio) {
                var checkedBinding = radio.bindings_.checked;
                if (checkedBinding) {
                    // Set the value directly to avoid an infinite call stack.
                    checkedBinding.observable_.setValue(false);
                }
            });
        }
    }

    HTMLInputElement.prototype.bind = function(name, value, oneTime) {
        if (name !== 'value' && name !== 'checked')
            return HTMLElement.prototype.bind.call(this, name, value, oneTime);

        this.removeAttribute(name);
        var sanitizeFn = name == 'checked' ? booleanSanitize : sanitizeValue;
        var postEventFn = name == 'checked' ? checkedPostEvent : noop;

        if (oneTime)
            return updateInput(this, name, value, sanitizeFn);


        var observable = value;
        var binding = bindInputEvent(this, name, observable, postEventFn);
        updateInput(this, name,
            observable.open(inputBinding(this, name, sanitizeFn)),
            sanitizeFn);

        // Checkboxes may need to update bindings of other checkboxes.
        return updateBindings(this, name, binding);
    }

    HTMLTextAreaElement.prototype.bind = function(name, value, oneTime) {
        if (name !== 'value')
            return HTMLElement.prototype.bind.call(this, name, value, oneTime);

        this.removeAttribute('value');

        if (oneTime)
            return updateInput(this, 'value', value);

        var observable = value;
        var binding = bindInputEvent(this, 'value', observable);
        updateInput(this, 'value',
            observable.open(inputBinding(this, 'value', sanitizeValue)));
        return maybeUpdateBindings(this, name, binding);
    }

    function updateOption(option, value) {
        var parentNode = option.parentNode;;
        var select;
        var selectBinding;
        var oldValue;
        if (parentNode instanceof HTMLSelectElement &&
            parentNode.bindings_ &&
            parentNode.bindings_.value) {
            select = parentNode;
            selectBinding = select.bindings_.value;
            oldValue = select.value;
        }

        option.value = sanitizeValue(value);

        if (select && select.value != oldValue) {
            selectBinding.observable_.setValue(select.value);
            selectBinding.observable_.discardChanges();
            Platform.performMicrotaskCheckpoint();
        }
    }

    function optionBinding(option) {
        return function(value) {
            updateOption(option, value);
        }
    }

    HTMLOptionElement.prototype.bind = function(name, value, oneTime) {
        if (name !== 'value')
            return HTMLElement.prototype.bind.call(this, name, value, oneTime);

        this.removeAttribute('value');

        if (oneTime)
            return updateOption(this, value);

        var observable = value;
        var binding = bindInputEvent(this, 'value', observable);
        updateOption(this, observable.open(optionBinding(this)));
        return maybeUpdateBindings(this, name, binding);
    }

    HTMLSelectElement.prototype.bind = function(name, value, oneTime) {
        if (name === 'selectedindex')
            name = 'selectedIndex';

        if (name !== 'selectedIndex' && name !== 'value')
            return HTMLElement.prototype.bind.call(this, name, value, oneTime);

        this.removeAttribute(name);

        if (oneTime)
            return updateInput(this, name, value);

        var observable = value;
        var binding = bindInputEvent(this, name, observable);
        updateInput(this, name,
            observable.open(inputBinding(this, name)));

        // Option update events may need to access select bindings.
        return updateBindings(this, name, binding);
    }
})(this);

/*
 * =============================================================
 * elliptical.platform
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'),require('ellipse-utils'),require('elliptical-touch'),require('elliptical-animation'),
            require('elliptical-element'),require('elliptical-observe'),require('elliptical-nodebind'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils','ellipse-utils','elliptical-touch','elliptical-animation','elliptical-element',
            'elliptical-observe','elliptical-nodebind'], factory);
    } else {
        // Browser globals (root is window)
        window.$$=window.$$ || {};
        window.$$.elliptical=window.$$.elliptical || {};
        root.returnExports = factory(root.elliptical.utils);
    }
}(this, function (utils) {

    $.elliptical= $.elliptical || {};
    $.elliptical.hasObjectObserve=Observer.hasObjectObserve;
    $.elliptical.utils=utils;
    $.elliptical.startDirtyCheck=function(){
        var interval_=window.__dirtyCheckInterval || 500;
        console.log('dirty checking started...');
        var timeoutId=setInterval(function(){
            Platform.performMicrotaskCheckpoint();
        },interval_);
    };
    return $;


}));

/*
 * =============================================================
 * elliptical-cache
 * =============================================================
 *
 * usage:
 *
 * var $cache=this._data.$cache;
 * $cache.set(node,{foo:'bar'});
 *
 * var data=$cache.get(node);
 * var bar = data.foo; =>'bar'
 *
 * clean-up:
 * $cache.reset();
 *
 * a replacement for jQuery data as an alternative to HTML5 dataset(data attributes as DOM datastore).
 * The issue with jQuery data is that node removal clears the jQuery cache for that node. This interferes, for example, in those cases that rely
 * on mutation observer callback for removedNodes in terms of any necessity of querying a node's data to perform an action or actions.
 * $cache doesn't destroy the nodes data on removal, leaving clean-up to the developer, with fallback to component destroy event.
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-element'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-element'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory($);
    }
}(this, function ($) {

    $.element('elliptical.cache',{

        _initElement:function(){
            this._super();
            var $cache=this.$cache();
            this._data.set('$cache',$cache);
        },

        $cache:function(){
            var cache={};
            var count=1;
            return {
                reset:function(){
                    count=1;
                    cache={};
                },

                set:function(node,data){
                    if(!node.__data){
                        node.__data=count++;
                    }
                    cache[node.__data]=data;
                },

                get:function(node){
                    return cache[node.__data];
                }
            }
        },

        _dispose:function(){
            var $cache=this._data.get('$cache');
            $cache=null;
            this._super();
        }

    });

    return $;

}));

/*
 * =============================================================
 * elliptical-pubsub
 * =============================================================
 *
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-element'),require('elliptical-event'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-element','elliptical-event'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory($);
    }
}(this, function ($) {
    var utils= $.elliptical.utils;
    var _=utils._;

    $.element('elliptical.pubsub',$.elliptical.cache,{

        options:{
            channel:null,
            eventBlock:false
        },

        _initElement:function(){
            this._super();
            this._data.set('subscriptions',[]);
            this._subscriptions();

        },

        /**
         * publish data to channel
         * @param {string} channel
         * @param {object} data
         * @private
         */
        _publish: function(channel,data){
            elliptical.Event.emit(channel,data);
        },

        /**
         * subscribe to data/message over channel
         * @param {string} channel
         * @param {function} fn
         * @private
         */
        _subscribe:function(channel,fn){

            var sub={
                channel:channel,
                fn:fn
            };
            var subscriptions=this._data.get('subscriptions');
            if(!(subscriptions && subscriptions.length)){
                subscriptions=[];
            }
            subscriptions.push(sub);
            this._data.set('subscriptions',subscriptions);
            elliptical.Event.on(channel,fn);
        },

        _subscriptions: $.noop,

        /**
         * unbind subscriptions
         * @private
         */
        _unbindSubscriptions:function(){

            var subs=this._data.get('subscriptions');
            var length=subs.length;
            for(var i=0;i<length; i++){
                var obj=subs[i];
                Event.off(obj.channel,obj.fn);
                obj=null;
            }

            subs.length=0;

        },

        _dispose:function(){
            this._unbindSubscriptions();
            this._super();
        }

    });

    return $;

}));

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs

        module.exports = factory(require('elliptical-platform'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-platform'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory($);
    }
}(this, function ($) {
    var utils= $.elliptical.utils;
    var _=utils._;



    $.element('elliptical.scope',$.elliptical.pubsub,{

        options:{
            idProp:'id',
            scopeBind: true,
            watch:null
        },

        /**
         *
         * @private
         */
        _initElement:function(){
            this._super();
            this._initScopeElement();
        },

        _initScopeElement:function(){
            this._data.set('scopeTimeoutId',null);
            this._data.set('scopeObserver',null);
            this._data.set('scopeId',this.options.idProp);
            this._data.set('_discard',false);
            this._data.set('_observablesArray',[]);
            this.__initScope();

            if(this.options.scopeBind){
                this.__initScopeObservable();
            }
        },

        /**
         * init a $scope on the instance
         * @private
         */
        __initScope:function(){
            this.$scope={};
        },

        /**
         * init a watcher that binds an observable to the $scope when it becomes non-empty
         * terminates itself when it calls _setObservable
         * the init watcher avoids the initial $scope setting by the developer firing a change event
         * since an inherited parent's _initElement event is sequentially is going to fire before the element's _initElement
         * @private
         */
        __initScopeObservable:function(){
            var self = this;
            var MAX_COUNT=5;
            var count=0;
            var timeoutId=setInterval(function(){
                self._data.set('scopeTimeoutId',timeoutId);
                var obj=self.__objectWatchValue();
                if(obj || count > MAX_COUNT){
                    clearInterval(timeoutId);
                    self.__setObservable(obj);
                    self._onScopeInit(self.__cloneScope());
                }else {
                    count++;
                }
            },300);
        },

        __objectWatchValue:function(){
            var $scope = this.$scope;
            if (!_.isEmpty($scope)) {
                var watch = this.options.watch;
                var obj = (typeof watch==='string') ? utils.objectPropertyByPath($scope, watch) : $scope;
                return (obj) ? obj : null;
            }

        },

        /**
         * set the observable
         * @private
         */
        __setObservable:function(obj){
            var observable = (obj) ? obj : this.$scope;
            var self=this;
            var id=this.options.idProp;
            if(id===undefined){
                id='id';
            }
            this.$observable = observable;
            var observer = new ObjectObserver(observable,id);
            observer.open(function (result) {
                self.__onScopeChange(result);
            });
            /* save reference to the observer instance */
            this._data.set('scopeObserver',observer);
        },

        /**
         * destroy the scope observable
         * @private
         */
        __destroyObservable:function(){
            var scopeObserver=this._data.get('scopeObserver');
            if(scopeObserver){
                scopeObserver.close();
                scopeObserver=null;
                this.$scope=null;
            }
        },

        /**
         * destroys any additional observers
         * @private
         */
        __destroyObservablesArray:function(){
            var arr=this._data.get('_observablesArray');
            if(arr.length && arr.length > 0 ){
                arr.forEach(function(obj){
                    try{
                        obj.close();
                        obj=null;
                    }catch(ex){

                    }
                });
            }
        },

        /**
         * reset observable
         * @private
         */
        __resetObservable: function(){
            this.__destroyObservable();
            this.__setObservable();
        },

        /**
         * clone the scope object...changes to this will not effect observable
         * @returns {Object}
         * @private
         */
        __cloneScope:function(){
            return _.cloneDeep(this.$scope);
        },

        /**
         * clone an object
         * @param obj {Object}
         * @returns {Object}
         * @private
         */
        __cloneObject:function(obj){
            return _.cloneDeep(obj);
        },

        /**
         * returns scope length...(-1)==object, not array
         * @returns {Number}
         * @controller
         */
        __scopeLength:function(obj){
            var scope=(typeof obj==='undefined') ? this.$scope : obj;
            if(utils.isPropertyByIndexArray(scope,0)){
                var arr=utils.objectPropertyByIndex(scope,0);
                return arr.length;
            }else{
                return -1;  //object
            }
        },

        /**
         *
         * @private
         */
        __isModelList: function () {
            /*if (this.options.objectBind) {
             return false;
             } else {
             return (this.__scopeLength() > -1);
             }*/
            return false;

        },

        /**
         *
         * @param val {Object}
         * @private
         */
        _removeFromModelListById: function(val){
            var scope=this.$scope;
            var id=this._data.get('scopeId');
            utils.deleteObjectByIdFromArrayProp(scope,id,val);
        },

        /**
         *
         * @param val {Object}
         * @returns {Object}
         * @private
         *
         */
        _selectFromModelListById: function(val){
            var scope=this.$scope;
            var id=this._data.get('scopeId');
            if(id===undefined){
                id='id';
            }
            return utils.selectObjectByIdFromArrayProp(scope,id,val);
        },

        /**
         *
         * @param obj {Object}
         * @returns {Object}
         * @private
         */
        _selectFromModelListByObj:function(obj){
            var __o;
            var items=this.$scope[Object.keys(this._scope)[0]];
            items.forEach(function(o){
                if(_.isEqual(obj,o)){
                    __o=o;
                }
            });

            return __o;
        },

        _scopeIndexById:function(id){
            var idProp=this._data.get('scopeId');
            if(idProp===undefined){
                idProp='id';
            }
            return utils.objectIndexById(this.$scope,id,idProp);
        },

        /**
         * recycles the observable
         * @private
         */
        __recycle:function(){
            this.__destroyObservable();
            this.__setObservable();
        },

        /**
         * clears the watcher(that only sets up the observable).
         * as soon as a $scope has a non-empty value, the watcher terminates itself
         * @private
         */
        __clearWatch: function(){
            var timeoutId=this._data.get('scopeTimeoutId');
            if(timeoutId){
                clearInterval(timeoutId);
                this._data.set('scopeTimeoutId',null);
            }
        },

        /**
         * hook for scope observable change
         *
         * @param result {Object}
         * @controller
         */
        __onScopeChange:function(result){
            this._onScopeChange(result);
        },

        /**
         * console.log the current $scope
         * @param delay
         * @private
         */
        __printScope:function(delay){
            if(delay===undefined){
                delay=0;
            }
            var self=this;
            setTimeout(function(){
                console.log(self.$scope);
            },delay);
        },

        /**
         * returns changed object properties from the result param in _onScopeChange
         * @param obj
         * @returns {Object}
         * @private
         */
        _objectChange:function(obj){
            if(obj !==undefined){
                if(obj.object && obj.oldObject){
                    return utils.objChangedProps(obj.object,obj.oldObject);
                }else{
                    var chg_={};
                    chg_[obj.name]=obj.value;
                    return chg_;
                }
            }
        },


        __isEmptyObject:function(obj){
            return _.isEmpty(obj);
        },


        /**
         * destroy clean-up
         * @private
         */
        _dispose:function(){
            this.__clearWatch();
            this.__destroyObservable();
            this.__destroyObservablesArray();
            this._super();
        },

        _onScopeInit: $.noop,

        _onScopeChange: $.noop,

        /**
         * asynchronous $scope property setter for browsers that have polyfilled Object.observe
         * if Object.observe is native, defaults to a simple synchronous setter
         * @param prop {String}
         * @param value {Object} []
         * @param obj {Object} [optional object property on the $scope]
         */
        $scopeSetter: function (prop, value, obj) {
            var delay = this.options.setterDelay;
            var polyfilled = (typeof window.__observePolyfill !== 'undefined' && window.__observePolyfill);
            var $scope = this.$scope;
            if (typeof obj === 'undefined') {
                if (polyfilled) {
                    setTimeout(function () {
                        $scope[prop] = value;
                    }, delay);
                } else {
                    $scope[prop] = value; //just set if native observe
                }
            } else {
                if (polyfilled) {
                    setTimeout(function () {
                        $scope[obj][prop] = value;
                    }, delay);
                } else {
                    $scope[obj][prop] = value; //just set if native observe
                }
            }
        },

        /**
         * gives the difference between two objects
         * @param n {Object}
         * @param o {Object}
         * @returns {Object}
         * @public
         */
        $changeReport:function(n,o){
            return utils.objChangedProps(n,o);
        },

        /**
         * sets up a deep Object observer
         * @param obj
         * @param id
         * @param callback
         */
        $observer:function(obj,id,callback){
            var idProp=this._data.get('scopeId');
            if(typeof id==='function'){
                callback=id;
                id=(typeof idProp==='undefined') ? 'id' : idProp;
            }
            var observer = new ObjectObserver(obj,id);
            observer.open(function(result){
                callback(result);
            });

            var observeArr=this._data.get('_observableArray');
            observeArr.push(observer);
            //this._data.set('_observablesArray.push(observer);
        }

    });

    return $;


}));

/*
 * =============================================================
 * elliptical.template
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-dustjs'),require('elliptical-scope'),require('elliptical-cache'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-dustjs','elliptical-scope','elliptical-cache'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root.dust);
    }
}(this, function (dust) {

    window.dust=dust;
    var utils= $.elliptical.utils;
    var _=utils._;
    if(typeof window.dust !== 'undefined'){
        $.widget.$providers({
            template:window.dust
        })
    }


    $.element('elliptical.template', $.elliptical.scope,{

        /**
         * init
         * @private
         */
        _initElement:function(){
            this._super();

            this._initTemplateElement();
        },

        _initTemplateElement:function(){
            if (this.options.setVisibility === undefined) {
                this.options.setVisibility = true;
            }
            if (this.options.templateBind === undefined) {
                this.options.templateBind = true;
            }

            if(this.options.templateBind){
                this.__onTemplateAssign();
            }
            this._data.set('Running',null);
            this._data.set('unlockInterval',300);
            this._data.set('_intervalId',null);
            this._data.set('fragment',null);
            this._data.set('templateId',null);
            this._data.set('templateNode',null);
            this._data.set('tree',[]);
            this._data.set('pathObservers',[]);
            this._data.set('_setDiscardBit',true);
            this._data.set('modelPathTree',[]);
            this._data.set('previouslyBound',false);
            this._data.set('_watched',false);
            this._data.set('htmlProp','innerHTML');
            this._data.set('modelNodeSelector','[model-id]');
            this._data.set('attrId','model-id');
        },



        /**
         * watch for the client-side template scripts to be loaded in
         * @private
         */
        __onTemplateAssign:function(){
            var self=this;
            var count=0;
            var intervalId=setInterval(function(){
                if(this._destroyed){
                    clearInterval(intervalId);
                    self.destroy();
                    return;
                }
                var template=self.__getTemplateNode();
                if(template && template[0]){
                    clearInterval(intervalId);
                    self._data.set('templateNode',template);
                    //precompile template, if applicable
                    var id = self.__getTemplateId(template);
                    self._data.set('templateId',id);
                    var prop = self._data.get('htmlProp');
                    self._precompileTemplate(id, template,prop);
                    self._onTemplateLoaded();
                    //bind
                    self.__bind();
                }else{
                    if(count > 10){
                        clearInterval(intervalId);
                    }
                    count++;
                }


            },300);
        },

        _onTemplateLoaded: $.noop,

        /**
         * databind if we have a $scope, otherwise call the watcher
         * @param repeat {Boolean}
         * @private
         */
        __bind:function(repeat){
            var template=this._data.get('templateNode');
            this.__initTemplate(template);
            this.__initDOMObserver(template[0]);
            var redraw=true;
            if(this.__isModelList()){
                (this.__scopeLength() > 0) ? this.__databind(template,repeat,redraw) : this.__watch(template,true,repeat);
            }else{
                (!_.isEmpty(this.$scope)) ? this.__databind(template,repeat,redraw) : this.__watch(template,false,repeat);
            }
        },

        /**
         *
         * @param template {Object}
         * @param isArray {Boolean}
         * @param repeat {Boolean}
         * @private
         */
        __watch:function(template,isArray,repeat){
            var self=this;
            this._data.set('_watched',true);
            var redraw=true;
            var intervalId=setInterval(function(){
                self._data.set('_intervalId',intervalId);
                if((isArray && self.__scopeLength() > 0 ) || (!isArray && !_.isEmpty(self.$scope))){
                    self._data.set('_watched',false);
                    clearInterval(intervalId);
                    self.__databind(template,repeat,redraw);
                }
            },100);
        },

        /**
         *
         * @private
         */
        __getTemplateNode:function(){
            var element=this.element;
            if(this._destroyed){
                this.destroy();
                return;
            }
            //this._data.htmlProp = 'innerHTML';
            var template=element.selfFind('[template]');
            if(!template[0]){
                template=element.selfFind('[ui-template][data-upgraded="true"]');
            }
            return template;
        },

        __writeTemplateId:function(element,attr){
            var id='str-' + this._randomString(8);
            element.attr(attr,id);
            return id;
        },

        __getTemplateId:function(template){
            if(!template){
                return null;
            }
            var element=template[0];
            var id;
            if(element.hasAttribute('template')){
                id=element.getAttribute('template');
                return (id==='') ? 'str-' + this.__writeTemplateId(template,'template') : id;
            }else if(element.hasAttribute('ui-template')){
                id=element.getAttribute('ui-template');
                return (id==='') ? 'str-' + this.__writeTemplateId(template,'ui-template') : id;
            }else if(element.hasAttribute('name')){
                id=element.getAttribute('name');
                return (id==='') ? 'str-' + this.__writeTemplateId(template,'name') : id;
            }else if(element.hasAttribute('id')){
                id=element.getAttribute('id');
                return (id==='') ? 'str-' + this.__writeTemplateId(template,'id') : id;
            }else{
                return null;
            }

        },

        /**
         * gets and parses the element template fragment
         * @param template {Object}
         * @private
         */
        __initTemplate:function(template){
            var fragment;
            var id = template.attr('id');
            if (id === undefined) {
                id = template.attr('template');
            }
            var name=template.attr('name');
            if(typeof id !=='undefined'){
                this._data.set('templateId',id);
                fragment=this._getFragmentById(id);
                this._data.set('fragment',fragment);
                if(fragment){
                    this.__parseTemplateFragment(fragment);
                }

            }else if(typeof name !=='undefined'){
                this._data.set('templateId',name);
                fragment=this.__getFragmentByName();
                this._data.set('fragment',fragment);

                if(fragment){
                    this.__parseTemplateFragment(fragment);
                }
            }
        },


        /**
         * init template fragment mutation observer for template DOM additions/removal
         * @param template {Object} Node Element
         * @private
         */
        __initDOMObserver:function(template){
            var self=this;
            var observer=new MutationObserver(function(mutations){
                mutations.forEach(function(mutation){
                    if(mutation.addedNodes && mutation.addedNodes.length>0){ //nodes added
                        self.__addedNodes(mutation.addedNodes);

                    }
                    if(mutation.removedNodes && mutation.removedNodes.length>0){ //nodes removed

                        self.__removedNodes(mutation.removedNodes);
                    }

                    /* fire the hook for the mutation record */
                    self._onDOMMutation(mutation);
                });

            });
            observer.observe(template, {childList: true,subtree:true});
            this._data.set('DOMObserver',observer);
        },


        __getFragmentByName:function(){
            var templateNode=this._data.get('templateNode');
            //if(this.options.bindHTML5Imports){
            //this._renderElementTemplateImports(templateNode);
            //}
            return templateNode.html();
        },

        /**
         * parses a fragment into a contextKeyArray
         * a dom fragment is passed to dust.parse, which returns an array
         * the array is then further parsed into a contextKeyArray
         * contextKeyArray = array of cxt objects
         *
         * NOTE: context==section in the dustjs parlance
         *
         * cxt={
             *    index: {number} the context depth index
             *    context: {string} the context/section at the index
             *    cxt: {array} string of contexts(context/section tree) for each index up to current index
             *    key: {string} model prop/key
             * }
         *
         * the last object will be the array of context/section trees
         *
         * example: users=[
         *   {
             *    name:'Bob Smith'
             *    addresses:[{address:'1234 East Ave'},{address:'1673 Main St'}]
             *   },
         *   {
             *    name:'Jane Doe'
             *    addresses:[{address:'4321 West Ave'},{address:'9090 XYZ Ave'}]
             *   }
         * ]
         *
         * contextKeyArray=[
         *   {
             *     context:'users',
             *     cxt:['users'],
             *     index:0
             *   },
         *   {
             *     context:'users',
             *     cxt:['users'],
             *     index:0,
             *     key:'name'
             *   },
         *   {
             *     context:'addresses',
             *     cxt:['users','addresses'],
             *     index:1
             *   },
         *   {
             *     context:'addresses',
             *     cxt:['users','addresses'],
             *     index:1,
             *     key:'address'
             *   },
         *   {
             *     [
             *       {
             *        context:'users',
             *        cxt:['users'],
             *        index:0
             *       },
             *       {
             *        context:'addresses',
             *        cxt:['users','addresses'],
             *        index:1
             *       }
             *
             *
             *     ]
             *   }
         * ]
         * @param fragment {Object}
         * @private
         */
        __parseTemplateFragment:function(fragment){
            var provider=this.options.$providers.template;
            var parsed=provider.parse(fragment);
            var contextArray=[];
            var contextKeyArray=[];
            var index=0;
            var context;

            if(parsed.length && parsed.length >0){
                tree(parsed);
            }


            /**
             * recursively parses dust array to build our custom contextKeyArray to enable
             * matching node elements with a javascript model without having to resort to excessive data-path-annotations
             * @param arr {Array}
             */
            function tree(arr){
                if(arr && arr.length){
                    arr.forEach(function(obj){
                        if(obj[0]==='#' && _.isArray(obj)){
                            var obj_={
                                index:index,
                                context:obj[1][1],
                                cxt:getCxt(obj[1][1],index,false)
                            };
                            context=obj[1][1];
                            contextKeyArray.push(obj_);
                            contextArray.push(obj_);
                            var indexRef=index;
                            index++;
                            tree(obj);
                            index=indexRef;

                        }else if(obj[0]==='bodies'){
                            tree(obj[1]);
                        }else if(obj[0]==='reference'){
                            tree(obj[1]);
                        }else if(obj[0]==='body'){

                            obj.forEach(function(o){
                                if(o[0]==='reference'){
                                    var obj_={
                                        cxt:getCxt(context,index),
                                        context:context,
                                        index:index,
                                        key:o[1][1]
                                    };
                                    contextKeyArray.push(obj_);
                                }
                            });
                            tree(obj);
                        }
                    });
                }
            }

            /**
             * builds a context/section tree array for a passed context and context index(depth)
             * @param context {String}
             * @param index {Number}
             * @param dec {Boolean}
             * @returns {Array}
             */
            function getCxt(context,index,dec){
                if(typeof dec==='undefined'){
                    dec=true;
                }

                if(index > 0 && dec){
                    index--;
                }
                var arr=[];
                contextArray.forEach(function(obj){
                    if(obj.index < index){
                        arr.push(obj.context);
                    }
                });
                if(context){
                    arr.push(context);
                }

                return arr;
            }

            contextKeyArray.push(contextArray);
            this._data.set('contextKeyArray',contextKeyArray);

        },

        /**
         * returns template fragment model children (ui-model) nodes(jQuery objects)
         * @private
         * @returns {Array}
         */
        __templateModels: function(template){
            if(typeof template==='undefined'){
                template=this._data.get('templateNode');
            }
            var modelNode=this._data.get('modelNodeSelector');
            return (template) ? template.find(modelNode) : null;

        },

        _templateNodes:function(){
            return this.__templateModels();
        },

        _nodeById:function(id){
            var nodes=this._templateNodes();
            return nodes.selfFind('[model-id="' + id + '"]');
        },


        /**
         * bind path observers to DOM
         * @param template {Object}
         * @param repeat {Boolean}
         * @param redraw {Boolean}
         * @private
         */
        __databind:function(template,repeat,redraw){
            /* lock observer callbacks while data binding */
            this.__lock();

            var self=this;
            var $scope=this.$scope;

            var models=this.__templateModels(template);

            //two-way databind only: if the model is an array and model is already rendered
            if(this.__isModelList() && models && models.length > 0 && redraw===undefined) {
                $.each(models, function (i, model) {
                    self.__bindModel(model, i);
                });
            }else if(!_.isEmpty($scope) && repeat===undefined){
                //if we need to first render the model and then two-way databind
                this.__render($scope,function(){
                    self.__databind(template,false,undefined);
                });

            }else{
                //model is an object
                this.__bindModel(template[0],null);
            }
            /* mark DOM as bound(i.e., text Nodes have been created for keys) */
            this._data.set('previouslyBound',true);

            /* unlock observer callbacks */
            this.__unlock();

            self.__setVisibility(template);

        },

        /**
         * renders the template fragment directly using the $scope
         * @param $scope {Object}
         * @param callback {Function}
         * @private
         */
        __render: function($scope,callback,count){
            var MAX_COUNT=3;
            if(count===undefined){
                count=0;
            }
            var self=this;
            var opts={};
            opts.template=this._data.get('templateId');

            if (opts.template === undefined || opts.template === null) {
                var templateNode=this._data.get('templateNode');
                if(!templateNode){
                    templateNode=this.__getTemplateNode();
                }
                this._data.set('templateNode',templateNode);
                opts.template = this.__getTemplateId(templateNode);
            }
            if (!(opts.template === undefined || !opts.template)) {
                if (this.__isModelList()) {
                    var prop = Object.keys($scope)[0];
                    opts.model = $scope[prop];
                    opts.context = prop;
                } else {
                    opts.model = $scope;
                }
                opts.parse = false;
                this.__renderTemplate(opts, callback);
            } else {
                var timeoutId=setTimeout(function () {
                    if(count < MAX_COUNT){
                        count++;
                        self.__render($scope, callback,count);
                    }else{
                        clearTimeout(timeoutId);
                    }

                }, 500);
            }
        },

        /**
         *
         * @param opts {Object}
         * @param callback {Function}
         * @private
         */
        __renderTemplate:function(opts,callback){
            var self=this;
            var templateNode=this._data.get('templateNode');
            var scope=this.$scope;
            this._renderTemplate(opts,function(err,out){
                //var html=out.replace(/<ui-template(.*?)>/g,'').replace(/<\/ui-template>/g,'');
                var html=out;
                if(html!==undefined){
                    templateNode.html(html);
                }
                if(callback){
                    callback(err,html);
                }
            });
        },

        /**
         * lock observer callbacks(scope and mutation)
         * @private
         */
        __lock:function(){
            this._data.set('Running',true);
            if(this._data.get('_setDiscardBit')){
                this._data.set('_discard',true);
            }
        },

        /**
         * unlocks observer callbacks
         * if the mutation or scope observer callback is triggered during data binding, infinite
         * looping can result. so block this with flag settings
         * @private
         */
        __unlock:function(){
            var self=this;
            var unlockInterval=this._data.get('unlockInterval');
            setTimeout(function(){
                self._data.set('Running',null);
                self._data.set('_discard',false);
                self._data.set('_setDiscardBit',true);

            },unlockInterval);
        },

        __setVisibility:function(template){
            if(this.options.setVisibility===true){
                this._setVisibility(template);
            }
        },

        _setVisibility:function(template){
            if(template===undefined || !template){
                template=this._data.get('templateNode');
            }
            template.addClass('visible');
            this.element.attr('loaded', true);
        },



        /**
         * two-way binds a model to the template DOM fragment
         * @param fragment
         * @param index
         * @private
         */
        __bindModel:function(fragment,index){
            var self=this;
            var $scope=this.$scope;
            var contextIndex=0;
            var modelPathTree=[];
            var pathObservers=this._data.get('pathObservers');
            var templateNode=this._data.get('templateNode');
            if(!index && this.options.scope){
                setModelPath(0,this.options.scope,null);
            }
            /**
             *  pushes an object representing the resolved model path for the currently traversed node
             *  to the modelPathTree array
             *
             *  modelPathTree=array of {index:<number>,context:<string>,cxt:<array>,modelIndex:<number}}
             *  a modelPathTree and a key, for example, gives you a resolvable path for a node that can be passed to a pathObserver
             *
             *  the modelPathTree array records the resolved model path for each context/section in the current node tree hierarchy
             * @param cxtIndex {number} context/section depth
             * @param context {string} context/section name
             * @param modelIndex {number} model depth
             */
            function setModelPath(cxtIndex,context,modelIndex){
                var path_=self.__getTemplateContextArray();
                if(path_ && path_.length > 0){
                    path_.forEach(function(obj){
                        if(obj.index===cxtIndex && obj.context===context){
                            var cxt={
                                index:cxtIndex,
                                context:obj.context,
                                cxt:obj.cxt,
                                modelIndex:modelIndex
                            };
                            modelPathTree.push(cxt);

                        }
                    });
                }
            }

            /**
             * returns the last element of the modelPathTree array
             * @returns {Object}
             */
            function getLastRecordedModelPath(){
                return (modelPathTree.length > 0) ? modelPathTree[modelPathTree.length -1] : null;

            }

            /**
             * get context array by depth
             * @param cxtIndex{number}
             * @returns {Array}
             */
            function getModelContextByDepth(cxtIndex){
                var arr=[];
                var path_=self.__getTemplateContextArray();
                if(path_ && path_.length > 0){
                    path_.forEach(function(obj){
                        if(obj.index===cxtIndex){
                            arr.push(obj);
                        }
                    });
                }

                return arr;
            }

            /**
             * returns the context depth of a ui-model node relative to parent ui-template node
             * @param node {object} HTMLElement
             * @returns {number}
             */
            function modelDepth(node) {
                var depth = 0;
                var templateNode_ = templateNode[0];
                //simply get the parent of the current node until we reach the ui-template node.
                //test each parent for model node tag or attribute
                while (!(node===templateNode_)) {
                    node = $(node).parent()[0];
                    if(node.tagName==='UI-MODEL' || node.hasAttribute('model-id')){
                        depth++;
                    }
                }
                return depth;
            }


            /**
             * delete branches from tree that have index greater than the passed context index
             * @param cxtIndex
             */
            function popModelPathTree(cxtIndex){
                if(modelPathTree.length > 0){
                    _.remove(modelPathTree,function(obj){
                        return (obj.index > cxtIndex);
                    })
                }
            }
            function clearModelPathTree(){
                modelPathTree.length=0;
            }


            /**
             * sets the modelPathTree for the traversed node and passes any nodes with attributes to the parseNodeAttributes function
             * @param node {Object}
             * @private
             */
            function parseNode(node){

                //if <ui-model> node only
                if((node.tagName && node.tagName.toLowerCase()==='ui-model') ||(node.hasAttribute && node.hasAttribute('model-id'))){

                    /* resolve the model path for any <ui-model> node and insert into the modelPathTree.
                     The modelPathTree, along with any given node's data attributes(data-key=,data-attribute=),
                     is sufficient to set a pathObserver for a the given node within the node hierarchy
                     */

                    /* current context depth */
                    contextIndex=modelDepth(node);

                    var lastRecordedContext=getLastRecordedModelPath();
                    //if current depth less than last recorded depth, pop modelPathTree back to current depth
                    if(lastRecordedContext && lastRecordedContext.index > contextIndex){
                        popModelPathTree(contextIndex);
                    }


                    /* current model index.
                     NOTE: model index==applicable $scope index. it has no relation to any persistent backend index */
                    var parent=(contextIndex===0) ? self._data.get('templateNode')[0] : $(node).parents(self._data.get('modelNodeSelector'))[0];
                    /*  if there is only a single context at the tree depth, model index = <ui-model> DOM child index

                     Pagination NOTE: it is assumed pagination loads in a new scope with a different paginated view; two-way data-binding
                     will not work for $scope pagination, the nodes will not be synced with the $scope
                     */
                    if(parent===undefined){
                        parent=self._data.get('templateNode')[0];
                    }
                    var modelNodeSelector = self._data.get('modelNodeSelector');
                    var modelNodes = $(parent).closestChildren(modelNodeSelector);
                    var modelIndex=modelNodes.index($(node));

                    //check if more than one context for this tree depth
                    var contextArr_=getModelContextByDepth(contextIndex);
                    var cxt_={};

                    if(contextArr_ && contextArr_.length > 1){
                        //multiple contexts at this tree depth

                        /* we have to correct model index, since it is calculated by simple children index in the DOM
                         for multiple contexts at the same depth, the model index is no longer synced with the DOM index
                         __getCurrentContextModelPath returns the correct model index for the context based on the DOM child index
                         and the $scope
                         */
                        cxt_=self.__getCurrentContextModelPath(modelPathTree,contextIndex,contextArr_,modelIndex);

                        if(lastRecordedContext && contextIndex > lastRecordedContext.index){
                            popModelPathTree(contextIndex);
                            setModelPath(contextIndex,cxt_.context,cxt_.modelIndex);

                        }else{
                            modelPathTree.pop();
                            setModelPath(contextIndex,cxt_.context,cxt_.modelIndex);
                        }

                        /* if current context tree depth greater than last recorded, just set the model path */
                    }else if(lastRecordedContext && contextIndex > lastRecordedContext.index) {
                        setModelPath(contextIndex, contextArr_[0].context, modelIndex);
                        //if last record but same depth as last record, pop and set:this refreshes model index
                    }else if(lastRecordedContext){
                        modelPathTree.pop();
                        setModelPath(contextIndex,contextArr_[0].context,modelIndex);
                        //if no last record, simply set
                    }else if(!lastRecordedContext && contextArr_.length > 0){
                        setModelPath(contextIndex,contextArr_[0].context,modelIndex);
                    }
                }else{

                    /* get reference to parent ui-model node */
                    var parent = $(node).parents(self._data.get('modelNodeSelector'))[0];
                    /* get context index */
                    if(parent){
                        contextIndex=modelDepth(parent);

                    }else{
                        contextIndex=0;
                        clearModelPathTree();
                    }
                    var lastRecordedContext=getLastRecordedModelPath();
                    //if current depth less than last recorded depth, pop modelPathTree
                    if(lastRecordedContext && lastRecordedContext.index > contextIndex){
                        popModelPathTree(contextIndex);
                    }

                }

                //for non-textNodes with attributes
                if (node.nodeType !== 3) {
                    if (node.hasAttributes && node.hasAttributes()) {
                        parseNodeAttributes(node);
                    }
                }
            }

            /**
             * parses a node attributes to send for text binding or attribute binding
             * @param node {Object}
             * @private
             */
            function parseNodeAttributes(node){
                var id=self._data.get('scopeId');
                if(id===undefined){
                    id='id';
                }
                var key,keys,attr;
                $.each(node.attributes,function(i,attribute){
                    try{
                        if(attribute && attribute!==undefined && attribute !==''){
                            if(attribute.name.indexOf('model')===0){
                                key=id;
                                attr=attribute.name;
                                var tuple_=[attr,key];
                                bindAttributeObserver(node,tuple_,attribute.value);
                            }else if(attribute.name.indexOf('data-bind')===0 && attribute.value !==undefined && attribute.value !==''){
                                var values=attribute.value.split(',');

                                if(values.length){
                                    values.forEach(function(val){
                                        val=val.trim();
                                        var ntuple=val.split(':');
                                        var bindingType=ntuple[0];
                                        (bindingType==='text') ? bindTextNodeObserver(node,ntuple) : bindAttributeObserver(node,ntuple);
                                    });
                                }
                            }
                        }

                    }catch(ex){
                        console.log(ex);
                    }
                });


                //set index path for ui-model nodes
                if ((node.tagName && node.tagName.toLowerCase() === 'ui-model') || (node.hasAttribute('model-id'))) {
                    setData(node);
                }
            }

            /**
             * creates a textNode and path observer for a bindable model property
             * @param node {Object}
             * @param tuple {Array}
             */
            function bindTextNodeObserver(node,tuple){
                //var values_=tuple.split(':');
                var key=tuple[1];
                var fn={};
                if(tuple.length > 2){
                    fn=parseFunction(tuple[2]);
                }
                var $cache=self._data.get('$cache');
                var previouslyBound=self._data.get('previouslyBound');
                var path = self.__createPath(modelPathTree, $scope,key);
                var value = utils.objectPropertyByPath($scope, path);
                /* if the tuple has a function attached, evaluate the value from the function */
                if(!_.isEmpty(fn)){
                    value=eval_(value,fn,self);
                    //update the path value of scope
                    utils.assignValueToPath($scope,path,value);
                }
                var $node=$(node);
                var text,$text;
                /* if fragment has been previously bound, we select textNode, otherwise create it */
                if(previouslyBound){
                    var $textNodes=$node.findTextNodes();
                    $.each($textNodes,function(i,t){
                        if(t.textContent===value){
                            $text=$(t);
                        }
                    });
                    text=($text && $text[0]) ? $text[0] : self.__createTextNode($node,node,value);
                }else{
                    /* create and append */
                    text=self.__createTextNode($node,node,value);
                }
                $cache.set(text,{observers:path});
                var obsPath=utils.observerMapPath(path);
                var observer = new PathObserver($scope, obsPath);
                text.bind('textContent', observer);
                var observer_ = {
                    type: 'text',
                    value:'textContent',
                    node: text,
                    path:path,
                    observer: observer

                };

                pathObservers.push(observer_);
            }

            /**
             * bind path observers to attributes
             * @param node {Object}
             * @param tuple {Array}
             * @param mId {String}
             */
            function bindAttributeObserver(node,tuple,mId){
                var attribute=tuple[0];
                var key=tuple[1];
                var fn={};
                if(tuple.length > 2){
                    fn=parseFunction(tuple[2]);
                }
                var $cache=self._data.get('$cache');
                var observers_,id_;
                var path = self.__createPath(modelPathTree, $scope, key);
                var value = utils.objectPropertyByPath($scope, path);


                /* if the tuple has a function attached, evaluate the value from the function */
                if(!_.isEmpty(fn)){
                    value=eval_(value,fn,self);
                    //update the path value of scope
                    utils.assignValueToPath($scope,path,value);
                }
                var data=$cache.get(node);
                if(data){
                    observers_=data.observers;
                    id_=data.id;
                }else{
                    id_=mId;
                }
                if(observers_ && observers_.length > 0){
                    var obj_=null;
                    observers_.forEach(function(o){
                        if(o.value===attribute){
                            o.path=path;
                            o.value_=value;
                            obj_=o;
                        }
                    });
                    if(!obj_){
                        obj_={
                            value:attribute,
                            value_:value,
                            path:path
                        };
                        observers_.push(obj_);
                    }
                }else{
                    observers_=[];
                    obj_={
                        value:attribute,
                        value_:value,
                        path:path
                    };
                    observers_.push(obj_);
                    $cache.set(node,{observers:observers_,id:id_});
                }
                var obsPath=utils.observerMapPath(path);
                var observer = new PathObserver($scope, obsPath);
                node.bind(attribute, observer);
                var observer_ = {
                    type: 'attribute',
                    value:attribute,
                    node: node,
                    path:path,
                    observer: observer

                };

                pathObservers.push(observer_);
            }

            /* parse a stringified function into method name + arg list */
            function parseFunction(sFunc){
                var argList;
                var args=sFunc.match(/\((.*?)\)/g);
                if(!args){
                    args='';
                }
                var func=sFunc.replace(args,'');
                args=args.replace('(','');
                args=args.replace(')','');
                if(args.length < 1){
                    argList=[]
                }else{
                    argList=args.split(',');
                }

                return{
                    func:func,
                    args:argList
                }
            }

            /* evaluates a template value from a passed function */
            function eval_(value,fn,that){
                var func=fn.func;
                var f,args;
                if(window.dust.helpers.inline[func]){//dust.helpers.inline
                    f=window.dust.helpers.inline[func];
                    args=fn.args;
                    (args.length >0) ? args.unshift(value) : args.push(value);
                    return f.apply(this,args);
                }else if(window[func]){//window
                    f=window[func];
                    args=fn.args;
                    (args.length >0) ? args.unshift(value) : args.push(value);
                    return f.apply(this,args);
                }else if(that[func]){ //controller instance prototype
                    f=that[func];
                    args=fn.args;
                    (args.length >0) ? args.unshift(value) : args.push(value);
                    return f.apply(that,args);
                }else{
                    return value;
                }

            }

            /**
             *  set the index path data for ui-model nodes
             * @param node {Object}
             */
            function setData(node){
                var $cache=self._data.get('$cache');
                var data=$cache.get(node);
                var observers,id;
                if(data){
                    observers=data.observers;
                    id=data.id;
                }
                var path = self.__createPath(modelPathTree,$scope);
                try{
                    index=utils.getIndexFromPath(path);
                }catch(ex){

                }

                $cache.set(node,{path:path,id:id,index:index,observers:observers});

            }


            /* walk the dom fragment with parseNode as the function */
            this.__traverseDOM(fragment,parseNode);

        },

        /**
         * standard walk-the-dom recursion
         * @param node {Element}
         * @param func {Function}
         * @private
         */
        __traverseDOM:function(node,func){
            func(node);
            node = node.firstChild;
            while (node) {
                this.__traverseDOM(node, func);
                node = node.nextSibling;
            }
        },

        /** //TODO: enable multiple keys mappings to text nodes within an element: ex: <h2 data-key="firstName,lastName">Hello, {firstName} {lastName}</h2>
         *  //currently, to have correctly functioning two-way binding, you would have to do something like:
         *  //<h2>Hello, <span data-key="firstName">{firstName}</span> <span data-key="lastName">{lastName}</span></h2>
         *  //not a show-stopper, but it is a bit of an inconvenience
         *
         * create text node
         * @param $node {Object} jQuery
         * @param node {Object} Element
         * @param value {String}
         * @returns {Text} {Object} jQuery
         * @private
         */
        __createTextNode: function($node,node,value){
            $node.text($node.text().replace(value, ''));
            var text = document.createTextNode(value);
            node.appendChild(text);

            return text;
        },

        /**
         * returns the context tree array from the contextKeyArray(i.e., returns the last item in the contextKeyArray)
         * @returns {Array}
         * @private
         */
        __getTemplateContextArray:function(){
            var contextKeyArray=this._data.get('contextKeyArray');
            return (contextKeyArray && contextKeyArray.length > 0) ? contextKeyArray[contextKeyArray.length -1] : [];
        },

        /**
         * returns a resolved path based on the passed modelPathTree and key
         * @param modelPathTree {Array}
         * @param key {String}
         * @returns {string} path
         * @private
         */
        __createPath: function(modelPathTree,$scope,key){
            var path='';
            modelPathTree.forEach(function(obj){
                if (typeof obj.modelIndex !== 'undefined') {
                    var test = path + obj.context;
                    path =(utils.isPropertyArrayByPath($scope,test)) ? path + obj.context + '.' + obj.modelIndex + '.' : path + obj.context + '.';
                    //path += obj.context + '.' + obj.modelIndex + '.';
                }else{
                    path += obj.context + '.'
                }
            });

            (typeof key !=='undefined') ? path+=key : path=path.substring(0, path.length - 1);
            return path;
        },

        /**
         * returns a resolved context path based on the passed modelPathTree context index, and context
         * @param modelPathTree {Array}
         * @param cxtIndex {Number}
         * @param context {String}
         * @returns {String} path
         * @private
         */
        __createPathByContextIndex: function(modelPathTree,cxtIndex,context){
            var path='';
            modelPathTree.forEach(function(obj){
                if(obj.index <= cxtIndex){
                    path += obj.context + '.' + obj.modelIndex + '.';
                }

            });
            path += context;

            return path;
        },


        /**
         * @param modelPathTree {Array}
         * @param cxtIndex {Number}
         * @param contextArray {Array}
         * @param index {Number}
         * @returns {*}
         * @private
         */
        __getCurrentContextModelPath: function(modelPathTree,cxtIndex,contextArray,index){
            var self=this;
            var $scope=this.$scope;
            /*we need to calculate context/array lengths for contexts with equal hierarchy. The model index of the current
             node will then allow us to determine which context we are currently in.

             Hence, we need the resolved path for the context index==cIdx == (cxtIndex >0)? (cxtIndex-1) : 0;

             */

            var cIdx=(cxtIndex>0) ? cxtIndex-1 : 0;
            var pathArray=[];
            contextArray.forEach(function(obj){
                var path=self.__createPathByContextIndex(modelPathTree,cIdx,obj.context);
                var length=utils.arrayPropertyLengthByPath($scope,path);
                pathArray.push({length:length,context:obj.context,cxt:obj.cxt});
            });


            if(pathArray.length > 1){
                var obj_={};
                var cumlativeLength=0;

                for(var i=0;i<pathArray.length;i++){
                    if((index < pathArray[i].length + cumlativeLength)|| (!pathArray[i].length)){
                        obj_.modelIndex=index-cumlativeLength;
                        obj_.context=pathArray[i].context;
                        obj_.cxt=pathArray[i].cxt;
                        obj_.index=cxtIndex;
                        break;
                    }else{
                        cumlativeLength +=pathArray[i].length;
                    }
                }
                return obj_;
            }else{
                return {
                    modelIndex:index,
                    context:contextArray[0].context,
                    cxt:contextArray[0].cxt,
                    index:contextArray[0].index
                };
            }
        },

        /**
         * get parent model('ui-model') node of a node
         * @param node {Object}
         * @returns {Object}
         * @private
         */
        __getParentModelNode:function(node){
            var parent=$(node).parents(this._data.get('modelNodeSelector'));
            if(parent[0]){
                return parent[0];
            }else{
                var templateNode=this._data.get('templateNode');
                return templateNode[0];
            }
        },

        /**
         * onAddedNodes
         * @param added {Array}
         * @private
         */
        __addedNodes:function(added){
            if(this._data.get('Running')){
                return;
            }
            if(this.__isModelList()){
                this.__rebind();
            }

        },

        /**
         * mutation handler for removed nodes.
         * deletes paths from the scope and rebinds path observers
         * @param removed{Array}
         * @private
         */
        __removedNodes:function(removed){
            /* exit if triggered during data-binding */
            return;
            if(this._data.get('Running')){
                return;
            }
            var $scope=this.$scope;
            var self=this;
            var rebind_;
            var boolRebind=false;
            for(var i=0;i<removed.length;i++){
                var $cache=this._data.get('$cache');
                var node=removed[i];
                var observers=$cache.get(node);
                if(observers){
                    rebind_=this.__parseObservers(node,$scope);
                    if(rebind_){
                        boolRebind=true;
                    }
                }else{
                    var children=$(removed).findTextNodeDescendants();
                    if(children && children.length > 0){
                        $.each(children,function(i,obj){
                            rebind_=self.__parseObservers(obj,$scope);
                            if(rebind_){
                                boolRebind=true;
                            }
                        });
                    }
                }
            }

            if(boolRebind){
                this.__rebind();
            }

            this._onRemovedNodes(removed);
        },

        /**
         * performs a $scope splice or delete based on node path
         * @param node {Object}
         * @param $scope {Object}
         * @private
         */
        __parseObservers:function(node,$scope){
            var $cache=this._data.get('$cache');
            var observers=$cache.get(node);
            if(typeof observers !=='undefined'){
                var path=observers.path;
                /* determine if path if part of an array or object
                 if object, delete property
                 if array, splice
                 */
                //
                var isArray=utils.isPathInArray(path);
                (isArray) ? this.__spliceArray($scope,path) : utils.deleteObjectPropertyByPath($scope,path);
                return true;
            }else{
                return false;
            }
        },

        /**
         * splice an array $scope property
         * @param $scope {Object}
         * @param path {String}
         * @private
         */
        __spliceArray:function($scope,path){
            var index=utils.getIndexFromPath(path);
            if(index !== undefined){
                path=this.__parsePath(path,index);
                var arr=utils.objectPropertyByPath($scope,path);
                this._data.set('_discard',false);
                this._data.set('_setDiscardBit',false);
                arr.splice(index,1);
            }
        },

        /**
         * returns a path substring for the array property, removing the index of the array element
         * @param path {String}
         * @param index {Number}
         * @returns {string}
         * @private
         */
        __parsePath:function(path,index){
            return path.substring(0, path.length - (index.toString().length + 1));
        },


        /**
         * rebinds the pathObservers, called after a model removal or addition
         * @private
         */
        __rebind: function(){
            var template=this._data.get('templateNode');
            this.__unbindPathObservers();
            this.__databind(template);
        },


        /**
         * $scope change callback handler mediator
         * @param result {Object}
         * @private
         */
        __onScopeChange: function(result){
            if(result.removed && result.removed.length && result.removed.length > 0) {
                this.__onRemoved(result.removed)
            }
            if(this._data.get('drop')){
            }
            this._onScopeChange(result);
        },


        /**
         * removes a ui-model node from the template by path
         * @param path {String}
         * @private
         */
        __onListRemove: function(path){

            var self=this;
            var templateNode=this._data.get('templateNode');
            var fragment=templateNode[0];
            var $cache=this._data.get('$cache');

            function removeNode(node){
                if((node.tagName && node.tagName.toLowerCase()==='ui-model') ||(node.hasAttribute && node.hasAttribute('model-id'))){
                    var observers=$cache.get(node);
                    var index=observers.index;
                    if(index===path){
                        node.remove();
                        self._data.set('previouslyBound',true);
                        self.__rebind();
                    }
                }
            }

            /* walk the dom fragment with removeNode as the function */
            this.__traverseDOM(fragment,removeNode);

        },

        /**
         * adds a ui-model node to the template as the result of an array operation
         * @param path {String} the path reference to the array within the $scope
         * @param section {String} the section name
         * @param op {String} operation: push or unshift
         * @private
         */
        __onListAdd: function(path,section,op){

            var self=this;

            /* get template */
            var templateName=this._compileFragment(path,section);

            /* get parent model node of the array */
            var parent=this.__getParent(path,section);

            /* get insertion index */
            var insertionIndex=(op==='push' || op==='concat') ? this.__getPushInsertionIndex(path,section) : this.__getUnshiftInsertionIndex(path,section);

            /* get model */
            var model=this.__getModelFromPath(path,op);

            /* render */
            var opts={};
            opts.template=templateName;
            opts.model=model;
            opts.context=section;
            opts.parse=false;
            this._renderTemplate(opts,function(err,out){
                if(!err){
                    self.__insertRenderedTemplate(out,parent,insertionIndex);
                }
            });

        },

        /**
         * compile a fragment of an existing template into provider cache, by path and section
         * @param path {string]
         * @param section {string}
         * @returns {string}
         * @private
         */
        _compileFragment:function(path,section){
            //todo verify fragment has not previously been compiled
            var provider=this.options.$providers.template;
            var id=this._data.get('templateId');
            var templateName = id + '-' + section;
            var fragment=this._getFragmentById(id);
            var match='{#' + section + '}.(.*?){\/' + section + '}';
            var partial=fragment.match(new RegExp(match,'g'));
            /* if number of matches > 1, assign correct partial */
            var partial_=(partial.length > 1) ? this.__getPartial(partial,path,section) : partial[0];
            var compiled=provider.compile(partial_,templateName);
            provider.loadSource(compiled);
            return templateName;
        },

        /**
         * get the model from the array path based on operation(push==last element, unshift=first element)
         * @param path {String}
         * @param operation {String}
         * @returns {Object}
         * @private
         */
        __getModelFromPath:function(path,operation){
            var $scope=this.$scope;
            var arr=utils.objectPropertyByPath($scope,path);
            //return (operation==='push') ? arr[arr.length-1] : arr[0];
            var ret;
            if(operation==='push'){
                return arr[arr.length-1];
            }else if(operation==='unshift'){
                return arr[0];
            }else{
                return arr;
            }
        },

        /**
         * returns the correct ui-model template fragment for section depths that have more than one context
         * @param partial {Array}
         * @param path {String}
         * @param section {String}
         * @returns {String} ui-model template fragment
         * @private
         */
        __getPartial:function(partial,path,section){
            var match = section + '.';
            var matches=path.match(new RegExp(match,'g'));
            var length=matches.length;
            return partial[length-1];
        },

        /**
         * gets the parent ui-model node
         * @param path {String}
         * @returns {Object} node
         * @private
         */
        __getParent:function(path){
            var paths=path.split('.');
            if (paths.length < 2){
                return this._data.get('templateNode')[0];
            }else{
                var path_=this.__getParentPath(paths);
                return this.__getParentByPath(path_);
            }
        },

        /**
         * gets the parent model node path
         * @param arr {Array}
         * @returns {string}
         * @private
         */
        __getParentPath:function(arr){
            var length=arr.length-1;
            var path='';
            for(var i=0;i<length;i++){
                path+=arr[i] + '.';
            }
            return path.substring(0,path.length-1);
        },

        /**
         * runs the walk the dom routine to find the ui-model parent node(finds it by the set index path in the dom cache store)
         * @param path {String}
         * @returns {*}
         * @private
         */
        __getParentByPath:function(path){
            var fragment=this._data.get('templateNode')[0];
            var $cache=this._data.get('$cache');
            var node_;
            function getNode(node){
                if((node.tagName && node.tagName.toLowerCase()==='ui-model') ||(node.hasAttribute && node.hasAttribute('model-id'))){
                    var observers=$cache.get(node);
                    var path_=observers.path;
                    if(path_===path){
                        node_=node;
                    }
                }
            }

            this.__traverseDOM(fragment,getNode);

            return node_;
        },

        /**
         *
         * for push: gets the insertion index to insert ui-model node into ui-model children
         * @param path {String}
         * @param section {String}
         * @returns {number}
         * @private
         */
        __getPushInsertionIndex:function(path,section){
            var $scope=this.$scope;
            var arr=this.__getContextArrayFromPath(path);
            var sectionContextProp=this.__getSectionContextProp(arr,section);
            if(sectionContextProp.count===1){
                return -1;
            }else{
                if(sectionContextProp.position===sectionContextProp.count -1){
                    return -1;
                }else{
                    var paths=path.split('.');
                    var parentPath=this.__getParentPath(paths);
                    var index=0;
                    for(var i=0;i<sectionContextProp.position + 1;i++){
                        var path_=(parentPath.length && parentPath.length > 0) ? parentPath + '.' + sectionContextProp.cxt[i] : sectionContextProp.cxt[i];
                        var length = utils.arrayPropertyLengthByPath($scope,path_);
                        index=index + length;
                    }
                    return index;
                }
            }
        },

        /**
         * for unshift: gets insertion index to insert ui-model node into a parent section's ui-model children
         * @param path {String}
         * @param section {String}
         * @returns {number}
         * @private
         */
        __getUnshiftInsertionIndex:function(path,section){
            var $scope=this.$scope;
            var arr=this.__getContextArrayFromPath(path);
            var sectionContextProp=this.__getSectionContextProp(arr,section);
            if(sectionContextProp.count===1){
                return 0;
            }else{

                var paths=path.split('.');
                var parentPath=this.__getParentPath(paths);
                var index=0;
                for(var i=0;i<sectionContextProp.position;i++){
                    var path_=parentPath + '.' + sectionContextProp.cxt[i];
                    var length = utils.arrayPropertyLengthByPath($scope,path_);
                    index=index + length;
                }
                return index;

            }
        },

        /**
         * returns a prop object for a template section, given a child context within that section
         * count: number of child contexts
         * position: position of our section in the list
         * cxt: array of the one-level down child contexts
         * @param arr {Array}
         * @param section {String}
         * @returns {Object}
         * @private
         */
        __getSectionContextProp:function(arr,section){
            var prop={};
            prop.count=arr.length;
            prop.cxt=arr;
            prop.position= _.indexOf(arr,section);

            return prop;
        },



        __getParentIndex:function(path){
            var paths=path.split('.');
            return path[0] + '.' + paths[1];
        },

        /**
         * returns the array of context blocks for a path
         * @param path {String}
         * @returns {Array}
         * @private
         */
        __getContextArrayFromPath:function(path){
            var self=this;
            var arr=[];
            var paths=path.split('.');
            paths.forEach(function(s){
                if(!self.__isNumeric(s)){
                    arr.push(s);
                }
            });

            var depth=arr.length-1;
            var contextArray=this.__getTemplateContextArray();
            var cxtArray=[];
            contextArray.forEach(function(obj){
                if(obj.index===depth){
                    cxtArray.push(obj.context);
                }
            });

            return cxtArray;
        },


        /**
         * numeric check for a string
         * @param p
         * @returns {boolean}
         * @private
         */
        __isNumeric:function(p){
            var p_ = parseInt(p);
            return !(isNaN(p_));
        },

        /**
         * inserts rendering into the template DOM fragment, discarding text nodes
         * @param out {Array}
         * @param parent {Object}
         * @param index {Number}
         * @private
         */
        __insertRenderedTemplate:function(out,parent,index){
            var fragment,$fragment;
            var $parent=$(parent);
            var models=$parent.closestChildren(this._data.get('modelNodeSelector'));
            $fragment=this._fragmentModelParser(out);
            fragment=$fragment[0];
            var model;
            if(index===-1){
                $parent.append($fragment);
            }else if(index===0){
                model=models[0];
                parent.insertBefore(fragment, model);
            }else{
                model=models[index];
                parent.insertBefore(fragment, model);
            }

            this.__rebind();
        },

        _fragmentModelParser:function(fragment){
            var doc = this._DOMParser(fragment);
            return $(doc).find('[model-id]');
        },


        /**
         * removes
         * @param removed
         * @private
         */
        __onRemoved:function(removed){
            var self=this;
            var rebind=false;
            var $cache=self._data.get('$cache');
            var id=this.options.idProp;
            if(id===undefined){
                id='id';
            }
            if(this.__isModelList()){
                removed.forEach(function(obj){
                    var models=self.__templateModels();
                    if(models && models.length > 0){
                        $.each(models,function(i,model){
                            var data=$cache.get(model);
                            if(data !==undefined && data.id !==undefined){
                                if(data.id===obj[id]){
                                    model.remove();
                                    rebind=true;
                                }
                            }else if(data && data.observers && data.observers.length){
                                data.observers.forEach(function(o){
                                    var id_=obj[id];
                                    if(o.value==='model-id' && o.value_===id_){
                                        model.remove();
                                        rebind=true;
                                    }
                                })
                            }
                        });
                    }
                });

                if(rebind){
                    self.__rebind();
                }
            }
        },


        /**
         * unbind path observers
         * @private
         */
        __unbindPathObservers:function(){
            var pathObservers=this._data.get('pathObservers');
            if(pathObservers && pathObservers.length && pathObservers.length >0){
                pathObservers.forEach(function(obj){
                    obj.observer.close();
                });
                utils.emptyArray(pathObservers);
            }
        },

        /**
         * unbind DOM mutation observer
         * @private
         */
        __unbindDOMObserver:function(){
            var DOMObserver=this._data.get('DOMObserver');
            if(DOMObserver){
                DOMObserver.disconnect();
            }
        },

        /**
         * unbind 2-way template binding
         * @private
         */
        __disposeTemplate: function(){
            this.__unbindDOMObserver();
            this.__unbindPathObservers();
        },

        /**
         * rebind template binding
         * @param render
         * @private
         */
        __rebindTemplate:function(render){
            if(this._data.get('_watched')){
                return false;
            }
            var repeat;
            if(typeof render==='undefined' || !render){
                repeat=true;
            }
            var template=this.__getTemplateNode();
            if(template[0]){
                this.__bind(repeat);
            }else if(this.options.loadedTemplate){
                this.__watchForTemplateInstance(repeat);
            }

            return true;
        },


        /**
         * watches for creation of a template instance before
         * firing template rebinding....e.g., ui-template tag is not initially part of the element DOM,
         * but included in the template rendered in by an element
         * @param repeat {Boolean}
         * @private
         */
        __watchForTemplateInstance:function(repeat){
            var self=this;
            var intervalId=setInterval(function(){
                var template=self.__getTemplateNode();
                if(template[0]){
                    clearInterval(intervalId);
                    self.__bind(repeat);
                }
            },100);
        },

        /**
         * reconnect disconnected MutationObserver
         * @private
         */
        __reconnect:function(){
            var observer=this._data.get('DOMObserver');
            if(observer){
                var template=this._data.get('templateNode');
                if(template[0]){
                    var node=template[0];
                    observer.observe(node, {childList: true,subtree:true});
                }
            }
        },

        /**
         *
         * @param delay {Number}
         * @private
         */
        _printPathObservers:function(delay){
            var self=this;
            if(delay===undefined){
                delay=0;
            }
            setTimeout(function(){
                console.log(self._data.get('pathObservers'));
            },delay);
        },

        /**
         *
         * @param node {Object|Element}
         * @returns {String}
         * @private
         */
        _getModelIdByNode:function(node){
            return node.getAttribute('model-id');
        },

        /**
         *
         * @param target {Object} element
         * @returns {String}
         * @private
         */
        _getModelIdByTarget:function(target){
            var $target=$(target);
            var model=$target.parents('[model-id]');
            return model.attr('model-id');
        },

        /**
         * returns the a model node cache object
         * @param node {Object} Element
         * @returns {Object}
         * @private
         */
        _getModelNodeCache:function(node){
            var $cache=this._data.get('$cache');
            return $cache.get(node);
        },

        /**
         * element cleanup onDelete
         * @private
         */
        _dispose:function(){
            this.__disposeTemplate();
            var intervalId=this._data.get('_intervalId');
            if(intervalId){
                clearInterval(intervalId);
            }
            this._super();
        },


        _onDOMMutation: $.noop,

        _onRemovedNodes: $.noop,

        _onScopeChange: $.noop,

        /**
         * delete node facade
         * used to delete a model node from DOM via splice or shift operation passed in a function
         * NOTE: if you don't use the facade, then its up to the dev to handle $scope changes in terms of removing deletions from DOM
         * @param func {Function}
         * @public
         */
        $deleteNodes:function(func){
            var self=this;
            var path;
            this.__unbindPathObservers();
            var $scope=this.$scope;
            func.call(this);

            /* stringify passed function */
            var str=func.toString();

            /* splice */
            path=str.match(/scope.(.*?).splice/g);
            if(path && path.length){
                path.forEach(function(s){
                    s= s.replace('scope.','');
                    s= s.replace('.splice','');
                    var pos1=str.indexOf('splice(');
                    var pos2=str.indexOf(',',pos1);
                    pos1=pos1 + 7;
                    var index=str.substring(pos1,pos2);
                    var path_=s + '.' + index;
                    path_=path_.replace(/]/g,'');
                    path_=path_.replace(/[[\]]/g,'.');

                    /* remove from DOM */
                    self.__onListRemove(path_);

                })
            }

            /* shift */
            path=str.match(/scope.(.*?).shift/g);
            if(path && path.length){
                path.forEach(function(s){
                    s= s.replace('scope.','');
                    s= s.replace('.shift','');
                    var path_=s + '.0';
                    path_=path_.replace(/]/g,'');
                    path_=path_.replace(/[[\]]/g,'.');

                    /* remove from DOM */
                    self.__onListRemove(path_);

                })
            }
        },

        /**
         * add node facade
         * adds a ui-model node to the template DOM as a result of a push or unshift operation on the $scope passed in a function
         * NOTE: if you don't use the facade, then its up to the dev to handle $scope changes in terms of rendering additions
         * @param func {Function}
         */
        $addNodes:function(func){
            var self=this;
            var path;
            this.__unbindPathObservers();
            var $scope=this.$scope;
            func.call(this);

            /* stringify passed function */
            var str=func.toString();

            /* push */
            path=str.match(/scope.(.*?).push/g);

            if(path && path.length){
                path.forEach(function(s){
                    s= s.replace('scope.','');
                    s= s.replace('.push','');
                    var path_=s;
                    path_=path_.replace(/]/g,'');
                    path_=path_.replace(/[[\]]/g,'.');
                    var paths=path_.split('.');
                    var section=paths[paths.length-1];

                    /* add the model node to the template */
                    self.__onListAdd(path_,section,'push');
                })
            }

            /* unshift */
            path=str.match(/scope.(.*?).unshift/g);
            if(path && path.length){
                path.forEach(function(s){
                    s= s.replace('scope.','');
                    s= s.replace('.unshift','');
                    var path_=s;
                    path_=path_.replace(/]/g,'');
                    path_=path_.replace(/[[\]]/g,'.');
                    var paths=path_.split('.');
                    var section=paths[paths.length-1];

                    /* add the model node to the template */
                    self.__onListAdd(path_,section,'unshift');
                })
            }

            path=str.match(/scope.(.*?).concat/g);
            if(path && path.length){
                path=str.replace(/scope.(.*?).=/g,'');
                path=path.match(/scope.(.*?).concat/g);
                if(path && path.length){
                    path.forEach(function(s){
                        s= s.replace('scope.','');
                        s= s.replace('.concat','');
                        var path_=s;
                        path_=path_.replace(/]/g,'');
                        path_=path_.replace(/[[\]]/g,'.');
                        var paths=path_.split('.');
                        var section=paths[paths.length-1];
                        /* add the model nodes to the template */
                        self.__onListAdd(path_,section,'concat');
                    })
                }
            }
        },

        $empty:function(){
            var template=this.__getTemplateNode();
            if(this.__isModelList()){
                var prop=(this.options.scope !==undefined) ? this.options.scope : utils.objectPropertyByIndex(this.$scope,0);
                this.$scope[prop].length=0;
                template.empty();
            }else{
                this.$scope={};
                template.empty();
            }
        },

        $unbindTemplate: function(){
            this.__disposeTemplate();
        },

        $rebindTemplate:function(){
            this.__rebindTemplate();
        },

        $renderTemplate:function(opts,callback){
            opts.parse=false;
            this.__renderTemplate(opts,callback);
        },

        $rebind:function(){
            if(!this._data.get('_watched')){
                var template=this._data.get('templateNode');
                this.__unbindPathObservers();
                this.__databind(template,undefined,true);
                this.__reconnect();
            }
        }
    });

    return $;

}));




/*
 * =============================================================
 * elliptical component
 * =============================================================
 *
 * elliptical component: the elliptical UI factory
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-template'),require('elliptical-pubsub'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-template','elliptical-pubsub'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function () {
    var utils= $.elliptical.utils;
    var _=utils._;




    /**
     * define $.elliptical.component...$.elliptical.component will the base Object used by $.component
     */

    $.element('elliptical.component','ui-component',$.elliptical.template,{

        options:{
            context:null, //$$.elliptical.context
            scope:null  //prop of context to bind
        },

        /**
         * $.component setup on $.element's init event
         * @private
         */
        _initElement:function(){
            this._super();
            this._beforeInitComponent();
            this._initComponentElement();
        },

        _beforeInitComponent: $.noop,

        _initComponentElement:function(){
            var context=this.options.context;
            if(!context){
                context=window.$$.elliptical.context;
                if(context){
                    this.options.context=context;
                }
            }

            this._data.set('hasObserve',$.elliptical.hasObjectObserve);
            this.$viewBag=context;
            this.__setScope();
            this._initComponent();
            this.__subscriber();
            this.__publisher();
        },

        /**
         * if a scope property has been declared, auto set the instance $scope; if a scope
         * property has not been declared, it is up the dev to set the $scope in the _initComponent event
         * @private
         */
        __setScope: function(){
            var context=this.options.context,//context attached to $$.elliptical.context
                scopeProp=this.options.scope; //context property to bind to the instance $scope

            if(this.$scope && scopeProp && context){
                this.$scope[scopeProp]=context[scopeProp];
            }

        },

        /**
         * $.component init event
         */
        _initComponent: $.noop,


        /**
         * sets up pre-defined subscribe events on a defined channel
         * @private
         */
        __subscriber:function(){
            var self=this;
            var channel=this.options.channel;
            var event=this.options.event;
            this._data.set('_synced',false);
            if(channel){
                if(event==='sync'){
                    this._subscribe(channel +'.sync',function(data){
                        if(!self._data.get('_synced')){
                            self._data.set('_synced',true);
                            self.__disposeTemplate();
                            self.__destroyObservable();
                            self.$scope=data.$scope;
                            self.__setObservable();
                            self.__rebindTemplate();
                            self.__onSyncSubscribe(data.proto);
                        }

                    });
                }
            }
        },

        /**
         * if a channel has been declared, publish the $scope to channel.sync
         * this allows different $.components and custom elements to share the same $scope
         * @private
         */
        __publisher:function(){
            var channel=this.options.channel;
            var event =this.options.event;
            var self=this;
            if(channel && !event){
                if(this._data.get('scopeObserver')){
                    this._publish(channel + '.sync',{proto:this,$scope:this.$scope});
                }else{
                    var timeoutId=setInterval(function(){
                        if(self._data.get('scopeObserver')){
                            clearInterval(timeoutId);
                            self._publish(channel + '.sync',{proto:self,$scope:self.$scope});
                        }
                    },500);
                }
            }
        },



        /**
         * publishes events to the declared channel and then executes this_super()
         * to fire parent __onScopeChange handler
         * @param result
         * @private
         */
        __onScopeChange:function(result){

            this.__$scopePropsChange(result);
            this._super(result);

        },

        /**
         * shortcut for returning the changed $scope object props
         * useful for model objects, but not model lists
         * @param result {Array}
         * @private
         */
        __$scopePropsChange: function(result){
            var changed_=this._objectChange;
            var hasObserve=this._data.get('hasObserve');
            var propsChange=this._$scopePropsChange.bind(this);
            if(result.changed && result.changed.length){
                result.changed.forEach(function(obj){
                    var changed={};
                    if(hasObserve){
                        changed[obj.name]=obj.value;
                    }else{
                        changed=changed_(obj);
                    }
                    propsChange(changed);
                });
            }
        },

        _$scopePropsChange: $.noop,

        /**
         * returns the elliptical viewBag
         * @returns {*}
         * @private
         */
        _viewBag:function(){
            return $$.elliptical.context;
        },


        /**
         * component handler for channel.sync subscription
         * @param data {Object}
         * @component
         */
        __onSyncSubscribe: function(data){
            this._onSyncSubscribe(data);
        },

        /**
         * handler for channel.sync, subscription
         * @param data {Object}
         * @private
         */
        _onSyncSubscribe: $.noop,



        /**
         * returns the scope property of the ViewBag context(options.context)
         * @returns {Object}
         * @private
         */
        _scopedContextModel:function(){
            var context=this.options.context,
                scopeProp=this.options.scope;

            return (scopeProp && context) ? context[scopeProp] : undefined;
        },


        _dispose: $.noop,

        scope:function(){
            return this.$scope;
        },

        runInit:function(){
            this._initComponent();
        }

    });


    /**
     * define the factory
     * @param ElementProto {Object} <optional>, only should be supplied if the element not derived from HTMLElement
     * @param name {String}
     * @param tagName {String} <optional>
     * @param base {Object} <optional>
     * @param prototype {Object}
     */
    $.component= $.elementFactory($.elliptical.component);

    /* copy props of element to component */
    for(var key in $.element){
        $.component[key]= $.element[key];
    }

    /**
     * getter/setter for scope id prop
     * @type {Object}
     */
    $.component.config={
        scope:Object.defineProperties({},{
            'id':{
                get:function(){
                    return $.Widget.prototype.options.idProp;
                },
                set:function(val){
                    $.Widget.prototype.options.idProp=val;
                }
            }
        })
    };



    return $;

}));








