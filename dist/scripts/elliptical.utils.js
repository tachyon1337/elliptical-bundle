
/*
 * =============================================================
 * elliptical.utils
 * =============================================================
 *
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('lodash'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['lodash'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical=root.elliptical || {};
        root.elliptical.utils = factory(_);
        root.returnExports = root.elliptical.utils;
    }
}(this, function (_) {
    return {
        /* assign lodash to elliptical.utils._ */
        _:_,


        /**
         * Turns any object in an array.
         * @param array {Array}
         * @param results {Array} optional
         * @returns {Array} a new array or results
         */
        makeArray: function(array, results)
        {
            var ret = results || [];

            if (array != null)
            {
                var type = typeof array;
                if (array.length == null || type === "string" || type === "function"
                    || type === "regexp")
                {
                    ret.push(array);
                } else
                {
                    _.merge(ret, array);
                }
            }

            return ret;
        },

        concatArgs: function(arr, args){
            return this.makeArray(arr).concat(this.makeArray(args));
        },

        mergeArrays: function (array) {
            var a = array.concat();
            for (var i = 0; i < a.length; ++i) {
                for (var j = i + 1; j < a.length; ++j) {
                    if (a[i] === a[j])
                        a.splice(j--, 1);
                }
            }

            return a;
        },

        cloneArray:function(arr){
            return arr.slice(0);
        },

        extend: function()
        {
            // copy reference to target object
            var target = arguments[0] ||
                {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

            // Handle a deep copy situation
            if (typeof target === "boolean")
            {
                deep = target;
                target = arguments[1] ||
                    {};
                // skip the boolean and the target
                i = 2;
            }

            // Handle case when target is a string or something (possible in deep copy)
            if (typeof target !== "object" && !typeof target === 'function')
            {
                target =
                {};
            }

            for (; i < length; i++)
            {
                // Only deal with non-null/undefined values
                if ((options = arguments[i]) !== null)
                {
                    // Extend the base object
                    for (name in options)
                    {
                        src = target[name];
                        copy = options[name];

                        // Prevent never-ending loop
                        if (target === copy)
                        {
                            continue;
                        }

                        // Recurse if we're merging object literal values or arrays
                        if (deep && copy && (isPlainObject(copy) || isArray(copy)))
                        {
                            var clone = src && (isPlainObject(src) || isArray(src)) ? src
                                : isArray(copy) ? [] :
                            {};

                            // Never move original objects, clone them
                            target[name] = extend(deep, clone, copy);

                            // Don't bring in undefined values
                        } else if (typeof copy !== "undefined")
                        {
                            target[name] = copy;
                        }
                    }
                }
            }

            // Return the modified object
            return target;
        },

        /**
         * monkey patch browsers(IE) that do not support Function.name
         *
         */
        patchFunctionName:function(){
            if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
                Object.defineProperty(Function.prototype, 'name', {
                    get: function() {
                        var funcNameRegex = /function\s([^(]{1,})\(/;
                        var results = (funcNameRegex).exec((this).toString());
                        return (results && results.length > 1) ? results[1].trim() : "";
                    },
                    set: function(value) {}
                });
            }
        },



        /**
         * remove of an array of items from an array
         * @param arr1 {Array}
         * @param arr2 {Array}
         * @returns {Array}
         */
        removeFromArray: function (arr1, arr2) {

            for (var i = 0; i < arr1.length; i++) {
                if (this.inArray(arr2, arr1[i])) {
                    arr1.splice(i, 1);
                }
            }

            return arr1;
        },

        /**
         * empty an array
         * @param arr {Array}
         */
        emptyArray:function(arr){
            arr.splice(0,arr.length);
        },

        /**
         * is empty object or string
         * @param {*} obj
         * @returns {boolean}
         */
        emptyObject:function(obj){
            if(typeof obj==='object'){
                return (Object.keys(obj).length === 0);
            }else if(typeof obj==='string'){
                return (obj.length===0);
            }else{
                return false;
            }
        },

        /**
         *
         * @returns {*}
         */
        toQueryable:function(obj){
            if(typeof obj!=='object'){
                return obj;
            }
            var qry={};
            for(var key in obj){
                if(obj.hasOwnProperty(key)){
                    if(key.indexOf('$')!==0){
                        qry[key]=obj[key];
                    }
                }
            }
            return qry;
        },


        isValidArrayIndex: function(val){
            return /^[0-9]+$/.test(String(val));
        },


        /**
         * generate a guid string
         * @returns {string}
         */
        guid: function () {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            };
            return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
        },

        /**
         * generate a random string of length
         * @param length
         * @returns {string}
         */
        randomString: function (length) {
            var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
            return result;
        },

        /**
         * generate a random id string of 16 numbers
         * @returns {string}
         */
        idString: function () {
            var length=16;
            var chars = '0123456789';
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
            return result;
        },

        /**
         * returns an empty guid string
         * @returns {string}
         */
        emptyGuid: function(){
            return '00000000-0000-0000-0000-000000000000';
        },

        isEmptyGuid:function(g){
            var test=this.emptyGuid();
            return (g===test);
        },


        /**
         * tests for window to determine if browser environment
         * @returns {boolean}
         */
        isBrowser: function(){
            return typeof window != 'undefined';
        },

        isIPAddress:function(ip){
            return (/^(\d\d?)|(1\d\d)|(0\d\d)|(2[0-4]\d)|(2[0-5])\.(\d\d?)|(1\d\d)|(0\d\d)|(2[0-4]\d)|(2[0-5])\.(\d\d?)|(1\d\d)|(0\d\d)|(2[0-4]\d)|(2[0-5])$/.test(ip));
        },

        isLocalHost:function(host){
            host=host.toLowerCase();
            if(host==='localhost'){
                return true
            }else if(host.indexOf('127.0.0.1')> -1){
                return true;
            }else {
                if(this.isIPAddress(host)){
                    return (isLocalBlock(host));
                }else{
                    return false;
                }
            }

            function isLocalBlock(ip){
                var x = ip.split("."), x1, x2, x3, x4;
                if (x.length == 4) {
                    x1 = parseInt(x[0], 10);
                    x2 = parseInt(x[1], 10);
                    x3 = parseInt(x[2], 10);
                    x4 = parseInt(x[3], 10);

                    return ((x1===10) || (x1===172 && x2===16) || (x1===192) && (x2===168));
                }
                return false;
            }
        },

        //{month:'Jan',usage:100},{month:'Jan',usage:145}, {usage:'prevYearUsage'}==>{month:'Jan',usage:100,prevYearUsage:145}
        extendObjProp:function(a,b,propMap){
            for (var key in b) {
                if(b.hasOwnProperty(key) && propMap.hasOwnProperty(key)){
                    a[propMap[key]]=b[key];
                }
            }
            return a;
        },

        /*
         a=[{month:'Jan',usage:100}...{month:'Dec',usage:175}]
         b=[{month:'Jan',usage:90}...{month:'Dec',usage:165}]
         propMap={usage:'prevYearUsage'}
         ===>[{month:'Jan',usage:100,prevYearUsage:90},{month:'Dec',usage:175,prevYearUsage:165}]
         */
        mergeObjArraysProp:function(a,b,propMap){
            var arr=[];
            if(_.isArray(a) && _.isArray(b) && a.length=== b.length){
                for(var i=0;i< a.length;i++){
                    arr.push(this.extendObjProp(a[i],b[i],propMap));
                }
                return arr;

            }else{
                return arr;
            }
        },

        /**
         * returns a crrent date string
         * @returns {string}
         */
        currentDate:function(){
            var obj=this.currentDateObj();
            return (obj.month + '/' + obj.day + '/' + obj.year);
        },

        encodeURISection:function(url,index){
            if(this.strFirstChar(url)==='/'){
                url=this.trimFirstChar(url);
            }
            var arr=url.split('/');
            var section=arr[index];
            section=encodeURIComponent(section);
            var length=arr.length;
            var url_='';
            for(var i=0;i<length;i++){
                url_+=(i===index) ? '/' + section : '/' + arr[i];
            }

            return url_;
        },

        /**
         * return an object representing current date
         * @returns {{day: number, month: number, year: number}}
         */
        currentDateObj:function(){

            var currentDate = new Date();
            var day = currentDate.getDate();
            var month = currentDate.getMonth() + 1;
            var year = currentDate.getFullYear();
            return{
                day:day,
                month:month,
                year:year
            };
        },

        /**
         * get first char of string
         * @param s {String}
         * @returns {string}
         */
        strFirstChar:function(s){
            return s.charAt(0);
        },

        /**
         * get last char of string
         * @param s {String}
         * @returns {String}
         */
        strLastChar:function(s){
            return s.slice(-1);

        },

        /**
         * returns first n chars of string
         * @param s {String}
         * @param n {Number}
         * @returns {string}
         */
        strFirstNChars:function(s,n){
            return s.substr(0,n);
        },

        /**
         * returns last n chars of string
         * @param s {String}
         * @param n{Number}
         * @returns {string}
         */
        strLastNChars:function(s,n){
            return s.substr(s.length - n);
        },

        /**
         * trim first chr from string
         * @param s {String}
         * @returns {String}
         */
        trimFirstChar:function(s){
            return s.substring(1);
        },

        /**
         * trim last chr from string
         * @param s {String}
         * @returns {String}
         */
        trimLastChar:function(s){
            return s.substring(0, s.length-1);
        },

        trimLastNChars:function(s,n){
            return s.substring(0, s.length-n);
        },

        ellipsisTrim:function(s,maxLength){
            var ret=s;
            if (ret.length > maxLength) {
                ret = ret.substr(0,maxLength-4) + " ...";
            }
            return ret;
        },

        /**
         * replaces a string with another string at index
         *
         * @param string {String}
         * @param index {Number}
         * @param replaceStr {String}
         * @returns {string}
         */
        stringReplaceAt: function(string,index, replaceStr) {
            return string.substr(0, index) + replaceStr + string.substr(index+replaceStr.length);
        },

        /**
         * inserts a string value at specified index in a string
         * @param string {String}
         * @param index {Number}
         * @param insertStr {String}
         * @returns {string}
         */
        stringInsertAt:function(string,index,insertStr){
            return string.substr(0, index) + insertStr + string.substr(index);
        },

        /**
         * validates type to be numeric
         * @param n {Object}
         * @returns {boolean}
         */
        isNumeric: function(n){
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        /**
         * converts a dash delimited string to a camelCase string
         *
         * @param s {String}
         * @returns {String}
         */
        dashToCamelCase:function(s){
            return s.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
        },

        camelCaseToDash:function(s){
            return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        },

        /**
         * camel case to space separated
         * @param s {String}
         * @returns {String}
         */
        camelCaseToSpace:function(s){
            var rex = /([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g;
            return s.replace( rex, '$1$4 $2$3$5' );
        },

        camelCaseToSpacedTitleCase: function (s) {
            var rex = /([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g;
            var ret = s.replace(rex, '$1$4 $2$3$5');
            return this.toTitleCase(ret);
        },

        /**
         * camel case input string
         * @param s
         * @returns {String}
         */
        toCamelCase:function(s){
            return s
                .replace(/\s(.)/g, function ($1) { return $1.toUpperCase(); })
                .replace(/\s/g, '')
                .replace(/^(.)/, function ($1) { return $1.toLowerCase(); });

        },

        toTitleCase:function(s){
            return s.charAt(0).toUpperCase() + s.slice(1);
        },

        /**
         * converts a space delimited string to a dash delimited string
         *
         * @param s {String}
         * @returns {String}
         */
        spaceToDash:function(s){
            return s.replace(/\s+/g, '-').toLowerCase();
        },

        /**
         * validates if the value of an object prop is an array
         *
         * @param obj {Object}
         * @param prop {String}
         * @returns {boolean}
         */
        isPropertyArray:function(obj,prop){
            return !!((_.isArray(obj[prop])));
        },

        /**
         * is object/value in array
         * @param arr {Array}
         * @param obj {Object}
         * @returns {Boolean}
         */
        inArray:function(arr,obj){
            return  _.find(arr,function(o){
                return _.isEqual(o,obj);
            })
        },




        /**
         * validates if the value of an object prop by index is an array
         *
         *
         * @param obj {Object}
         * @param index {Number}
         * @returns {boolean}
         */
        isPropertyByIndexArray:function(obj,index){
            try{
                var o=obj[Object.keys(obj)[index]];
                return !!((_.isArray(o)));
            }catch(ex){
                return false;
            }

        },

        /**
         * gets the value of an object prop by index
         *
         *
         * @param obj {Object}
         * @param index {Number}
         * @returns value
         */
        objectPropertyByIndex:function(obj,index){
            return obj[Object.keys(obj)[index]];
        },

        isPropertyArrayByPath:function(obj,path){
            var prop=this.objectPropertyByPath(obj,path);
            return !!((_.isArray(prop)));

        },

        /**
         * converts a delimited path into an array of props
         * 'items.0.FirstName' --> [items,0,FirstName]
         *
         * @param path {String}
         * @param separator {String}
         * @returns {Array}
         */
        splitPath:function(path,separator){
            if (typeof separator == 'undefined') {
                separator = '.';
            }
            if ((typeof path ==='undefined') || path === '') {
                return [];
            } else {
                if (_.isArray(path)) {
                    return path.slice(0);
                } else {
                    return path.toString().split(separator);
                }
            }
        },

        /**
         * resolves the value of an object path
         * obj, 'items.0.FirstName'  --> 'John','FirstName'
         * returns an array of value,prop
         *
         * @param a {Object}
         * @param path {String}
         * @param options {Object}
         * @returns {Array}
         */
        resolvePath: function(a, path, options){
            var e, k, last, stack;
            if (options == null) {
                options = {};
            }
            stack = this.splitPath(path);
            last = [stack.pop()];
            e = a;
            while ((k = stack.shift()) !== void 0) {
                if (e[k] !== void 0) {
                    e = e[k];
                } else {
                    stack.unshift(k);
                    break;
                }
            }
            if (options.force) {
                while ((k = stack.shift()) !== void 0) {
                    if ((typeof stack[0] === 'number') || ((stack.length === 0) && (typeof last[0] === 'number'))) {
                        e[k] = [];
                    } else {
                        e[k] = {};
                    }
                    e = e[k];
                }
            } else {
                while ((k = stack.pop()) !== void 0) {
                    last.unshift(k);
                }
            }
            return [e, last];
        },

        /**
         * resolves the value of an object path
         * obj, 'items.0.FirstName'  --> 'John'
         *
         * @param obj {Object}
         * @param path {String}
         * @returns value
         */
        objectPropertyByPath: function(obj,path){
            try{
                var pathArray=this.splitPath(path);
                var a=obj;
                pathArray.forEach(function(p){
                    var b=a[p];
                    a=b;
                });
                return a;
            }catch(ex){
                return undefined;
            }

        },

        /**
         * returns the index of an element with idProp==id in an array
         * @param obj {Object}
         * @param id {String}
         * @param idProp {String}
         * @returns {Number}
         */
        objectIndexById:function(obj,id,idProp){
            if(idProp===undefined){
                idProp='id';
            }
            var arr=this.objectPropertyByIndex(obj,0);
            if(arr.length && arr.length > 0){
                var len=arr.length;
                var index;
                for(var i=0;i<len;i++){
                    if(arr[i][idProp]===id){
                        index=i;
                        break;
                    }
                }
                return index;
            }else{
                return undefined;
            }
        },

        assignValueToPath:function(obj,path,value){
            try{
                var pathArray=this.splitPath(path);
                var a=obj;
                var len=pathArray.length;
                var max=len-1;
                for(var i=0;i<len;i++){
                    if(i===max){
                        a[pathArray[i]]=value;
                    } else{
                        var b=a[pathArray[i]];
                        a=b;
                    }
                }
            }catch(ex){

            }
        },

        /**
         * return the length of an array property of an object by path
         * @param obj {Object}
         * @param path {String}
         * @returns {Number}
         */
        arrayPropertyLengthByPath:function(obj,path){
            //console.log(path);
            var prop=this.objectPropertyByPath(obj,path);
            return (prop && _.isArray(prop)) ? prop.length : null;

        },

        /**
         * returns the index of the path
         * @param path {String}
         * @returns {Number}
         */
        getIndexFromPath:function(path){
            if(path !==undefined){
                var parts=path.split('.');
                var length;
                if(parts.length){
                    length=parts.length;
                    length--;
                    return parts[length];

                }else{
                    return undefined;
                }
            }else{
                return undefined;
            }

        },

        /**
         * is path part of an array
         * @param path {String}
         * @returns {Boolean}
         */
        isPathInArray:function(path){
            var index=this.getIndexFromPath(path);
            return (index !== undefined) ? this.isNumeric(index) : undefined;
        },


        /**
         * converts an array(of contexts and indices) and a property into a path string
         * [{index:5,context:User},{index:0,context:Address}],City ---> User.5.Address.0.City
         * @param arr {Array}
         * @param prop {String}
         * @returns {String}
         */
        createPath: function(arr,prop){
            var path='';
            if(arr && arr.length){
                arr.forEach(function(obj){
                    path+=obj.context + '.' + obj.modelIndex + '.';
                });

                (typeof prop !=='undefined') ? path+=prop : path=path.substring(0, path.length - 1);
                return path;
            }
        },

        /**
         * converts an array of object properties into a path
         * @param arr {Array}
         * @returns {String} path
         */
        createPathFromArray:function(arr){
            var path='';
            if(arr && arr.length){
                var index=0;
                arr.forEach(function(obj){
                    path+=(index < arr.length -1) ? obj + '.' : obj;
                    index++;
                });
                return path;
            }
        },

        /**
         * deletes an obj prop by path
         * @param obj {Object}
         * @param path {String}
         */
        deleteObjectPropertyByPath: function(obj,path){
            var pathArray=this.splitPath(path);
            var a=obj;
            var len=pathArray.length;
            var max=len-1;
            for(var i=0;i<len;i++){
                if(i===max){
                    delete a[pathArray[i]];
                } else{
                    var b=a[pathArray[i]];
                    a=b;
                }
            }
        },

        /**
         * tests if a prop is the last node in a path
         * @param path {String}
         * @param prop {String}
         * @returns {boolean}
         */
        isPathProperty: function(path,prop){
            var splitPath=this.splitPath(path);
            var prop_=splitPath.pop();
            return ((prop_=== prop));
        },

        /**
         * deletes an object from a $scope model list by id value
         * @param obj {Object}
         * @param idProp {String}
         * @param id {String|Value}
         * @returns {Number} the index of the deleted object
         */
        deleteObjectByIdFromArrayProp: function(obj,idProp,id){
            var index=null;
            if(!this.isPropertyByIndexArray(obj,0)){
                return index;
            }
            var arr=obj[Object.keys(obj)[0]];
            for(var i=0;i<arr.length;i++){
                if(arr[i][idProp].toString()===id.toString()){
                    arr.splice(i,1);
                    index=i;
                    break;
                }
            }

            return index;
        },


        /**
         * finds an object in a $scope model list by id
         * @param obj {Object}
         * @param idProp {String}
         * @param id {String|Value}
         * @returns {*}
         */
        selectObjectByIdFromArrayProp: function(obj,idProp,id){
            var obj_;
            var index=null;
            if(!this.isPropertyByIndexArray(obj,0)){
                return index;
            }
            var arr=obj[Object.keys(obj)[0]];
            for(var i=0;i<arr.length;i++){
                if(arr[i][idProp].toString()===id.toString()){
                    obj_=arr[i];
                    break;
                }
            }

            return obj_;

        },

        /**
         * finds an object in an array by id
         * @param arr {Array}
         * @param id {String}|{Number}
         * @param propId {String}
         * @returns {Object}
         */
        findById: function(arr,id,propId){
            if(typeof propId==='undefined'){
                propId='id';
            }
            return _.find(arr, function(obj) {
                return obj[propId]===id;
            });

        },

        /**
         * inserts an index into a model list path(at path index=1)
         * @param path {String}
         * @param index {Number}
         * @returns {String}
         */
        replaceIndexInPath: function(path,index){
            var arr=this.splitPath(path);
            arr[1]=index;
            return arr.join('.');

        },

        observerMapPath:function(path){
            var arr=this.splitPath(path);
            var num=this.isNumeric;
            if(arr && arr.length){
                var mapped= _.map(arr,function(v){
                    return (num(v)) ? '['+ v.toString() + ']' : v;
                });

                return mapped.join('.').replace(/.\[/,'[');

            }else{
                return path;
            }
        },



        /**
         * returns the changes between two objects as properties on the returned object
         * ex: n={FirstName:'John',LastName:'Smith'},o={FirstName:'Bob',LastName:'Smith'} ===> {FirstName:'John'}
         * @param n {Object}
         * @param o {Object}
         * @returns {Object}
         */
        objChangedProps:function(n,o){
            var obj={};
            var keys= _.keys(n);
            keys.forEach(function(v){
                if(!_.isEqual(n[v],o[v])){
                    obj[v]=n[v];
                }
            });
            return obj;
        },

        parseCurrency:function(v){
            if(typeof v==='string'){
                v= v.replace('$','');
                v= v.replace(/,/g,'');
                v=parseFloat(v);
            }
            return v;
        },

        extendedAmount: function(v,q){
            if(typeof v==='string'){
                v= v.replace('$','');
                v=parseFloat(v);
            }
            return this.formatCurrency(v*q);
        },

        formatCurrency:function(value){
            value=parseFloat(value);
            return value.toFixed(2);

        },


        extFormatCurrency:function(m,v,symbolPrefix){

            if(typeof m==='number' || typeof m==='string' && (arguments.length===1 || typeof v==='boolean')){
                v=m;
                v=parseFloat(v);
                m='#,##0.00';
            }
            if(typeof symbolPrefix==='undefined'){
                symbolPrefix=false;
            }


            //convert any string to number according to formation sign.
            var v = m.charAt(0) == '-'? -v: +v;
            var isNegative = v<0? v= -v: 0; //process only abs(), and turn on flag.

            //search for separator for grp & decimal, anything not digit, not +/- sign, not #.
            var result = m.match(/[^\d\-\+#]/g);
            var Decimal = (result && result[result.length-1]) || '.'; //treat the right most symbol as decimal
            var Group = (result && result[1] && result[0]) || ',';  //treat the left most symbol as group separator

            //split the decimal for the format string if any.
            var m = m.split( Decimal);
            //Fix the decimal first, toFixed will auto fill trailing zero.
            v = v.toFixed( m[1] && m[1].length);
            v = +(v) + ''; //convert number to string to trim off *all* trailing decimal zero(es)

            //fill back any trailing zero according to format
            var pos_trail_zero = m[1] && m[1].lastIndexOf('0'); //look for last zero in format
            var part = v.split('.');
            //integer will get !part[1]
            if (!part[1] || part[1] && part[1].length <= pos_trail_zero) {
                v = (+v).toFixed( pos_trail_zero+1);
            }
            var szSep = m[0].split( Group); //look for separator
            m[0] = szSep.join(''); //join back without separator for counting the pos of any leading 0.

            var pos_lead_zero = m[0] && m[0].indexOf('0');
            if (pos_lead_zero > -1 ) {
                while (part[0].length < (m[0].length - pos_lead_zero)) {
                    part[0] = '0' + part[0];
                }
            }
            else if (+part[0] == 0){
                part[0] = '';
            }

            v = v.split('.');
            v[0] = part[0];

            //process the first group separator from decimal (.) only, the rest ignore.
            //get the length of the last slice of split result.
            var pos_separator = ( szSep[1] && szSep[ szSep.length-1].length);
            if (pos_separator) {
                var integer = v[0];
                var str = '';
                var offset = integer.length % pos_separator;
                for (var i=0, l=integer.length; i<l; i++) {

                    str += integer.charAt(i); //ie6 only support charAt for sz.
                    //-pos_separator so that won't trail separator on full length
                    if (!((i-offset+1)%pos_separator) && i<l-pos_separator ) {
                        str += Group;
                    }
                }
                v[0] = str;
            }

            v[1] = (m[1] && v[1])? Decimal+v[1] : "";
            var curr=(isNegative?'-':'') + v[0] + v[1]; //put back any negation and combine integer and fraction.
            return (symbolPrefix)? '$' + curr : curr;
        },

        validateCreditCard:function(cardnumber, cardname){
            var ccErrorNo = 0;
            var ccErrors = new Array()

            ccErrors[0] = "Unknown card type";
            ccErrors[1] = "No card number provided";
            ccErrors[2] = "Credit card number is in invalid format";
            ccErrors[3] = "Credit card number is invalid";
            ccErrors[4] = "Credit card number has an inappropriate number of digits";
            ccErrors[5] = "Warning! This credit card number is associated with a scam attempt";

            if (cardname.toLowerCase() === 'paypal') {
                return true;
            }
            // Array to hold the permitted card characteristics
            var cards = new Array();

            // Define the cards we support. You may add addtional card types as follows.

            //  Name:         As in the selection box of the form - must be same as user's
            //  Length:       List of possible valid lengths of the card number for the card
            //  prefixes:     List of possible prefixes for the card
            //  checkdigit:   Boolean to say whether there is a check digit

            cards[0] = {
                name: "Visa",
                length: "13,16",
                prefixes: "4",
                checkdigit: true
            };
            cards[1] = {
                name: "MasterCard",
                length: "16",
                prefixes: "51,52,53,54,55",
                checkdigit: true
            };
            cards[2] = {
                name: "DinersClub",
                length: "14,16",
                prefixes: "36,38,54,55",
                checkdigit: true
            };
            cards[3] = {
                name: "CarteBlanche",
                length: "14",
                prefixes: "300,301,302,303,304,305",
                checkdigit: true
            };
            cards[4] = {
                name: "AmEx",
                length: "15",
                prefixes: "34,37",
                checkdigit: true
            };
            cards[5] = {
                name: "Discover",
                length: "16",
                prefixes: "6011,622,64,65",
                checkdigit: true
            };
            cards[6] = {
                name: "JCB",
                length: "16",
                prefixes: "35",
                checkdigit: true
            };
            cards[7] = {
                name: "enRoute",
                length: "15",
                prefixes: "2014,2149",
                checkdigit: true
            };
            cards[8] = {
                name: "Solo",
                length: "16,18,19",
                prefixes: "6334,6767",
                checkdigit: true
            };
            cards[9] = {
                name: "Switch",
                length: "16,18,19",
                prefixes: "4903,4905,4911,4936,564182,633110,6333,6759",
                checkdigit: true
            };
            cards[10] = {
                name: "Maestro",
                length: "12,13,14,15,16,18,19",
                prefixes: "5018,5020,5038,6304,6759,6761,6762,6763",
                checkdigit: true
            };
            cards[11] = {
                name: "VisaElectron",
                length: "16",
                prefixes: "4026,417500,4508,4844,4913,4917",
                checkdigit: true
            };
            cards[12] = {
                name: "LaserCard",
                length: "16,17,18,19",
                prefixes: "6304,6706,6771,6709",
                checkdigit: true
            };

            // Establish card type
            var cardType = -1;
            for (var i = 0; i < cards.length; i++) {

                // See if it is this card (ignoring the case of the string)
                if (cardname.toLowerCase() == cards[i].name.toLowerCase()) {
                    cardType = i;
                    break;
                }
            }

            // If card type not found, report an error
            if (cardType == -1) {
                ccErrorNo = 0;
                return false;
            }

            // Ensure that the user has provided a credit card number
            if (cardnumber.length == 0) {
                ccErrorNo = 1;
                return false;
            }

            // Now remove any spaces from the credit card number
            cardnumber = cardnumber.replace(/\s/g, "");

            // Check that the number is numeric
            var cardNo = cardnumber
            var cardexp = /^[0-9]{13,19}$/;
            if (!cardexp.exec(cardNo)) {
                ccErrorNo = 2;
                return false;
            }

            // Now check the modulus 10 check digit - if required
            if (cards[cardType].checkdigit) {
                var checksum = 0;                                  // running checksum total
                var mychar = "";                                   // next char to process
                var j = 1;                                         // takes value of 1 or 2

                // Process each digit one by one starting at the right
                var calc;
                for (i = cardNo.length - 1; i >= 0; i--) {

                    // Extract the next digit and multiply by 1 or 2 on alternative digits.
                    calc = Number(cardNo.charAt(i)) * j;

                    // If the result is in two digits add 1 to the checksum total
                    if (calc > 9) {
                        checksum = checksum + 1;
                        calc = calc - 10;
                    }

                    // Add the units element to the checksum total
                    checksum = checksum + calc;

                    // Switch the value of j
                    if (j == 1) { j = 2 } else { j = 1 };
                }

                // All done - if checksum is divisible by 10, it is a valid modulus 10.
                // If not, report an error.
                if (checksum % 10 != 0) {
                    ccErrorNo = 3;
                    return false;
                }
            }

            // Check it's not a spam number
            if (cardNo == '5490997771092064') {
                ccErrorNo = 5;
                return false;
            }

            // The following are the card-specific checks we undertake.
            var LengthValid = false;
            var PrefixValid = false;
            var undefined;

            // We use these for holding the valid lengths and prefixes of a card type
            var prefix = new Array();
            var lengths = new Array();

            // Load an array with the valid prefixes for this card
            prefix = cards[cardType].prefixes.split(",");

            // Now see if any of them match what we have in the card number
            for (i = 0; i < prefix.length; i++) {
                var exp = new RegExp("^" + prefix[i]);
                if (exp.test(cardNo)) PrefixValid = true;
            }

            // If it isn't a valid prefix there's no point at looking at the length
            if (!PrefixValid) {
                ccErrorNo = 3;
                return false;
            }

            // See if the length is valid for this card
            lengths = cards[cardType].length.split(",");
            for (j = 0; j < lengths.length; j++) {
                if (cardNo.length == lengths[j]) LengthValid = true;
            }

            // See if all is OK by seeing if the length was valid. We only check the length if all else was
            // hunky dory.
            if (!LengthValid) {
                ccErrorNo = 4;
                return false;
            };

            // The credit card is in the required format.
            return true;
        },

        changeRecordsResult:function(){
            return {
                added:[],
                changed:[],
                removed:[]
            };
        },

        objectChangeRecord:function(){
            return{
                object:undefined,
                value:undefined,
                oldValue:undefined,
                path:undefined,
                name:undefined,
                root:undefined

            }
        },

        /**
         * returns the changes between two objects as properties on the returned object
         * ex: n={FirstName:'John',LastName:'Smith'},o={FirstName:'Bob',LastName:'Smith'} ===> {FirstName:'John'}
         * @param n {Object}
         * @param o {Object}
         * @returns {Object}
         */
        objectChangedProps:function(n,o){
            var obj={};
            var keys= _.keys(n);
            keys.forEach(function(v){
                if(!_.isEqual(n[v],o[v])){
                    obj[v]=n[v];
                }
            });
            return obj;
        },

        isModelList: function (obj) {
            if (_.isArray(obj)) {
                return obj;
            } else {
                var keys = _.keys(obj).length;
                if (keys > 1) {
                    return null;
                } else {
                    //else if keys <=1, test if prop is an array(model list)
                    var o = obj[Object.keys(obj)[0]];
                    return (_.isArray(o)) ? o : null;
                }
            }

        },

        /**
         * generate an difference summary report between two object states.
         * returns a result object with added,changed,removed array props
         *
         * summary report is intended to handle two object types: (i) model/document (ii) model list
         *
         * (i) a model is where the object represents a singleton document
         *
         * (ii) a model list is an object whose first prop/key is an array; so it acts as an array of documents or document container
         * Each element of the array prop corresponds to a unique document and should have a unique id key
         *
         *
         *
         * @param newObj {Object}
         * @param oldObj {Object}
         * @param id {String} Model id prop
         * @returns {Object}
         */
        objDiffReport: function(newObj,oldObj,id){
            var self=this;
            var newObj_;
            var oldObj_;
            var OBJ_;
            var result=this.changeRecordsResult();

            if(typeof id==='undefined'){
                id='id';
            }


            var _o=isModelList(oldObj);
            (_o) ? modelListSummary(_o) : modelSummary();


            //test for model list; returns the array if true, null if false
            function isModelList(oldObj_) {
                var keys= _.keys(oldObj).length;
                //if keys > 1, model
                if(keys > 1){
                    return null;
                }else{
                    //else if keys <=1, test if prop is an array(model list)
                    var o=oldObj_[Object.keys(oldObj_)[0]];
                    return (_.isArray(o)) ? o : null;
                }

            }


            return result;


            function modelListSummary(_o){
                var _n=newObjModelList();
                if(!_n){
                    result=null;
                    return false;
                }
                difference(_n,_o);
            }

            function modelSummary(){
                if(!_.isEqual(newObj,oldObj)){
                    /*result.changed.push({
                     object:newObj,
                     oldObject:oldObj
                     });*/
                    newObj_=newObj;
                    oldObj_=oldObj;
                    OBJ_=undefined;
                    var chg_=objectChangeRecord(newObj,oldObj,'');
                    result.changed.push(chg_);
                }
            }

            function objectChangeRecord(n,o,path){
                var obj=self.objectChangeRecord();
                var keys= _.keys(n);
                keys.forEach(function(v){
                    if(n && o){
                        if(!_.isEqual(n[v],o[v])){
                            var path_=(path !=='') ? path + '.' + v : v;
                            if(typeof n[v] ==='object' && n[v] !==null){
                                if(!_.isArray(n[v])){
                                    objectChangeRecord(n[v],o[v],path);
                                }else{
                                    var index_=0;
                                    var ov=o[v];
                                    n[v].forEach(function(oo){
                                        if(!_.isEqual(oo,ov[index_])){
                                            path_+='.' + index_;
                                            objectChangeRecord(oo,ov[index_],path_);
                                            index_++;
                                        }else{
                                            index_++;
                                        }
                                    });
                                }
                            }else{
                                obj.object=n;
                                obj.value=n[v];
                                obj.oldValue=o[v];
                                obj.path=path_;
                                obj.name=v;
                                obj.root=newObj_;

                                OBJ_=obj;
                            }
                        }
                    }
                });

                return OBJ_;
            }

            function newObjModelList(){
                var n=newObj[Object.keys(newObj)[0]];
                return (_.isArray(n)) ? n : null;
            }

            function difference(n,o){
                var oIds = {};
                o.forEach(function(obj){
                    oIds[obj[id]] = obj;
                });

                var nIds={};
                n.forEach(function(obj){
                    nIds[obj[id]] = obj;
                });

                var nArr=[],
                    oArr=[],
                    uArr=[];

                // return all elements in n not in o==added
                nArr= n.filter(function(obj){
                    return !(obj[id] in oIds);
                });

                // return all elements in o not in n==removed
                oArr= o.filter(function(obj){
                    return !(obj[id] in nIds);
                });

                //return unequal for common elements==changed
                n.forEach(function(obj){
                    var oo= _.find(o,function(__o){return __o[id]===obj[id]});
                    if( !(_.isEqual(oo,obj) || oo ===undefined) ){
                        /*uArr.push({
                         object:obj,
                         oldObject:oo
                         });*/
                        newObj_=obj;
                        oldObj_=oo;
                        OBJ_=undefined;
                        var chg_=objectChangeRecord(obj,oo,'');
                        uArr.push(chg_);
                    }
                });

                //update result
                result.added=result.added.concat(nArr);
                result.changed=result.changed.concat(uArr);
                result.removed=result.removed.concat(oArr);

            }
        },

        nativeObjDiffReport:function(obj,changeRecords){
            var result=this.changeRecordsResult();
            var self=this;
            var _o=this.isModelList(obj);
            var path_;
            if(changeRecords && changeRecords.length){
                changeRecords.forEach(function(c){
                    if(_o){
                        if(c.addedCount && c.addedCount>0 && c.type==='splice'){
                            result.added.push(c.object[c.index]);
                        }
                        if(c.removed && c.removed.length>0 && c.type==='splice'){
                            result.removed=result.removed.concat(c.removed);
                        }
                        if(c.type==='update'){
                            path_=pathReplace(c.path);
                            var u_={
                                object: c.object,
                                path: path_,
                                value: c.value,
                                oldValue: c.oldValue,
                                name: c.name,
                                root: c.root
                            };
                            result.changed.push(u_);
                        }
                    }else{
                        path_=pathReplace(c.path);
                        var chg_={
                            object: c.object,
                            value:c.object[c.name],
                            oldValue: c.oldValue,
                            path:path_,
                            name: c.name,
                            root: c.root
                        };

                        result.changed.push(chg_);
                    }
                });
            }

            function pathReplace(p){
                var n= p.replace(/\//g,'.');
                if(self.strFirstChar(n)==='.'){
                    n=self.trimFirstChar(n);
                }
                return n;
            }

            return result;
        }
    };


}));



