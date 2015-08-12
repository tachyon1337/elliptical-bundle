
/*
 * =============================================================
 * elliptical.Container
 * =============================================================
 *
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
        root.elliptical = root.elliptical || {};
        root.elliptical.Container=factory(root.elliptical);
        root.returnExports = root.elliptical.Container;
    }
}(this, function () {

    return {
        _registrations:[],

        /**
         * registers a type. if type and provider type are both passed, it also DI provider into type(mapType)
         * minimum of 2 params required
         * @param {string} [name] - if type has a @resource property set as the name and provider is passed
         * @param {object} type - required
         * @param {object} [provider] - optional provider type
         */
        registerType:function(name,type,provider){
            //support 2-3 args
            if(typeof name !=='string'){
                provider=type;
                type=name;
                name=type["@resource"];
                type.$provider=provider;

            }else if(provider!==undefined){
                type.$provider=provider;
            }
            var obj={
                name:name,
                type:type
            };
            this._registrations.push(obj);
        },

        /**
         * returns the registered type associated with the name
         * @param {string} name
         * @returns {object}
         */
        getType:function(name){
            var obj_=null;
            var type=null;
            var types=this._registrations;
            if(types.length && types.length < 1){
                return null;
            }
            types.forEach(function(obj){
                if(obj.name===name){
                    obj_=obj.type;
                }else if(obj.name==='Service'){
                    type=obj.type.extend({},{}); //if generic service Class, extend it so that it each is a separate copy
                    type["@resource"]=name;
                }
            });

            return (obj_) ? obj_ : type;
        },

        /**
         * asynchronously returns the registered type associated with the name
         * @param {string} name - type name
         * @param {function} callback - callback
         */
        getTypeAsync:function(name,callback){
            var MAX_COUNT=10;
            var count=0;
            var self=this;
            var type=this.getType(name);
            if(type){
                callback(type);
            }else{
                var timeoutId=setInterval(function(){
                    type=self.getType(name);
                    if(type){
                        clearInterval(timeoutId);
                        callback(type);
                    }else if(count < MAX_COUNT){
                        count++;
                    }else{
                        clearInterval(timeoutId);
                    }
                },200);
            }
        },

        /**
         *  DI injects a registered provider type into type by the string name of the provider type
         * @param {string} [name] - optional, string name of type
         * @param {object} type - the type
         * @param {string} $name - string name of a registered provider type
         */
        mapType:function(name,type,$name){
            if($name===undefined){
                $name=type;
                type=name;
                name=null;
            }
            var self=this;
            var count=0;
            var MAX_COUNT=6;
            var INTERVAL=400;
            if(!_mapType(type,$name,this)){
                var timeoutId=setInterval(function(){
                    if(_mapType(type,$name,self)){
                        clearInterval(timeoutId);
                    }else{
                        count++;
                        if(count > MAX_COUNT){
                            clearInterval(timeoutId);
                        }
                    }
                },INTERVAL)
            }

            function _mapType(type,$name,context){
                var $providerType=context.getType($name);
                if($providerType){
                    (name) ? context.registerType(name,type,$providerType) : context.registerType(type,$providerType);
                    return $providerType;
                }else{
                    return null;
                }
            }

        }
    }

}));


/*
 * =============================================================
 * elliptical.Class
 * =============================================================
 *
 * Classical inheritance pattern adopted from JavascriptMVC(which is an implementation of the Resig pattern), sans the jQuery dependency.
 * https://github.com/jupiterjs/jquerymx/blob/master/class/class.js
 *
 * var MyClass=Class.extend({},{});
 *
 * examples.:
 *
 * var MyClass=Class.extend({
 *
 * //@static
 *    method1:function(){
 *       return 'method1';
 *    }
 * },{
 *
 * //@prototype
 *    init:function(arg){
 *      this.name=arg;
 *    },
 *
 *    method1: function(){
 *       return this.name;
 *    }
 *
 * });
 *
 * MyClass.method1() //  'method1'
 * var myClassInstance=new MyClass('Bob');
 *
 * myClassInstance instanceof MyClass // true
 * myClassInstance.method1()  // 'Bob'
 *
 * var AnotherClass=Class.extend({  //define only instance props and methods
 *    init:function(arg){
 *        this.name=arg;
 *    },
 *    method1: function(){
 *       return this.name;
 *    }
 * });
 *
 * var anotherClassInstance=new AnotherClass('Fred');
 * anotherClassInstance instanceof AnotherClass // true
 * anotherClassInstance.method1()  // 'Fred'
 *
 * var Class2=Class.extend({
 *      prop1:true
 *      method1:function(){
 *        return 'method1';
 *      }
 * },
 * {
 *    init:function(arg){
 *      this.name=arg;
 *    },
 *
 *    method1: function(){
 *       return this.name;
 *    }
 * });
 *
 * var Class3=Class2.extend({
 *      prop1:false,
 *      prop2:true,
 *      method2:function(){
 *         return 'method2';
 *      }
 *
 * },{
 *     method2: function(){
 *       return this.name + ' from method 2';
 *     }
 * });
 *
 * var myClass3=new Class3('Jane');
 * Class2.prop1 //true
 * Class3.prop1 //false
 * myClass3 instanceof Class2  //true
 * myClass3 instanceof Class3  //true
 *
 * myClass3.method2() // 'Jane from method 2'
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.Class=factory(root.elliptical.utils);
        root.returnExports = root.elliptical.Class;
    }
}(this, function (utils) {
        var _=utils._,
        initializing = false,
        makeArray = utils.makeArray,
        isFunction = _.isFunction,
        isArray = _.isArray,
        extend = utils.extend,
        concatArgs = utils.concatArgs,


    /* tests if we can get super in .toString() */
    fnTest = /xyz/.test(function()
    {
        xyz;
    }) ? /\b_super\b/ : /.*/,


        /**
         * overwrites an object with methods, sets up _super
         * @param newProps {Object}
         * @param oldProps {Object}
         * @param addTo {Object}
         */
        inheritProps = function(newProps, oldProps, addTo)
        {

            addTo = addTo || newProps;
            for ( var name in newProps)
            {
                /* Check if we're overwriting an existing function */
                addTo[name] = isFunction(newProps[name]) && isFunction(oldProps[name])
                    && fnTest.test(newProps[name]) ? (function(name, fn)
                {
                    return function()
                    {
                        var tmp = this._super, ret;

                        /* Add a new ._super() method that is the same method, but on the super-class */
                        this._super = oldProps[name];

                        /* The method only need to be bound temporarily, so we remove it when we're done executing */
                        ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, newProps[name]) : newProps[name];
            }
        };

    var clss =function()
    {
        if (arguments.length)
        {
            clss.extend.apply(clss, arguments);
        }
    };

    /* @Static */
    extend(
        clss,
        {
            /**
             * Returns a callback function for a function on this Class.
             * Proxy ensures that 'this' is set appropriately.
             * @param funcs {Array}
             * @returns {Function} the callback function
             */
            proxy : function(funcs)
            {
                /* args that should be curried */
                var args = makeArray(arguments), self;

                funcs = args.shift();

                if (!isArray(funcs))
                {
                    funcs = [ funcs ];
                }

                self = this;
                for ( var i = 0; i < funcs.length; i++)
                {
                    if (typeof funcs[i] == "string"
                        && !isFunction(this[funcs[i]]))
                    {
                        throw ("class.js "
                            + (this.fullName || this.Class.fullName)
                            + " does not have a " + funcs[i] + "method!");
                    }
                }
                return function class_cb()
                {
                    var cur = concatArgs(args, arguments), isString, length = funcs.length, f = 0, func;
                    for (; f < length; f++)
                    {
                        func = funcs[f];
                        if (!func)
                        {
                            continue;
                        }

                        isString = typeof func == "string";
                        if (isString && self._set_called)
                        {
                            self.called = func;
                        }

                        cur = (isString ? self[func] : func).apply(self, cur
                            || []);
                        if (f < length - 1)
                        {
                            cur = !isArray(cur) || cur._use_call ? [ cur ]
                                : cur;
                        }
                    }
                    return cur;
                };
            },

            /**
             * Creates a new instance of the class.
             * @returns {Class} instance of the class
             */
            newInstance: function() {
                var inst = this.rawInstance(),
                    args;
                /* call setup if there is a setup */
                if ( inst.setup ) {
                    args = inst.setup.apply(inst, arguments);
                }
                /* call init if there is an init, if setup returned args, use those as the arguments */
                if ( inst.init ) {
                    inst.init.apply(inst, isArray(args) ? args : arguments);
                }
                return inst;
            },

            /**
             * Setup gets called on the inherting class with the base class followed by the inheriting class's raw properties.
             * Setup will deeply extend a static defaults property on the base class with properties on the base class.
             * @param baseClass {Object}
             * @param fullName {String}
             * @returns {Arguments}
             */
            setup: function( baseClass, fullName ) {
                this.defaults = extend(true, {}, baseClass.defaults, this.defaults);
                return arguments;
            },

            /**
             * returns the raw instance before application of setup and init
             * @returns {Class}
             */
            rawInstance: function() {
                initializing = true;
                var inst = new this();
                initializing = false;
                return inst;
            },

            /**
             * NOTE: support for namespacing fullName dropped because of its reliance on globals (S.Francis)
             * @param klass {Object}
             * @param proto {Object}
             * @returns {Class}
             */
            extend: function(klass, proto) {
                if(!proto) {
                    proto = klass;
                    klass = null;
                }
                proto = proto || {};
                var _super_class = this,
                    _super = this.prototype, prototype;

                /* Instantiate a base class (but only create the instance, don't run the init constructor */
                initializing = true;
                prototype = new this();
                initializing = false;
                /* Copy the properties over onto the new prototype */
                inheritProps(proto, _super, prototype);

                /* The dummy class constructor */

                function Class() {
                    /* All construction is actually done in the init method */
                    if ( initializing ) return;

                    /* extending */
                    if ( this.constructor !== Class && arguments.length ) {
                        return arguments.callee.extend.apply(arguments.callee, arguments);
                    } else { /* we are being called with new */
                        return this.Class.newInstance.apply(this.Class, arguments);
                    }
                }
                /* copy old stuff onto class */
                for ( name in this ) {
                    if ( this.hasOwnProperty(name) && ['prototype', 'defaults'].indexOf(name) == -1 ) {
                        Class[name] = this[name];
                    }
                }

                /* static inheritance */
                inheritProps(klass, this, Class);

                /* set things that can't be overwritten */
                extend(Class, {
                    prototype: prototype,
                    constructor: Class
                });

                //make sure our prototype looks nice
                Class.prototype.Class = Class.prototype.constructor = Class;

                var args = Class.setup.apply(Class, utils.concatArgs([_super_class],arguments));

                if ( Class.init ) {
                    Class.init.apply(Class, args || []);
                }

                /* @Prototype*/
                return Class;
            }
        });


    clss.callback=clss.prototype.callback=clss.prototype.proxy=clss.proxy;

    return clss;


}));





/*
 * =============================================================
 * elliptical.Controller
 * =============================================================
 *
 * Controller factory for an expressJS style application function/object
 * var Controller = new elliptical.Controller(app,'controllerName');
 *
 * For HTTP Get only
 * Controller('/@action/:id',f1,...fn,{
 *   Action1:function(req,res,next){},
 *   ActionN:function(req,res,next){},
 * });
 *
 * or:
 *   all HTTP methods
 * Controller('/@action/:id',f1,...fn,{
 *   Get:{
 *      Action1:function(req,res,next){},
 *      ActionN:function(req,res,next){},
 *   },
 *   Post:{
 *      Action1:function(req,res,next){},
 *      ActionN:function(req,res,next){},
 *   },
 *   Put:{
 *      Action1:function(req,res,next){},
 *      ActionN:function(req,res,next){},
 *   },
 *   Delete:{
 *      Action1:function(req,res,next){},
 *      ActionN:function(req,res,next){},
 *   },
 * });
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils'], factory);
    } else {
        root.elliptical.Controller = factory(root.elliptical.utils);
        root.returnExports = root.elliptical.Controller;
    }
}(this, function (utils) {


    /* Controller is a factory for the app function.
     * Example:
     * var Controller=new elliptical.Controller(app,'Company');
     * Controller('/@action',{
     *   Get:{
     *      Index:function(req,res,next){},
     *      About:function(req,res,next){},
     *      Contact:function(req,res,next){},
     *   },
     *   Post:{
     *      Contact:function(req,res,next){}
     *   }
     * }
     *
     * instead of app.get('/Company/Home',function(req,res,next){}),app.get('/Company/About',function(req,res,next){})
     *            app.get('/Company/Contact',function(req,res,next){}),app.post('/Company/Contact',function(req,res,next){})
     *
      * */
    var Controller;
    Controller = function (app, name) {
        this.app = app;
        this.name = name;
        /**
         * @param route {String}
         * @param obj {Object}
         * @returns {Function}
         */
        return function (route, obj) {
            var args = [].slice.call(arguments);
            var route_ = args[0];
            if (typeof route_ !== 'string') {
                throw "Controller requires a route string with an '@action' placeholder  as the first parameter";
            }
            var obj_ = args.pop();
            if (typeof obj_ === 'object') {
                if (!(obj_.Get || obj_.Post || obj_.Put || obj_.Delete )) {
                    iterateControllerActions(args, obj_, 'get', app, name);
                } else {
                    ['Get', 'Post', 'Put', 'Delete'].forEach(function (v) {
                        if (obj_[v] && typeof obj_[v] === 'function') {
                            throw "Controller requires an @action param";

                        } else {
                            iterateControllerActions(args, obj_[v], v, app, name);
                        }
                    });
                }

            } else {
                throw 'Controller requires the last function parameter to be an object';
            }
        }
    };

    function iterateControllerActions(args,obj,v,app,name){
        var length;
        for(var prop in obj){
            if(obj.hasOwnProperty(prop)){
                var clonedArgs_=utils.cloneArray(args);
                if (prop === 'Index' && !testIndexProp(clonedArgs_[0])) { //e.g.,: "/Home/Index" =>"/Home", "/Product/Index/1" => "/Product/Index/1"
                    clonedArgs_[0] = clonedArgs_[0].replace(/@action/g, '');
                }else{
                    var prop_=prop.replace(/_/,'-'); //ex: '/Sign-In' ---> Sign_In:fn()
                    clonedArgs_[0]=clonedArgs_[0].replace(/@action/g,prop_);
                }
                length=clonedArgs_[0].length;
                if(name.toLowerCase() !=='home'){
                    clonedArgs_[0] =(length>1) ? '/' + name  + clonedArgs_[0] : '/' + name;
                }
                obj[prop].__name=name;
                obj[prop].__action=prop;
                clonedArgs_.push(obj[prop]);
                app[v.toLowerCase()].apply(app,clonedArgs_);
            }
        }
    }

    function testIndexProp(args) {
        var str = args.split('@action');
        return (str[1] && str[1].length > 1);
    }

    return Controller;
}));

/*
 * =============================================================
 * elliptical.factory
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.factory=factory(root.elliptical.utils);
        root.returnExports = root.elliptical.factory;
    }
}(this, function (utils) {
    var _=utils._;

    var factory;
    factory = {
        partial: function () {
            var args = [].slice.call(arguments);
            return _.partial.apply(this, args);
        },

        partialRight: function () {
            var args = [].slice.call(arguments);
            return _.partialRight.apply(this, args);
        },

        curry: function () {
            var args = [].slice.call(arguments);
            return _.curry.apply(this, args);
        },

        defer: function () {
            var args = [].slice.call(arguments);
            return _.defer.apply(this, args);
        },

        delay: function () {
            var args = [].slice.call(arguments);
            return _.delay.apply(this, args);
        },

        after: function () {
            var args = [].slice.call(arguments);
            return _.after.apply(this, args);
        },

        bind: function () {
            var args = [].slice.call(arguments);
            return _.bind.apply(this, args);
        },

        bindKey: function () {
            var args = [].slice.call(arguments);
            return _.bindKey.apply(this, args);
        },

        bindAll: function () {
            var args = [].slice.call(arguments);
            return _.bindAll.apply(this, args);
        },

        debounce: function () {
            var args = [].slice.call(arguments);
            return _.debounce.apply(this, args);
        },

        throttle: function () {
            var args = [].slice.call(arguments);
            return _.throttle.apply(this, args);
        },


        wrap: function () {
            var args = [].slice.call(arguments);
            return _.wrap.apply(this, args);
        },

        memoize: function () {
            var args = [].slice.call(arguments);
            return _.memoize.apply(this, args);
        }

    };

    return factory;

}));

/*
 * =============================================================
 * elliptical.Model
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('../class/class'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['../class/class'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.Model=factory(root.elliptical.Class);
        root.returnExports = root.elliptical.Model;
    }
}(this, function (Class) {

    var Model;
    Model = Class.extend({
            id: 'id', //{String} set a custom id property other than 'id'
            _data: null, //{Object}
            '@resource': null, //{String}
            $provider: {}, //{Class|Object|Function}
            $paginationProvider: null,//{Class|Object|Function}


            /**
             * @static
             */

            /**
             * get all models by class or get model by id
             * @param params {Object}
             * @param query {Object}
             * @param callback {Function}
             * @public
             */
            get: function (params, query, callback) {
                this.__isImplemented('get');
                if (typeof query === 'function') {
                    callback = query;
                    query = {};
                }
                var self = this,
                    $provider = this.$provider,
                    $paginationProvider = this.$paginationProvider,
                    resource = this['@resource'],
                    result=null;

                $provider.get(params, resource, query, function (err, data) {
                    if (!err) {
                        if (query.paginate && $paginationProvider) {
                            result = $paginationProvider.get(query, data);
                            self._data = result.data;
                        } else {
                            result = data;
                            self._data = data;
                        }
                    }
                    result = self.onGet(result);
                    if (callback) {
                        callback(err, result);
                    }
                });
            },

            onGet:function(data){return data},


            /**
             * query model
             * @param params {Object}
             * @param query {Object}
             * @param callback {Function}
             * @public
             */
            query: function (params, query, callback) {
                this.__isImplemented('query');
                var self = this,
                    $provider = this.$provider,
                    $paginationProvider = this.$paginationProvider,
                    result;

                $provider.query(params, query, function (err, data) {
                    if (!err) {
                        if (query.paginate && $paginationProvider) {
                            result = $paginationProvider.get(query, data);
                            self._data = result.data;
                        } else {
                            result = data;
                            self._data = data;
                        }
                    }
                    if (callback) {
                        callback(err, result);
                    }
                });
            },


            /**
             * post model
             * @param params {Object}
             * @param callback {Function}
             * @public
             */
            post: function (params, callback) {
                this.__isImplemented('post');
                var $provider = this.$provider,
                    resource = this['@resource'];
                $provider.post(params, resource, callback);

            },

            /**
             * put model
             * @param params {Object}
             * @param callback {Function}
             * @public
             */
            put: function (params, callback) {
                var $provider = this.$provider,
                    resource = this['@resource'];
                $provider.put(params, resource, callback);

            },

            /**
             * patch model (~merge)
             * @param params {Object}
             * @param callback
             */
            patch: function (params, callback) {
                this.__isImplemented('patch');
                var $provider = this.$provider,
                    resource = this['@resource'];
                $provider.patch(params, resource, callback);

            },

            /**
             * delete model
             * @param params {Object}
             * @param callback {Function}
             * @public
             */
            delete: function (params, callback) {
                this.__isImplemented('delete');
                var $provider = this.$provider,
                    resource = this['@resource'];
                $provider.delete(params, resource, callback);

            },

            /**
             * command
             * @param params {Object}
             * @param callback {Function}
             * @public
             */
            command: function (params, callback) {
                this.__isImplemented('command');
                var $provider = this.$provider;
                $provider.command(params, callback);
            },

            

            /**
             * sets the model providers for implementation
             * @param $provider {Object}
             * @param $pagination {Object}
             * @public
             */
            $setProviders: function ($provider, $pagination) {
                this.$provider = $provider;
                this.$paginationProvider = $pagination;
            },

            __isImplemented: function (method) {
                try {
                    if (!this.$provider[method]) {
                        throw new Error(method + ' not implemented');
                    }
                } catch (ex) {

                }

            }

        },

        /**
         * @prototype
         */

        {
            _data: null,

            /**
             *
             * @param params {Object}
             * @public
             */
            init: function (params) {
                /* this will get passed up as the params in below methods if params not explicitly passed in the calls */
                this._data = params;
                this.$query = {};
            },

            /**
             * @param params {Object}
             * @param callback {Function}
             * @public
             */
            get: function (params, callback) {
                var data = this._data,
                    query = this.$query;

                (typeof params === 'function') ? callback = params : data = params;
                this.constructor.get(data, query, callback);
            },

            /**
             * @param params {Object}
             * @param callback {Function}
             * @public
             */
            save: function (params, callback) {
                var data = this._data;
                var length = arguments.length;
                if (length === 0) {
                    params = data;
                } else if (length === 1 && typeof params === 'function') {
                    callback = params;
                    params = data;
                }
                var idProp = this.constructor.id;
                if (params === undefined || params[idProp] === undefined) {
                    /* posting a new model */
                    this.constructor.post(params, callback);
                } else {
                    /* put an update */
                    this.constructor.put(params, callback);
                }
            },

            /**
             * @param params {Object}
             * @param callback {Function}
             */
            put: function (params, callback) {
                var data = this._data;
                (typeof params === 'function') ? callback = params : data = params;
                this.constructor.put(data, callback);
            },

            /**
             * @param params {Object}
             * @param callback {Function}
             */
            patch: function (params, callback) {
                var data = this._data;
                (typeof params === 'function') ? callback = params : data = params;
                this.constructor.query(data, callback);
            },

            /**
             * @param params {Object}
             * @param callback {Function}
             * @public
             */
            query: function (params, callback) {
                var data = this._data,
                    query = this.$query;

                (typeof params === 'function') ? callback = params : data = params;
                this.constructor.query(data, query, callback);
            },

            /**
             *
             * @param {object} val
             */
            filter: function (val) {
                if(val && val !==undefined){
                    this.$query.filter = val;
                }
                return this;
            },

            /**
             *
             * @param {object} val
             */
            orderBy: function (val) {
                if(val && val !==undefined){
                    this.$query.orderBy = val;
                }
                this.$query.orderBy = val;
                return this;
            },

            orderByDesc: function (val) {
                if(val && val !==undefined){
                    this.$query.orderByDesc = val;
                }
                return this;
            },

            /**
             *
             * @param {object} val
             */
            top: function (val) {
                if(val && val !==undefined){
                    this.$query.top = val;
                }
                return this;
            },

            /**
             *
             * @param {object} val
             */
            skip: function (val) {
                if(val && val !==undefined){
                    this.$query.skip = val;
                }
                return this;
            },

            /**
             *
             * @param params {Object}
             */
            paginate: function (params) {
                try {
                    params.page = parseInt(params.page);
                } catch (ex) {
                    params.page = 1;
                }
                this.$query.paginate = params;
                return this;
            },

            /**
             * @param params {Object}
             * @param callback  {Function}
             * @public
             */
            delete: function (params, callback) {
                var data = this._data;
                (typeof params === 'function') ? callback = params : data = params;
                this.constructor.delete(data, callback);
            },

            /**
             * @param params {Object}
             * @param callback {Function}
             * @public
             */
            command: function (params, callback) {
                var data = this._data;
                (typeof params === 'function') ? callback = params : data = params;
                this.constructor.command(data, callback);
            }

        });


    return Model;



}));



/*
 * =============================================================
 * elliptical.noop
 * =============================================================
 *
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
        root.elliptical.noop=factory();
        root.returnExports = root.elliptical.noop;
    }
}(this, function () {

    return{
        noop:function(){},
        throwErr:function(err){
            if (err) {
                throw err;
            }
        },
        doop:function(fn,args,context){
            if(typeof fn==='function') {
                return fn.apply(context, args);
            }
        }
    }


}));
/*
 * =============================================================
 * elliptical.debounce
 * =============================================================
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.debounce=factory(root.elliptical.utils);
        root.returnExports = root.elliptical.debounce;
    }
}(this, function (utils) {

    var _=utils._;

    return function debounce(fn,delay,opts){
        if(typeof delay==='undefined'){
            delay=1000;
        }
        if(typeof opts==='undefined'){
            opts={};
        }
        _.debounce(fn,delay,opts);
    }


}));

/*
 * =============================================================
 * elliptical.Interval
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('./debounce'),require('./throttle'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./debounce','./throttle'], factory);
    } else {
        root.elliptical.Interval=factory(root.elliptical.debounce,root.elliptical.throttle);
        root.returnExports = root.elliptical.Interval;
    }
}(this, function (debounce,throttle) {

    return function Interval(opts){
        this.delay=opts.delay;
        this.timeOutId=null;
        if(opts.thread==='throttle'){
            this.thread=throttle;
        }else if(opts.thread==='debounce'){
            this.thread=debounce;
        }else{
            this.thread=_exe;
        }

        this.run=function(fn){
            var self=this;
            this.timeOutId=setInterval(function(){
                self.thread(fn,{
                    delay:10
                });

            },self.delay);
        };

        this.terminate=function(){
            clearInterval(this.timeOutId);
        }
    };


    function _exe(fn,opts){
        fn();
    }

}));


/*
 * =============================================================
 * elliptical.throttle
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.throttle=factory(root.elliptical.utils);
        root.returnExports = root.elliptical.throttle;
    }
}(this, function (utils) {

    var _=utils._;

    return function throttle(fn,delay,opts){
        if(typeof delay==='undefined'){
            delay=1000;
        }
        if(typeof opts==='undefined'){
            opts={};
        }
        _.throttle(fn,delay,opts);
    }


}));

/*
 * =============================================================
 * elliptical.proto
 * =============================================================
 *
 * EcmaScript5 inheritance pattern mostly culled from:
 * https://github.com/daffl/uberproto
 *
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
        root.elliptical.proto=factory();
        root.returnExports = root.elliptical.proto;
    }
}(this, function () {

    var proto;
    proto = {

        /**
         *
         * @returns {Object}
         */
        create: function () {
            var instance = Object.create(this),
                init = typeof instance.__init === 'string' ? instance.__init : 'init';
            if (typeof instance[init] === "function") {
                instance[init].apply(instance, arguments);
            }
            return instance;
        },


        /**
         * Mixin a given set of properties
         * @param prop {Object} The properties to mix in
         * @param obj {Object} [optional] The object to add the mixin
         */
        mixin: function (prop, obj) {
            var self = obj || this,
                fnTest = /\b_super\b/,
                _super = Object.getPrototypeOf(self) || self.prototype,
                _old;

            // Copy the properties over
            for (var name in prop) {
                // store the old function which would be overwritten
                _old = self[name];
                // Check if we're overwriting an existing function
                self[name] = (typeof prop[name] === "function" && typeof _super[name] === "function" && fnTest.test(prop[name])) ||
                (typeof _old === "function" && typeof prop[name] === "function") ? //
                    (function (old, name, fn) {
                        return function () {
                            var tmp = this._super;

                            // Add a new ._super() method that is the same method
                            // but either pointing to the prototype method
                            // or to the overwritten method
                            this._super = (typeof old === 'function') ? old : _super[name];

                            // The method only need to be bound temporarily, so we
                            // remove it when we're done executing
                            var ret = fn.apply(this, arguments);
                            this._super = tmp;

                            return ret;
                        };
                    })(_old, name, prop[name]) : prop[name];
            }

            return self;
        },


        /**
         * Extend the current or a given object with the given property
         * and return the extended object.
         * @param prop {Object} The properties to extend with
         * @param obj {Object} [optional] The object to extend from
         * @returns {Object} The extended object
         */
        extend: function (prop, obj) {
            return this.mixin(prop, Object.create(obj || this));
        },


        /**
         * Return a callback function with this set to the current or a given context object.
         * @param name {String} Name of the method to proxy
         * @param args... [optional] Arguments to use for partial application
         */
        proxy: function (name) {
            var fn = this[name],
                args = Array.prototype.slice.call(arguments, 1);

            args.unshift(this);
            return fn.bind.apply(fn, args);
        }
    };

    return proto;
}));


/*
 * =============================================================
 * elliptical.Provider
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('../class/class'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['../class/class'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.Provider=factory(root.elliptical.Class);
        root.returnExports = root.elliptical.Provider;
    }
}(this, function (Class) {

    var Provider=Class.extend({
        '@resource':null
    },{});

    return Provider;


}));
/*
 * =============================================================
 * elliptical.$Provider
 * =============================================================
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('../class/class'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['../class/class'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.$Provider=factory(root.elliptical.Class);
        root.returnExports = root.elliptical.$Provider;
    }
}(this, function (Class) {

    var $Provider;
    $Provider = function (name) {
        return Class.extend({
            '@resource': name

        }, {});
    };

    return $Provider;


}));

/*
 * =============================================================
 * elliptical.Service
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('../model/model'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['../model/model'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.Service=factory(root.elliptical.Model);
        root.returnExports = root.elliptical.Service;
    }
}(this, function (Model) {

    var Service;
    Service = Model.extend({
        _data: null,
        '@resource': null,
        $provider: null

    }, {});

    return Service;

}));



/*
 * =============================================================
 * elliptical.View
 * =============================================================
 *
 */

//umd pattern
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('../class/class'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['../class/class'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.View=factory(root.elliptical.Class);
        root.returnExports = root.elliptical.View;
    }
}(this, function (Class) {


    var View;
    View = Class.extend({
            _data: {}, //{Object}
            $transitionProvider: null, //{String},
            $provider: null, //{Object}
            selector: '[content-placeholder]', //{String}
            selectorSet: false,
            clientContextRootNamespace: '$$', //{String}
            pushContextToClient: true,

            /**
             * static render method
             * @param template {String}
             * @param context {Object}
             * @param transition {String}
             * @param callback {Function}
             * @returns callback
             * @public
             */
            render: function (template, context, callback) {

                this.$provider.render(template, context,callback);
            },

            /**
              @param {string} selector
              @param {string} html
              @param {string} transitionEffect
              @param {function} callback
            */
            transition: function (selector, html, transitionEffect, callback) {
                this.$transitionProvider.transition(selector, html, transitionEffect, callback);
            },

            /**
             * set the template provider
             * @param $provider {Function}
             * @public
             */
            $setProvider: function ($provider) {
                this.$provider = $provider;
            }

        },
        {
            /**
             * prototype render method
             * @param template {String}
             * @param context {Object}
             * @param transition {String}
             * @param callback {Function}
             * @returns callback
             * @public
             */
            render: function (template, context, callback) {
                this.constructor.render(template,context,callback);
            },

            /**
               @param {string} selector
               @param {string} html
               @param {string} transitionEffect
               @param {function} callback

            */
            transition: function (selector, html, transitionEffect, callback) {
                this.constructor.transition(selector, html, transitionEffect, callback);
            }
        });

    return View;
}));


/*
 * =============================================================
 * elliptical.Event
 * =============================================================
 *
 * environment-independent Events/Pubsub implementation. Code culled in part from:
 * https://github.com/federico-lox/pubsub.js
 *
 *
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
        root.elliptical.Event = factory();
        root.returnExports = root.elliptical.Event;
    }
}(this, function () {
    var Event = {};
    (function (context) {


        /**
         * @private
         */
        function init() {
            //the channel subscription hash
            var channels = {},
            //help minification
                funcType = Function;

            return {
                /*
                 * @public
                 *
                 * Publish/Emit some data on a channel
                 *
                 * @param String channel The channel to publish on
                 * @param Mixed argument The data to publish, the function supports
                 * as many data parameters as needed
                 *
                 * @example Publish stuff on '/some/channel'.
                 * Anything subscribed will be called with a function
                 * signature like: function(a,b,c){ ... }
                 *
                 * Event.emit(
                 *		"/some/channel", "a", "b",
                 *		{total: 10, min: 1, max: 3}
                 * );
                 */
                emit: function () {
                    //help minification
                    var args = arguments,
                    // args[0] is the channel
                        subs = channels[args[0]],
                        len,
                        params,
                        x;

                    if (subs) {
                        len = subs.length;
                        params = (args.length > 1) ?
                            Array.prototype.splice.call(args, 1) : [];

                        //run the callbacks asynchronously,
                        //do not block the main execution process
                        setTimeout(
                            function () {
                                //executes callbacks in the order
                                //in which they were registered
                                for (x = 0; x < len; x += 1) {
                                    try{
                                        subs[x].apply(context, params);

                                    } catch (ex) {

                                    }    
                                   
                                }

                                //clear references to allow garbage collection
                                subs = context = params = null;
                            },
                            0
                        );
                    }
                },

                /*
                 * @public
                 *
                 * Register a callback on a channel
                 *
                 * @param String channel The channel to subscribe to
                 * @param Function callback The event handler, any time something is
                 * published on a subscribed channel, the callback will be called
                 * with the published array as ordered arguments
                 *
                 * @return Array A handle which can be used to unsubscribe this
                 * particular subscription
                 *
                 * @example Event.on(
                 *				"/some/channel",
                 *				function(data){ ... }
                 *			);
                 */
                on: function (channel, callback) {
                    if (typeof channel !== 'string') {
                        throw "invalid or missing channel";
                    }

                    if (!(callback instanceof funcType)) {
                        throw "invalid or missing callback";
                    }

                    if (!channels[channel]) {
                        channels[channel] = [];
                    }

                    channels[channel].push(callback);

                    return { channel: channel, callback: callback };
                },

                /*
                 * @public
                 *
                 * Disconnect a subscribed function f.
                 *
                 * @param Mixed handle The return value from a subscribe call or the
                 * name of a channel as a String
                 * @param Function callback [OPTIONAL] The event handler originaally
                 * registered, not needed if handle contains the return value
                 * of subscribe
                 *
                 * @example
                 * var handle = Event.on("/some/channel", function(){});
                 * Event.off(handle);
                 *
                 * or
                 *
                 * Event.off("/some/channel", callback);
                 */
                off: function (handle, callback) {
                    if (handle.channel && handle.callback) {
                        callback = handle.callback;
                        handle = handle.channel;
                    }

                    if (typeof handle !== 'string') {
                        throw "invalid or missing channel";
                    }

                    if (!(callback instanceof funcType)) {
                        throw "invalid or missing callback";
                    }

                    var subs = channels[handle],
                        x,
                        y = (subs instanceof Array) ? subs.length : 0;

                    for (x = 0; x < y; x += 1) {
                        if (subs[x] === callback) {
                            subs.splice(x, 1);
                            break;
                        }
                    }

                },
                /* convenient global unsubscribe/off  */
                flush: function () {
                    channels = {};
                },

                /* list the channels */
                list: function (callback) {
                    if (callback) {
                        callback(channels);
                    }
                }
            };
        }

        Event.init = init();

    }(this));

    return Event.init; //UMD

}));



/*
 * =============================================================
 * elliptical.url
 * =============================================================
 * Copyright (c) 2014 S.Francis, MIS Interactive
 * Licensed MIT
 *
 * Dependencies:
 * none
 * in part, culled from https://github.com/cowboy/javascript-route-matcher
 *
 *
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
        root.elliptical.url=factory();
        root.returnExports = root.elliptical.url;

    }
}(this, function () {

    var reEscape = /[\-\[\]{}()+?.,\\\^$|#\s]/g;
    var reParam = /([:*])(\w+)/g;

    /**
     *
     * @param rule
     * @param value
     * @returns {*}
     */
    function validateRule(rule, value) {
        var obj={};
        var type = obj.toString.call(rule).charAt(8);
        return type === "R" ? rule.test(value) : type === "F" ? rule(value) : rule == value;
    }

    var url;
    url = {
        match: function (route, rules) {
            var self = {};
            var names = [];
            var re = route;
            if (typeof route === "string") {
                re = re.replace(reEscape, "\\$&");
                re = re.replace(reParam, function (_, mode, name) {
                    names.push(name);
                    return mode === ":" ? "([^/]*)" : "(.*)";
                });
                re = new RegExp("^" + re + "$");
                self.parse = function (url) {
                    var i = 0;
                    var param, value;
                    var params = {};
                    var matches = url.match(re);
                    // If no matches, return null.
                    if (!matches) {
                        return null;
                    }
                    // Add all matched :param / *splat values into the params object.
                    while (i < names.length) {
                        param = names[i++];
                        value = matches[i];
                        // If a rule exists for thie param and it doesn't validate, return null.
                        if (rules && param in rules && !validateRule(rules[param], value)) {
                            return null;
                        }
                        params[param] = decodeURIComponent(value);
                    }
                    return params;
                };

                // Build path by inserting the given params into the route.
                self.stringify = function (params) {
                    var param, re;
                    var result = route;
                    // Insert each passed param into the route string. Note that this loop
                    // doesn't check .hasOwnProperty because this script doesn't support
                    // modifications to Object.prototype.
                    for (param in params) {
                        re = new RegExp("[:*]" + param + "\\b");
                        result = result.replace(re, params[param]);
                    }
                    // Missing params should be replaced with empty string.
                    return result.replace(reParam, "");
                };
            } else {
                // RegExp route was passed. This is super-simple.
                self.parse = function (url) {
                    var matches = url.match(re);
                    return matches && {captures: matches.slice(1)};
                };
                // There's no meaningful way to stringify based on a RegExp route, so
                // return empty string.
                self.stringify = function () {
                    return "";
                };
            }

            return self;
        },

        /**
         * strip protocol,hostname and trailing slash from route
         * @param url {String}
         * @returns {String}
         */
        sanitize: function (url) {
            var root, path;
            root = url.toString().replace(/^(.*\/\/[^\/?#]*).*$/, "$1");
            path = (root.indexOf('://') > -1) ? url.replace(root, '') : root;
            if (path.length > 1 && path.charAt(path.length - 1) === '/') {
                path = path.slice(0, -1);
            }
            return path;

        },

        queryString: function (url, ji) {
            var hu;
            if (typeof ji === 'undefined' && typeof window !== 'undefined') {
                hu = window.location.search.substring(1);
                ji = url;
            } else {
                hu = url.split('?')[1];
            }
            if (typeof hu !== 'undefined') {
                var gy = hu.split("&");
                for (i = 0; i < gy.length; i++) {
                    var ft = gy[i].split("=");
                    if (ft[0] == ji) {
                        return ft[1];
                    }
                }
            }
            return null;
        },

        query: function (url) {
            var query = {};
            var hu = url.split('?')[1];
            if (typeof hu !== 'undefined') {
                var gy = hu.split("&");
                for (i = 0; i < gy.length; i++) {
                    var ft = gy[i].split("=");
                    query[ft[0]] = ft[1];
                }
            }

            return query;
        },

        httpValueCollection: function (url) {
            var query = this.query(url);
            var arr = [];
            for (var key in query) {
                if (query.hasOwnProperty(key)) {
                    var obj = {
                        key: key,
                        value: decodeURIComponent(query[key])
                    };
                    arr.push(obj);
                }
            }

            return arr;
        },

        httpRequestObject: function (route, url) {
            url = (url) ? url : location.pathname;
            var rule = this.match(route);
            return rule.parse(url);
        },

        body: function (prms) {
            var body = {};
            prms.forEach(function (p) {
                body[p.name] = p.value;
            });
            return body;
        },

        hashTagFormat: function (route) {
            if ((route).charAt(1) !== '#') {
                return '/#' + route;
            } else {
                return route;
            }
        },

        pathComponent: function (url) {
            var rte = url.split('?');
            return rte[0];
        }
    };

    return url;

}));



/*
 * =============================================================
 * elliptical.crypto.base64
 * =============================================================
 *
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
        root.elliptical=root.elliptical || {};
        root.elliptical.crypto=elliptical.crypto || {};
        root.elliptical.crypto.base64=factory();
        root.returnExports = root.elliptical.crypto.base64;
    }
}(this, function () {

    var base64;
    base64 = {

        // private property
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

        // public method for encoding
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;

            input = Base64._utf8_encode(input);

            while (i < input.length) {

                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                    this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

            }

            return output;
        },

        // public method for decoding
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {

                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            output = Base64._utf8_decode(output);

            return output;

        },

        // private method for UTF-8 encoding
        _utf8_encode: function (string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

                var c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }

            return utftext;
        },

        // private method for UTF-8 decoding
        _utf8_decode: function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;

            while (i < utftext.length) {

                c = utftext.charCodeAt(i);

                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }

            }

            return string;
        }

    };

    return base64;

}));





/*
 * =============================================================
 * elliptical.crypto
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('./base64'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./base64'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical = root.elliptical || {};
        root.elliptical.crypto=factory(root.elliptical.crypto.base64);
        root.returnExports = root.elliptical.crypto;
    }
}(this, function (basic) {

    var base64=basic.base64;
    var crypto={};
    crypto.base64=base64;
    crypto.base64Encrypt=function(o,n){
        return 'Basic ' + base64.encode(o + ":" + n);

    };

    return crypto;

}));


/*
 * =============================================================
 * elliptical.http.browser
 * =============================================================
 */


//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory($);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.http = root.elliptical.http || {};
        var browser = factory(root.$);
        root.elliptical.http.browser=browser;
        root.returnExports = root.elliptical.http.browser;
    }
}(this, function ($) {

    var browser;
    browser = {
        send: function (params, callback) {
            var settings = {
                type: params.method || 'GET',
                dataType: params.dataType || 'json',
                url: params.protocol + '://' + params.host + ':' + (params.port || 80) + params.path

            };

            if (params.data) {
                params.data = JSON.stringify(params.data);
                settings.data = params.data;
                settings.contentType = 'application/json';

            }
            if (params.authorization) {
                settings.beforeSend = function (req) {
                    req.setRequestHeader('Authorization', params.authorization);
                }
            }

            var ajax = $.ajax(settings).done(function (data, status) {
                try {
                    if (typeof data === 'string') {
                        data = JSON.parse(data);
                    }
                    callback(null, data);

                } catch (ex) {
                    callback(null, data);
                }

            }).fail(function (data, status, errThrown) {
                var err = {};
                err.statusCode = data.status;
                var errMsg = errThrown;
                try {
                    if (data.responseText) {
                        errMsg = data.responseText;
                    }
                } catch (ex) {

                }
                err.message = errMsg;

                callback(err, data.responseJSON);
            });
        }
    };

    return browser;
}));



/*
 * =============================================================
 * elliptical.http
 * =============================================================
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        var transport=require('./node');
        if(typeof window != 'undefined'){
            //we are in a browserify bundle
            transport=require('./browser');
        }
        module.exports = factory(transport,require('elliptical-crypto'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./browser','elliptical-crypto'], factory);
    } else {
        // Browser globals (root is window)
        var browser=root.elliptical.http.browser;
        var crypto=root.elliptical.crypto;
        var http=factory(browser,crypto);
        http.browser=browser;
        root.elliptical.http=http;
        root.returnExports = root.elliptical.http;
    }
}(this, function (transport,crypto) {

    var http={
        send: function (options, callback) {
            transport.send(options,function(err,data){
                if (callback) {
                    callback(err, data);
                }
            });
        },

        base64Encrypt: crypto.base64Encrypt,

        base64:crypto.base64,

        encodeSessionToken: function(token){
            var authorization = 'Session ' + token;
            return authorization;
        },

        encodeOAuthToken: function(token){
            var authorization = 'OAuth ' + token;
            return authorization;
        }


    };

    http.crypto=crypto;

    return http;


}));

/*
 * =============================================================
 * elliptical.document
 * =============================================================
 *   serializes a form submission as a javascript object to be posted to an endpoint.
 *   the plugin handles broad cases of mapping a form to a model schema, including:
 *   (i) posting the form as an array or a deeply nested object
 *   (ii) checkbox handling, including posting boolean values for both checked and unchecked boxes
 *
 *   Note: the return object is not a json document.
 *   a json document can be constructed by simply calling JSON.stringify(which is usually handled by your js mvc framework).
 *   if you are not using a framework and manually invoking $.ajax(), you will need to stringify the return object
 *
 *   the idea is that the dev time is spent on form markup and not processing callbacks on submit captures
 *
 *   Most of the code culled from:
 *   SerializeJSON jQuery plugin.
 *   https://github.com/marioizquierdo/jquery.serializeJSON
 *  version 1.1.1 (Feb 16, 2014)
 *
 *  the method override for serializeArray() to include checkboxes as boolean values:
 *  http://tdanemar.wordpress.com/2010/08/24/jquery-serialize-method-and-checkboxes/
 *
 *  Final note: forms posted to the server-side controller action may not match client-side capture and post to json endpoint
 *  using this plugin due to different implementations by server-side frameworks re: array posts and checkboxes.
 *
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


        $.fn.document = function (options) {
            var o = $.extend({
                boolean: true,
                arrayAsBody:true
            }, options || {});
            var obj, formAsArray;
            obj = {};
            formAsArray = this.booleanSerializeArray(o);

            $.each(formAsArray, function (i, input) {
                var name, value, keys;
                name = input.name;
                value = input.value;

                // Split the input name in programatically readable keys
                // name = "foo"              => keys = ['foo']
                // name = "[foo]"            => keys = ['foo']
                // name = "foo[inn][bar]"    => keys = ['foo', 'inn', 'bar']
                // name = "foo[inn][arr][0]" => keys = ['foo', 'inn', 'arr', '0']
                // name = "arr[][val]"       => keys = ['arr', '', 'val']
                keys = $.map(name.split('['), function (key) {
                    var last;
                    last = key[key.length - 1];
                    return last === ']' ? key.substring(0, key.length - 1) : key;
                });
                if (keys[0] === '') { keys.shift(); } // "[foo][inn]" should be same as "foo[inn]"

                // Set value in the object using the keys
                $.deepSet(obj, keys, value);
            });

            /* if obj has only array prop && if arrayAsBody is set, return the array
             *  else return the object
             */
            if(Object.keys(obj).length===1 && o.arrayAsBody){
                var prop=obj[Object.keys(obj)[0]];
                return (isArray(prop)) ? prop : obj;
            }else{
                return obj;
            }

        };

        // Auxiliar function to check if a variable is an Object
        var isObject = function (obj) {
            return obj === Object(obj);
        };

        var isArray =function(obj){
            return (/Array/).test(Object.prototype.toString.call(obj));
        };

        // Auxiliar function to check if a variable is a valid Array index
        var isValidArrayIndex = function(val){
            return /^[0-9]+$/.test(String(val));
        };

        /**
         Access the object in a deep key and assigns the value:

         // Examples:
         deepSet(obj, ['foo'], v)                //=> obj['foo'] = v
         deepSet(obj, ['foo', 'inn'], v)         //=> obj['foo']['inn'] = v // Create the inner obj['foo'] object, if needed
         deepSet(obj, ['foo', 'inn', 'inn'], v)  //=> obj['foo']['inn']['inn'] = v
         deepSet(obj, ['0'], v)                  //=> obj[0] = v // obj may be an Array
         deepSet(obj, [''], v)                   //=> obj.push(v) // assume obj as array, and add a new value to the end
         deepSet(obj, ['arr', '0'], v)           //=> obj['arr']['0'] = v // obj['arr'] is created as Array if needed
         deepSet(obj, ['arr', ''], v)            //=> obj['arr'].push(v)
         deepSet(obj, ['foo', 'arr', '0'], v)    //=> obj['foo']['arr'][0] = v // obj['foo'] is created as object and obj['foo']['arr'] as a Array, if needed
         deepSet(obj, ['arr', '0', 'foo'], v)    //=> obj['arr']['0']['foo'] = v // obj['foo'] is created as object and obj['foo']['arr'] as a Array and obj['foo']['arr'][0] as object, if needed

         // Complex example with array empty index,
         // it creates a new element, unless there is a nested non repeated key, so it assigns to the last element object:
         var arr = []
         deepSet(arr, [''], v)                   //=> arr === [v]
         deepSet(arr, ['', 'foo'], v)            //=> arr === [v, {foo: v}]
         deepSet(arr, ['', 'bar'], v)            //=> arr === [v, {foo: v, bar: v}]
         deepSet(arr, ['', 'bar'], v)            //=> arr === [v, {foo: v, bar: v}, {bar: v}]
         */
        $.deepSet = function (obj, keys, value) {
            var key, nextKey, tail, objectOrArray, lastKey, lastElement;

            if (!keys || keys.length === 0) { throw new Error("ArgumentError: keys param expected to be an array with least one key"); }
            key = keys[0];

            if (keys.length == 1) { // only one key, then it's not a deepSet, just assign the value.
                if (key === '') {
                    obj.push(value); // empty key is used to add values to the array
                } else {
                    obj[key] = value; // other keys can be used as array indexes or object keys
                }

            } else { // more keys menas a deepSet. Apply recursively

                nextKey = keys[1];

                // Empty key is used to add values to the array => merge next keys in the object element.
                if (key === '') {
                    lastKey = obj.length - 1;
                    lastElement = obj[obj.length - 1];
                    if (isObject(lastElement) && !lastElement[nextKey]) { // if nextKey is a new attribute in the last object element then set the new value in there.
                        key = lastKey;
                    } else { // if the array does not have an object as last element, create one.
                        obj.push({});
                        key = lastKey + 1;
                    }
                }

                // obj[key] defaults to Object or Array, depending on the next key
                if (obj[key] === undefined) {
                    if (nextKey === '' || isValidArrayIndex(nextKey)) { // if is '', 1, 2, 3 ... then use an Array
                        obj[key] = [];
                    } else { // if is something else, use an Object
                        obj[key] = {};
                    }
                }

                // Recursively access the inner Object
                tail = keys.slice(1);
                $.deepSet(obj[key], tail, value);
            }

        };
        $.fn.booleanSerializeArray = function (options) {
            var o = $.extend({
                boolean: true
            }, options || {});

            var rselectTextarea = /select|textarea/i;
            var rinput = /text|number|hidden|password|date|datetime|color|email|month|range|tel|time|url|week|search/i;

            return this.map(function () {
                return this.elements ? $.makeArray(this.elements) : this;
            })
                .filter(function () {
                    return this.name && !this.disabled &&
                        (this.checked
                            || (o.boolean && this.type === 'checkbox')
                            || rselectTextarea.test(this.nodeName)
                            || rinput.test(this.type));
                })
                .map(function (i, elem) {
                    var val = $(this).val();
                    return val == null ?
                        null :
                        $.isArray(val) ?
                            $.map(val, function (val, i) {
                                return { name: elem.name, value: val };
                            }) :
                        {
                            name: elem.name,
                            value: (o.boolean && this.type === 'checkbox') ?
                                (this.checked ? 'true' : 'false') :
                                val
                        };
                }).get();
        };


    return $;


}));


/*
 * =============================================================
 * elliptical.Router
 * =============================================================
 * Dependencies:
 * elliptical-utils,elliptical-mvc,elliptical-event,elliptical-url
 *
 * elliptical.Router implements a client-side version of "node express routing"
  * supports: (i) both html5 & hashTag routing
  *           (ii) virtual directories
  *           (iii) middleware
  *
  * Router consists of 5 classes: Listener,History,Location,Route & Router
  *
  * For a matched route, Router emits a data object with two properties:
  *  (i) route(path)
  *  (ii) the callback handlers, including a return function that matches the signature fn(req,res,next), binding params,body,query,route and
  *       statusCode to a request object
  *
  *       SAMPLE EXAMPLE IMPLEMENTATION
  *       var Router=require('elliptical-router');
  *       var Event=require('elliptical-event');
  *       var App=function(Router,Event){
  *           this.Router=Router;
  *           this.get=function(route,callbacks){
  *              this.Router.get(route,callbacks)
  *           }
  *           this.post=function(route,callbacks){
  *              this.Router.post(route,callbacks);
  *           }
  *           this.listen=function(){
  *              Event.on('OnRouteDispatch',function(data){
  *                 _callStack(data.route,data.handlers);
  *              });
  *           }
  *
  *           function _callStack(route,handlers){
  *               //handle middleware callstack
  *           }
  *       }
  *
  *       var app=new App(Router,Event);
  *       app.get('/my/route/:id',function(req,res,next){
  *            var id=req.id;
  *            //do stuff
  *       });
  *
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'),require('elliptical-mvc'),require('elliptical-event'),require('elliptical-url'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils','elliptical-mvc','elliptical-event','elliptical-url'], factory);
    } else {
        root.elliptical.Router=factory(root.elliptical.utils,root.elliptical,root.elliptical.Event,root.elliptical.url);
        root.returnExports = root.elliptical.Router;
    }
}(this, function (utils,elliptical,Event,url) {
    var Class=elliptical.Class,
        _=utils._;
    var press=('ontouchend' in document) ? 'touchstart' : 'click';
    var Listener=Class.extend({
        events:{
            request:'OnDocumentRequest',
            click:'touchclick',
            orientation: 'OnOrientationChange',
            press:press
        },
        backButtonSelector:'[data-role="back"]',

        on:function(){
            var self=this;

            $(window).on(this.events.request, function (event,data) {
                self.forward(data);
            });
            
            $(document).on(this.events.press, this.backButtonSelector, function (event) {
                Router.history();
            });

            $(window).on(this.events.orientation, function (event, data) {
                data.method='get';
                self.forward(event,data);
            });
        },

        off:function(){
            var self=this;

            $(window).off(this.events.request, function (event,data) {
                self.forward(data);
            });

            $(document).off(this.events.click, this.backButtonSelector, function (event) {
                Router.history();
            });

            $(window).off(this.events.orientation, function (event, data) {
                data.method='get';
                self.forward(event,data);
            });


        },

        reset:function(){
            this.off();
            this.on();
        },

        forward: function(data){
            var route=data.route;
            var params={};
            var method=data.method;
            Router.location(route,method,params);
        }

    },{});



    var History=Class.extend({
        popEvent:'OnDocumentHistory',

        stateObject:null,

        poppedDelay:700,

        pushHistory:false,

        push:function(){
            if(this.pushHistory){
                var stateObject=this.stateObject;
                var title = '';
                stateObject.url = Location.href;
                stateObject.route = Location.hashify(stateObject.route);
                window.history.pushState(stateObject, title, stateObject.route);
            }
        },

        pop:function(event){
            var self=this;
            var isTouch= $.support.touch || false;
            if (event.originalEvent.state) {
                var route = event.originalEvent.state.route;
                var params = event.originalEvent.state.params;
                var method = event.originalEvent.state.method;

                this.pushHistory = false;
                if (isTouch) {
                    setTimeout(function () {
                        Route.location(route,method,params);
                        self.dispatchEvent(route,method,params);
                    }, self.poppedDelay);
                } else {
                    Route.location(route,method,params);
                    this.dispatchEvent(route,method,params);
                }
            }
        },

        dispatchEvent:function(route,method,params){
            var _route=Location.toPath(route);
            if(Location.hashTag){
                if(route.indexOf('/#')===0){
                    route=route.substr(2,route.length-2);
                }
            }
            var data={
                route:route,
                url:Location.href,
                method:method,
                data:params
            };

            var event=document.createEvent("CustomEvent");
            event.initCustomEvent(this.popEvent,true,true,data);
            document.dispatchEvent(event);
        },

        start:function(){
            var self=this;
            var route=Location.path;
            var params = Location.search;
            var url = Location.href;
            var method = 'get';
            var stateObj = { route: route, params: params, method: method,url:url };
            this.stateObject = stateObj;
            this.pushHistory = true;

            setTimeout(function(){
                Location.redirect(location.href);//fire the route of the current url
            },300);

            $(window).on('popstate', function (event) {
                self.pop(event);
            });
        },

        end: function(){
            var self=this;
            this.stateObject = null;
            this.pushHistory = false;
            $(window).off('popstate', function (event) {
                self.pop(event);
            });
        }

    },{});

    var Route=Class.extend({
        dispatchEvent:'OnRouteDispatch',

        add: function (method, route, callbacks) {
            if (this.verify(route, method)) {
                var rte = { route: route, method: method, handle: callbacks };
                Router.routes.push(rte);
                if (Router.debug) {
                    var msg='route: ' + route + ' has been added. Method: ' + method;
                    (Router.enabled) ? console.log(msg) : Router.messageQueue.push(msg);
                }
            }
        },

        remove:function(route,method){
            var index = -1;
            Router.routes.forEach(function(obj,i){
                var route_=obj.route;
                var method_=obj.method;
                if(route===route_ && method===method_){
                    index=i;
                }
            });
            if (index > -1) {
                Router.routes.splice(index, 1);
                if (Router.debug) {
                    console.log('route: ' + route + ' has been removed');
                }
            }
        },

        verify: function (route, method) {
            var bool=true;
            Router.routes.every(function(obj){
                var route_=obj.route;
                var method_=obj.method;
                if(route===route_ && method===method_){
                    bool= false;
                }
            });

            return bool;
        },

        decodeUrl:function(url){
            return decodeURIComponent(url.replace(/\+/g, '%20'));
        },

        deserialize:function(s){
            var data = s.split("&");
            var p = [];
            for (var i = 0; i < data.length; i++) {
                var pair = this.decodeUrl(data[i]).split("=");
                var _name = pair[0];
                var value = pair[1];
                var entry = { name: _name, value: value };
                p.push(entry);

            }
            return p;
        },

        location:function(route, method,params){

            route=Location.deHashify(route);
            History.push();

            if (!this.dispatch(route,method,params)) {
                //error --------->no matched route
                //emit the error

                var handlers = [];
                handlers.push(this.error);
                var data_={
                    route:route,
                    handlers:handlers
                };

                Event.emit(this.dispatchEvent,data_);
            }
        },

        dispatch:function(route, method, params){
            var self=this;
            var dispatchEvent=this.dispatchEvent;
            var success = false;
            var routes=Router.routes;
            //retain original route for case sensitivity of querystrings
            var origRoute=route;
            /* routes should be case insensitive */
            route=route.toLowerCase();
            routes.forEach(function(obj,index){
                var body={};
                var query={};
                var route_ = obj.route;
                /* routes should be case insensitive */
                route_=route_.toLowerCase();
                var routePath=Location.toPath(route);
                var rule = url.match(route_);
                var data = rule.parse(routePath);

                if ((data != null) && (obj.method.toLowerCase() === method.toLowerCase()) &&(!success)) {
                    if(method.toLowerCase()!='get'){
                        body=url.body(data);
                    }
                    /* query component */
                    query=url.query(origRoute);

                    //populate the array of route handlers
                    var handlers = [];
                    var fn = self.next(data,body,query,routePath);
                    handlers.push(fn);

                    var callbacks = obj.handle;
                    for (var i = 0; i < callbacks.length; i++) {
                        handlers.push(callbacks[i]);
                    }

                    //emit the dispatch event
                    var data_={
                        route:routePath,
                        handlers:handlers
                    };

                    Event.emit(dispatchEvent, data_);
                    $(window).trigger('LocationChange', routePath);
                    success = true;
                }

            });

            return success;

            /**
             * parses a location hashtag
             * if hashTag is set and location has hashtag but registered route does not, trim hashtag from location
             * @param route {String}  the registered route
             * @param location {String} the triggered route
             * @returns {*}
             */
            function parseHashTag(route,location){
                if(window.elliptical.$hashTag){
                    if((location).charAt(1) ==='#'){
                       if((route).charAt(1) !== '#'){
                           location=location.substring(2);
                       }
                    }
                }
                return location;
            }
        },

        next: function(params, body,query, route){
            return function (req, res, next) {
                res.statusCode = 200;
                req.params = params;
                req.query=query;
                req.route = route;
                req.body = body;
                next();
            }
        },

        error: function(req, res, next){
            res.statusCode = 404;
            var err = 'Page does not exist';
            next();
        }

    },{});

    /* singleton  */
    var Location={
        "@resource":'Location',

        get hashTag(){
            return window.elliptical.$hashTag;
        },

        get virtualRoot(){
            return window.elliptical.$virtualRoot;
        },

        /**
         * if hashTag bit is set, adds a hashtag to the route, if not already present
         * @param route {String}
         * @returns {String}
         */
        hashify:function(route){
            var virtualRoot=Router.virtualRoot;
            var isVirtual=(virtualRoot !== '/');
            if(Router.hashTag && isVirtual){
                if(route.indexOf(virtualRoot) !==0){
                    route=virtualRoot + route;
                }
                var index=virtualRoot.length;
                if((route).charAt(index + 1) !== '#'){
                    route=utils.stringInsertAt(route,index,'/#');
                }
            }else if(Router.hashTag){
                if((route).charAt(1) !== '#'){
                    route='/#' + route;
                }
            }else if(isVirtual){
                if(route.indexOf(virtualRoot) !==0){
                    route=virtualRoot + route;
                }
            }


            return route;
        },

        /**
         * if hashTag bit is set, removes the leading hashtag from the route
         * @param route {String}
         * @returns {String}
         */
        deHashify:function(route){
            var virtualRoot=Router.virtualRoot;
            if(virtualRoot !=='/'){
                if(route.indexOf(virtualRoot)===0){
                    route=route.replace(virtualRoot,'');
                }
            }
            if(Router.hashTag){
                if((route).charAt(1) === '#'){
                    route=route.substring(2);
                }
            }
            return route;
        },

        hashRoot:function(route){
            if(Router.hashTag && route.slice(-1)==='#'){
                route+='/';
                return route;
            }else{
                return route;
            }
        },

        /**
         * replaces location.path, factoring out virtual root and hashtag
         * @returns {string}
         */
        get path(){
            var hashTag=this.hashTag;
            var virtualRoot=this.virtualRoot;
            var path;
            if(hashTag){
                path=location.hash;
                if((path).charAt(0) ==='#'){
                    path=path.substring(1);
                }
                if(path===''){
                    path='/';
                }
                path=this.toPath(path);
            }else{
                path=location.pathname;
                if(virtualRoot!=='/' ){
                    if(path.indexOf(virtualRoot)===0){
                        path=path.replace(virtualRoot,'');
                    }
                }
            }
            return path;
        },

        get href(){
            var origin=location.origin;
            var path=this.path;
            var search=this.search;
            return origin + path + search;
        },

        set href(val){
            this.redirect(val);
        },

        get search(){
            if(this.hashTag){
                var url=location.hash;
                var length=url.length;
                var index=url.indexOf('?');
                if(index>-1){
                    return url.substring(index,length);
                }else{
                    return '';
                }
            }else{
                return location.search;
            }
        },

        set search(val){
            if(this.hashTag){
                var hash=location.hash;
                var index=hash.indexOf('?');
                if(index>-1){
                    hash=utils.stringReplaceAt(hash,index,val);
                    location.hash=hash;
                }else{
                    location.hash+=val;
                }
            }else{
                location.search=val;
            }
        },

        setQuery:function(key,val){
            var search = this.search;
            if (search !== '') {
                var u = this.href;
                var val_ = url.queryString(u, key);
                if (!val_) {
                    search += '&' + key + '=' + encodeURIComponent(val);
                } else {
                    search=search.replace(key + '=' + val_, key + '=' + val);
                }
            } else {
                search += '?' + key + '=' + encodeURIComponent(val);
            }
            return search;
        },

        toPath:function(route){
            var rte=route.split('?');
            return rte[0];
        },

        get referrer() {
            return History.stateObject.url;
        },

        /**
         * triggers a registered route
         * @param route {String}
         */
        redirect:function(route){
            //note: application.js will overwrite this if History enabled
            location.href=route;
        },

        /**
         * reloads the current route
         */
        reload:function(){
            //note: application.js will overwrite this if History enabled
            location.reload();
        },

        url:url,
        host:location.host,
        hostname:location.hostname,
        origin:location.origin,
        protocol:location.protocol,
        port:location.port

    };

    var Router = Class.extend({
        "@resource":'Router',
        validMethods:['get','post','put','delete'],
        enabled:false,
        debug:true,
        callbacks:[],
        routes:[],
        virtualRoot:'/',
        hashTag:false,
        messageQueue:[],


        get:function(route,callbacks){
            this.parseMethod('get',route,callbacks);
        },

        post:function(route,callbacks){
            this.parseMethod('post',route,callbacks);
        },

        put:function(route,callbacks){
            this.parseMethod('put',route,callbacks);
        },

        delete:function(route,callbacks){
            this.parseMethod('delete',route,callbacks);
        },

        parseMethod:function(method,route,callbacks){
            if(!_.contains(this.validMethods,method)){
                return false;
            }
            var handlers = [];
            if ('string' != typeof route) {
                route = '/';
            }
            if (utils.strLastChar(route) === '/' && route.length > 1) {
                route = utils.trimLastChar(route);
            }
            var args = Array.prototype.slice.call(arguments, 0);
            for (var i = 0; i < args.length; i++) {
                if (typeof args[i] === 'function') {
                    handlers.push(args[i]);
                }
            }
            if (args.length < 1) {
                console.log('error adding route: "' + route + '".  A route must have at least one handler function.')
            } else {
                Route.add(method, route, handlers);
            }

        },

        remove:function(route, method){
            if (!this.enabled) {
                return false;
            }
            Route.remove(route, method);
        },

        removeAll:function(){
            var self=this;
            if (!this.enabled) {
                return false;
            }
            this.routes.forEach(function(obj){
                self.remove(obj.route,obj.method);
            });
        },

        location: function(route, method,params, delay){
            if (!this.enabled) {
                return false;
            }
            if(typeof params==='undefined'){
                params={};
            }
            route=url.sanitize(route);
            route=Location.hashRoot(route);

            var stateObj = { route: route, params: params, method: method,url:Location.href };
            History.stateObject = stateObj;
            History.pushHistory = true;

            if (typeof delay != 'undefined') {
                setTimeout(function () {
                    Route.location(route,method,params);
                }, delay);
            } else {
                Route.location(route, method, params);
            }
        },




        start:function(){
            if (this.enabled) {    /* if already started, exit */
                return false;
            }
            this.enabled = true;
            History.start();
            Listener.on();
            if (this.debug) {
                var msg = 'Router has started in debug mode';
                console.log(msg);
                this.messageQueue.forEach(function(m){
                    console.log(m);
                });
                this.messageQueue.length=0;
            }
        },


        pause: function(){
            this.enabled=false;
            Listener.off();
        },

        resume:function(){
            this.enabled=false;
            Listener.on();
        },

        history:function(pages, delay){
            if (typeof delay != 'undefined') {
                setTimeout(function () {
                    if (typeof pages === 'undefined') {
                        window.history.back();
                    } else {
                        window.history.go(pages);
                    }

                }, delay);
            } else {
                if (typeof pages === 'undefined') {
                    window.history.back();
                } else {
                    window.history.go(pages);
                }
            }
        },

        end: function(){
            this.enabled=false;
            this.routes=[];
            History.end();
            Listener.off();
        },

        /**
         * set Route event provider and event name
         * @param $event {Object}
         * @param eventName {String}
         */
        $provider:function($event,eventName){
            if(typeof $event==='string'){
                Route.dispatchEvent=eventName;
            }else if(typeof $event !== 'undefined'){
                Event=$event;
                if(typeof eventName==='string'){
                    Route.dispatchEvent=eventName;
                }
            }
        },

        /* configure Listener/Event settings */
        configure:function(opts){
            if(opts.request){
                Listener.events.request=opts.request;
            }
            if(opts.orientation){
                Listener.events.orientation=opts.orientation;
            }
            if(opts.click){
                Listener.events.click=opts.click;
            }
            if(opts.backButtonSelector){
                Listener.backButtonSelector=opts.backButtonSelector;
            }
            if(opts.dispatchEvent){
                Route.dispatchEvent=opts.dispatchEvent;
            }
            /* reset Listener */
            Listener.reset();
        }


    },{});


    Router.Location=Location;
    Router.History=History;

    return Router;
}));



/*
 * =============================================================
 * elliptical.middleware.authorization v0.9.1
 * =============================================================
 * Copyright (c) 2014 S.Francis, MIS Interactive
 * Licensed MIT
 *
 * Dependencies:
 * none
 *
 * elliptical http authorization middleware
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
        root.elliptical.middleware = root.elliptical.middleware || {};
        root.elliptical.middleware.authorization=factory();
        root.returnExports = root.elliptical.middleware.authorization;
    }
}(this, function () {

    return function authorization(callback) {
        return function authorization(req, res, next) {
            try{
                var app=req.app,
                    locations=app.locations,
                    acl=null,
                    authenticate=true,
                    utils=app.utils;

                var route=req._parsedUrl.pathname;

                for(var i=0;i<locations.length;i++){
                    if(utils.strLastNChars(locations[i].path,2)==='**'){
                        var location=utils.trimLastNChars(locations[i].path,2);
                        if(route.toLowerCase().indexOf(location.toLowerCase())===0){
                            acl=locations[i];
                            break;
                        }
                    }else if(route.toLowerCase()===locations[i].path.toLowerCase()){
                        acl=locations[i];
                        break;
                    }
                }

                if(acl){
                    var exclude=acl.exclude;
                    for(var i=0;i<exclude.length;i++){
                        if(utils.strLastNChars(exclude[i],2)==='**'){
                            var check=utils.trimLastNChars(exclude[i],2);
                            if(route.toLowerCase().indexOf(check.toLowerCase())===0){
                                authenticate=false;
                                break;
                            }
                        }else if(route.toLowerCase()===exclude[i].toLowerCase()){
                            authenticate=false;
                            break;
                        }
                    }
                    if(authenticate){
                        req.location=route;
                        if(callback){
                            callback(req,res,next);
                        }else{
                            next();
                        }
                    }else{
                        next();
                    }
                }else{
                    next();
                }
            }catch(ex){
                next(ex);
            }
        }
    };
}));


/*
 * =============================================================
 * elliptical.middleware.globalCallback v0.9.1
 * =============================================================
 * Copyright (c) 2014 S.Francis, MIS Interactive
 * Licensed MIT
 *
 * Dependencies:
 * none
 *
 * simple callback middleware
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
        root.elliptical.middleware = root.elliptical.middleware || {};
        root.elliptical.middleware.globalCallback=factory();
        root.returnExports = root.elliptical.middleware.globalCallback;
    }
}(this, function () {

    return function globalCallback(callback) {
        return function globalCallback(req, res, next) {
            try{
                if(!req.context){
                    req.context={};
                }
                if(callback){
                    callback(req,res,next);
                }else{
                    next();
                }
            }catch(ex){
                next(ex);
            }
        }
    };

}));

/*
 * =============================================================
 * elliptical.middleware.http404 v0.9.1
 * =============================================================
 * Copyright (c) 2014 S.Francis, MIS Interactive
 * Licensed MIT
 *
 * Dependencies:
 * none
 *
 * elliptical http 404 error middleware
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
        root.elliptical.middleware = root.elliptical.middleware || {};
        root.elliptical.middleware.http404=factory();
        root.returnExports = root.elliptical.middleware.http404;
    }
}(this, function () {

    return function http404(template,callback) {
        return function http404(req, res, next) {
            if(typeof template==='undefined' || typeof template==='function'){
                if(typeof template==='function'){
                    callback=template;
                }
                template = 'shared.http.status';
            }

            var app=req.app;
            var STRINGS=app.settings.STRINGS;
            var _404;
            if(STRINGS && STRINGS._404){
                _404=STRINGS._404;
            }else{
                _404={
                    statusCode:404,
                    message:'Page Not Found',
                    description:'The resource you are looking for could have been removed, had its name changed, or is temporarily unavailable.  Please review the following URL and make sure that it is spelled correctly.'
                };
            }

            if(callback){
                callback(_404,req,res,next,function(err_,req_,res_,next){
                    render_(err_,req_,res_);
                });
            }else{
                render_(_404,req,res);
            }



            function render_(error,request,response){
                response.context.statusCode = error.statusCode;
                response.context.message = error.message;
                response.context.description = error.description;
                response.context.url = request.url;

                response.render(template, response.context);
            }

        }
    }


}));


/*
 * =============================================================
 * elliptical.middleware.httpError v0.9.1
 * =============================================================
 * Copyright (c) 2014 S.Francis, MIS Interactive
 * Licensed MIT
 *
 * Dependencies:
 * none
 *
 * elliptical http 404 error middleware
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
        root.elliptical.middleware = root.elliptical.middleware || {};
        root.elliptical.middleware.httpError=factory();
        root.returnExports = root.elliptical.middleware.httpError;
    }
}(this, function () {

    return function httpError(template,callback) {
        return function httpError(err,req, res, next) {
            if(typeof template==='undefined' || typeof template==='function'){
                if(typeof template==='function'){
                    callback=template;
                }
                template = 'shared.http.status';
            }
            var e={};
            if(err.stack){
                e.statusCode=500;
                e.description=err.stack;
                e.message='Internal Server Error';
            }else{
                e.statusCode=err.statusCode;
                e.description=err.description;
                e.message=err.message;
            }

            if(callback){
                callback(e,req,res,next,function(err_,req_,res_,next){
                    render_(err_,req_,res_);
                });
            }else{
                render_(e,req,res);
            }

        };

        function render_(error,request,response){
            response.context.statusCode=error.statusCode;
            response.context.description=error.description;
            response.context.message=error.message;
            response.context.url=request.url;
            response.render(template, response.context);
        }
    }


}));




/*
 * =============================================================
 * elliptical.middleware.serviceLocator v0.9.1
 * =============================================================
 * Copyright (c) 2014 S.Francis, MIS Interactive
 * Licensed MIT
 *
 * Dependencies:
 * none
 *
 * elliptical middleware for dependency injection/service location
 * assigns response,request objects as properties to passed services(and the services' providers)
 * and passes the services to a created services array on the request object
 *
 * In this way services are made global to the application(routes or controller actions) and service providers
 * have access to the real-time req,res objects
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
        root.elliptical.middleware = root.elliptical.middleware || {};
        root.elliptical.middleware.serviceLocator=factory();
        root.returnExports = root.elliptical.middleware.serviceLocator;
    }
}(this, function () {

    return function serviceLocator() {

        return function serviceLocator(req, res, next) {
            req.service=function(name){
                var app=req.app;
                var container=app.container;

                return container.getType(name);
            };

            next();
        }
    }

}));

/*
 * =============================================================
 * elliptical.middleware.sessionSync v0.9.1
 * =============================================================
 * Copyright (c) 2014 S.Francis, MIS Interactive
 * Licensed MIT
 *
 * Dependencies:
 * elliptical-utils
 *
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils'], factory);
    } else {
        root.elliptical.middleware = root.elliptical.middleware || {};
        root.elliptical.middleware.sessionSync=factory(root.elliptical);
        root.returnExports = root.elliptical.middleware.sessionSync;
    }
}(this, function (utils) {
    var _=utils._;
    return function sessionSync() {
        return function sessionSync(req, res, next) {
            try{
                if(typeof window !=='undefined'){
                    var session= sessionStorage.getItem('sessionStore');

                    if(session){
                        session=JSON.parse(session);
                        _.defaults(req.session,session);
                    }
                }

                var Session=req.service('Session');
                Session.get(function(err,data){
                    if(data){
                        try{
                            _.defaults(req.session,data);
                        }catch(ex){

                        }
                    }
                    next();
                });


            }catch(ex){
                next(ex);
            }
        }
    };

}));

/*!
 * jQuery Cookie Plugin v1.3.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */



(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as anonymous module.
        define(['jquery'], factory);
    }else if (typeof module === 'object' && module.exports) {
        //CommonJS module

        if(typeof window!='undefined'){
            factory($);
        }

    } else {
        // Browser globals.
        factory($);
    }
}(function ($) {

    var pluses = /\+/g;

    function raw(s) {
        return s;
    }

    function decoded(s) {
        return decodeURIComponent(s.replace(pluses, ' '));
    }

    function converted(s) {
        if (s.indexOf('"') === 0) {
            // This is a quoted cookie as according to RFC2068, unescape
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        try {
            return config.json ? JSON.parse(s) : s;
        } catch(er) {}
    }

    var config = $.cookie = function (key, value, options) {
        config.raw = true;
        // write
        if (value !== undefined) {
            options = $.extend({}, config.defaults, options);

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setDate(t.getDate() + days);
            }

            value = config.json ? JSON.stringify(value) : String(value);

            return (document.cookie = [
                config.raw ? key : encodeURIComponent(key),
                '=',
                config.raw ? value : encodeURIComponent(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path    ? '; path=' + options.path : '',
                options.domain  ? '; domain=' + options.domain : '',
                options.secure  ? '; secure' : ''
            ].join(''));
        }

        // read
        var decode = config.raw ? raw : decoded;
        var cookies = document.cookie.split('; ');
        var result = key ? undefined : {};
        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decode(parts.shift());
            var cookie = decode(parts.join('='));

            if (key && key === name) {
                result = converted(cookie);
                break;
            }

            if (!key) {
                result[name] = converted(cookie);
            }
        }

        return result;
    };

    config.defaults = {};

    $.removeCookie = function (key, options) {
        if ($.cookie(key) !== undefined) {
            // Must not alter options, thus extending a fresh object...
            $.cookie(key, '', $.extend({}, options, { expires: -1 }));
            return true;
        }
        return false;
    };

    return $;

}));





/*
 * =============================================================
 * elliptical.providers.$Odata
 * =============================================================
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.providers=root.elliptical.providers || {};
        root.elliptical.providers.$Odata = factory(root.elliptical);
        root.returnExports = root.elliptical.providers.$Odata;
    }
}(this, function (elliptical) {

    var $Odata;
    $Odata = elliptical.Provider.extend({

        filter: function (endpoint, filter) {
            var encodedFilter = '$filter=' + encodeURIComponent(filter);
            return (endpoint.indexOf('?') > -1) ? '&' + encodedFilter : '?' + encodedFilter;
        },

        orderBy: function (endpoint, orderBy) {
            var encodedOrderBy = '$orderby=' + encodeURIComponent(orderBy);
            return (endpoint.indexOf('?') > -1) ? '&' + encodedOrderBy : '?' + encodedOrderBy;
        },

        orderByDesc: function (endpoint, orderBy, orderByDesc) {
            if (orderBy !== undefined) {
                return ', ' + encodeURIComponent(orderByDesc + ' desc');
            } else {
                var encodedOrderByDesc = '$orderby=' + encodeURIComponent(orderByDesc + ' desc');
                return (endpoint.indexOf('?') > -1) ? '&' + encodedOrderByDesc : '?' + encodedOrderByDesc;
            }
        },

        top: function (endpoint, top) {
            var encodedTop = '$top=' + top;
            return (endpoint.indexOf('?') > -1) ? '&' + encodedTop : '?' + encodedTop;
        },

        skip: function (endpoint, skip) {
            var encodedSkip = '$skip=' + skip;
            return (endpoint.indexOf('?') > -1) ? '&' + encodedSkip : '?' + encodedSkip;
        },

        paginate: function (endpoint, params) {
            var page = params.page,
                pageSize = params.pageSize,
                skip,
                encodedPaginate;

            if (typeof page === 'undefined' || typeof pageSize === 'undefined') {
                return endpoint;
            } else {
                page--;
                skip = page * pageSize;
                encodedPaginate = (skip > 0) ? '$skip=' + skip + '&$top=' + pageSize + '&$inlinecount=allpages' : '$top=' + pageSize + '&$inlinecount=allpages';
                return (endpoint.indexOf('?') > -1) ? '&' + encodedPaginate : '?' + encodedPaginate;
            }
        }

    }, {});

    return $Odata;


}));



/*
 * =============================================================
 * elliptical.providers.$Pagination
 * =============================================================
 * returns a pagination ui context(object) for template binding
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.providers=root.elliptical.providers || {};
        root.elliptical.providers.$Pagination=factory(root.elliptical);
        root.returnExports = root.elliptical.providers.$Pagination;
    }
}(this, function (elliptical) {
    /**
     * @param paginate {Object}
     * @param pagination {Object}
     * @param data {Object}
     * @returns {Object}
     */



    var $Pagination;
    $Pagination = elliptical.Provider.extend({
        count: 'count',
        data: 'data',
        spread: 10,

        get: function (params, data) {

            var count_ = this.count;
            var data_ = this.data;
            var spread_ = this.spread;

            if(params.paginate) {
                params = params.paginate;
            }


            return _pagination(params, data);

            /**
             *
             * @param params {Object}
             * @param result {Object}
             *
             * @returns {Object}
             * @qpi private
             */
            function _pagination(params, result) {
                var baseUrl,rawUrl, page, count, pageSize, pageSpread, data;
                baseUrl = params.baseUrl;
                rawUrl=params.rawUrl;
                page = params.page;

                
                if (result instanceof Array) {
                    count = result.length;
                    data = result;
                   
                } else {
                    count = result[count_];
                    data = result[data_];
                }
                

                pageSize = params.pageSize;
                pageSpread = spread_;
                try {
                    page = parseInt(page);
                } catch (ex) {
                    page = 1;
                }

                var pageCount = parseInt(count / pageSize);
                var remainder = count % pageSize;
                if (pageCount < 1) {
                    pageCount = 1;
                } else if (remainder > 0) {
                    pageCount++;
                }

                //query search part of url
                var querySearch=getQuerySearch(rawUrl);

                //pagination object
                var pagination = {
                    page: page,
                    pageCount: pageCount,
                    prevPage: baseUrl + '/1',
                    firstPage: null,
                    prevClass: 'hide',
                    nextPage: baseUrl + '/' + pageCount,
                    nextClass: 'hide',
                    lastPage: null,
                    pages: [],
                    beginRecord: null,
                    endRecord: null,
                    count: count

                };
                //assign pagination properties
                //prev
                if (page > 1) {
                    pagination.prevClass = '';
                    pagination.prevPage = assignUrl(baseUrl, parseInt(page - 1), querySearch);
                }
                //next
                if (page < pageCount) {
                    pagination.nextClass = '';
                    pagination.nextPage = assignUrl(baseUrl, parseInt(page + 1), querySearch);
                }

                //get page links

                if (pageCount > 1) {
                    pagination.pages = _pageLinks(baseUrl, page, pageCount, pageSpread, querySearch);

                }

                //first,last pages
                pagination.firstPage = assignUrl(baseUrl, 1, querySearch);
                pagination.lastPage = assignUrl(baseUrl, pageCount, querySearch);


                //assign record pointers
                var currentPointer = assignRecordPointers(count, page, pageSize);
                pagination.beginRecord = currentPointer.beginRecord;
                pagination.endRecord = currentPointer.endRecord;


                return {
                    pagination: pagination,
                    data: data
                };

            }


            /**
             *
             * @param {string} baseUrl
             * @param {number} page
             * @param {number} pageCount
             * @param {number} pageSpread
             * @param {string} querySearch
             * @returns {Array}
             * @api private
             */
            function _pageLinks(baseUrl, page, pageCount, pageSpread, querySearch) {
                var pages = [];
                if (pageSpread > pageCount) {
                    pageSpread = pageCount;
                }

                if (page < pageSpread) {

                    for (var i = 0; i < pageSpread; i++) {
                        var obj = {
                            page: i + 1,
                            pageUrl: assignUrl(baseUrl, parseInt(i + 1), querySearch)
                        };

                        if (i === parseInt(page - 1)) {
                            obj.activePage = 'active';
                        }
                        pages.push(obj);
                    }
                    return pages;
                } else {
                    var halfSpread = parseInt(pageSpread / 2);
                    var beginPage, endPage;
                    if (pageCount < page + halfSpread) {
                        endPage = pageCount;
                        beginPage = endPage - pageSpread;
                    } else {
                        endPage = page + halfSpread;
                        beginPage = page - halfSpread;
                    }
                    for (var i = beginPage; i < endPage + 1; i++) {
                        var obj = {
                            page: i,
                            pageUrl: assignUrl(baseUrl, i, querySearch)
                        };
                        if (i === page) {
                            obj.activePage = 'active';
                        }
                        pages.push(obj);
                    }
                    return pages;
                }
            }

            function assignUrl(baseUrl, index, querySearch) {

                var pageUrl = baseUrl + '/' + index;
                if(querySearch && querySearch !==undefined){
                    pageUrl +=querySearch;
                }
                return pageUrl;
            }

            function assignRecordPointers(count, page, pageSize) {
                var beginRecord = (page - 1) * pageSize + 1;
                if (count===0){
                    beginRecord=0;
                }
                var endRecord = page * pageSize;
                if (endRecord > count) {
                    endRecord = count;
                }
                return {
                    beginRecord: beginRecord,
                    endRecord: endRecord
                };
            }

            function getQuerySearch(url){
                var index=url.indexOf('?');
                var length=url.length;
                if(index>-1){
                    return url.substring(index,length);
                }else{
                    return null;
                }
            }

        }


    }, {});


    return $Pagination;


}));


/*
 * =============================================================
 * elliptical.providers.$Rest
 * =============================================================
 * rest provider
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'),require('elliptical-http'),require('../odata/odata'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc','elliptical-http','../odata/odata'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.providers=root.elliptical.providers || {};
        root.elliptical.providers.$Rest = factory(root.elliptical,root.elliptical.http,root.elliptical.providers.$Odata);
        root.returnExports = root.elliptical.providers.$Rest;
    }
}(this, function (elliptical,http,$Odata) {
    var factory=elliptical.factory;
    var async=elliptical.async || window.async;
    var utils = elliptical.utils;


    var $Rest;
    $Rest = elliptical.Provider.extend({
        _data: null,
        port: null,
        path: null,
        host: null,
        protocol: null,
        $queryProvider: $Odata,
        onSend: null,

        /**
        * @param {object} opts
        * @param {object} $queryProvider
        */
        init: function (opts, $queryProvider) {
            opts = opts || {};
            this.host = opts.host || this.constructor.host;
            this.host = this.host || 'localhost';
            this.port = opts.port || this.constructor.port;
            this.port = this.port || 80;
            this.path = opts.path || this.constructor.path;
            this.path = this.path || '/api';
            this.protocol = opts.protocol || this.constructor.protocol;
            this.protocol = this.protocol || 'http';

            if ($queryProvider !== undefined) {
                this.$queryProvider = $queryProvider;
            }
        },

        /**
         * http get
         * @param params {Object}
         * @param resource {String}
         * @param query {Object}
         * @param callback {Function}
         * @returns callback
         * @public
         */
        get: function (params, resource, query, callback) {
            if (typeof query === 'function') {
                callback = query;


            }

            var options = this._getOptions(resource, 'GET', undefined);

            var q = '';
            var i = 0;
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var val = encodeURIComponent(params[key]);
                    if (i === 0) {
                        q += '?' + key + '=' + val;
                        i++;
                    } else {
                        q += '&' + key + '=' + val;
                    }
                }
            }
            if (q !== '') {
                options.path += '/' + q;
            }

            //test query options
            if (query && typeof query.filter !== 'undefined') {
                options.path += this.$queryProvider.filter(options.path, query.filter);
            }

            if (query && typeof query.orderBy !== 'undefined') {
                options.path += this.$queryProvider.orderBy(options.path, query.orderBy);
            }

            if (query && typeof query.orderByDesc !== 'undefined') {
                options.path += this.$queryProvider.orderByDesc(options.path,query.orderBy, query.orderByDesc);
            }

            if (query && typeof query.paginate !== 'undefined') {
                options.path += this.$queryProvider.paginate(options.path, query.paginate);
            } else {
                //don't allow mixing of paginate with skip/top since paginate is more or less a convenience wrapper for skip & top
                if (query && typeof query.skip !== 'undefined') {
                    options.path += this.$queryProvider.skip(options.path, query.skip);
                }

                if (query && typeof query.top !== 'undefined') {
                    options.path += this.$queryProvider.top(options.path, query.top);
                }
            }

            //send
            this._send(options, resource, callback);

        },

        /**
         * http post
         * @param params {Object}
         * @param resource {String}
         * @param callback {Function}
         * @returns callback
         * @public
         */
        post: function (params, resource, callback) {
            var options = this._getOptions(resource, 'POST', params);
            this._send(options, resource, callback);

        },

        /**
         * non-standard http implementation of a "merge"
         * @param params {Object}
         * @param resource {String}
         * @param callback {Function}
         * @returns callback
         * @public
         */
        patch: function (params, resource, callback) {
            throw new Error('patch not implemented');
        },


        /**
         * http put
         * @param params {Object}
         * @param resource {String}
         * @param callback {Function}
         * @returns callback
         * @public
         */
        put: function (params, resource, callback) {
            var options = this._getOptions(resource, 'PUT', params);
            this._send(options, resource, callback);
        },


        /**
         * http delete
         * @param params {Object}
         * @param resource {String}
         * @param callback {Function}
         * @returns callback
         * @public
         */
        delete: function (params, resource, callback) {
            if (params.ids && params.ids !== undefined) {
                this.post(params.ids, resource, callback)
            } else {
                this._delete(params, resource, callback);
            }

        },

        _delete: function (params, resource, callback) {
            var options = this._getOptions(resource, 'DELETE', undefined);
            var q = '';
            var i = 0;
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var val = encodeURIComponent(params[key]);
                    if (i === 0) {
                        q += '?' + key + '=' + val;
                        i++;
                    } else {
                        q += '&' + key + '=' + val;
                    }
                }
            }
            if (q != '') {
                options.path += '/' + q;
            }
            //send
            this._send(options, resource, callback);
        },


        /**
         * non-standard http implementation of a sql query
         * @param params {Object}
         * @param resource {String}
         * @param opts {Object}
         * @param callback {Function}
         * @returns callback
         * @public
         */
        query: function (params, resource, opts, callback) {
            throw new Error('query not implemented');
        },


        /**
         * non-standard http implementation of a sql command
         * @param params {Object}
         * @param resource {String}
         * @param opts {Object}
         * @param callback {Function}
         * @returns callback
         * @public
         */
        command: function (params, resource, opts, callback) {
            throw new Error('command not implemented');
        },


        /**
         * send the request
         * @param options {Object}
         * @param resource {String}
         * @param callback {Function}
         * @returns callback
         * @private
         */
        _send: function (options, resource, callback) {

            /* we asynchronously pass through to _onAuthenticate and _onSend(if a callback has been defined)
             using the async waterfall pattern before passing off to http.
             Note: _onAuthenticate should be implemented by extending the $Rest provider and overwriting the current
             method which does nothing but pass through. You can also implement authentication by relying on the _onSend
             callback, which does pass up the request object, if available.
             ex:
             $myRestProvider.onSend=function(req, options, resource,callback){
             options.authorization=http.encodeSessionToken(req.cookies.authToken);
             callback.call(this,null,options);
             };

             pass the options object back as the data param in the callback
             */
            var req = this.req || {};
            var funcArray = [];
            var onAuth = factory.partial(this._onAuthentication, options, resource).bind(this);
            funcArray.push(onAuth);
            if (typeof this.onSend === 'function') {
                var onSendCallback = this.onSend;
                var onSend = factory.partial(this._onSend, onSendCallback, req, resource).bind(this);
                funcArray.push(onSend);
            }
            async.waterfall(funcArray, function (err, result) {
                (err) ? callback(err, null) : http.send(result, callback);
            });

        },

        /**
         * set authorization/authentication on the request; implement by extending the $Rest provider and class
         * and overwriting the method, returning options in the callback
         * @param options {Object}
         * @param resource {String}
         * @param callback {Function}
         * @private
         */
        _onAuthentication: function (options, resource, callback) {
            if (callback) {
                callback.call(this, null, options);
            }
        },


        /**
         * calls an onSend provided callback, if defined
         * @param fn {Function}
         * @param req {Object}
         * @param resource {String}
         * @param options {Object}
         * @param callback {Function}
         * @private
         */
        _onSend: function (fn, req, resource, options, callback) {
            fn.call(this, req, options, resource, callback);
        },

        /**
         * constructs the request options object
         * @param method {String}
         * @param resource {String}
         * @param data {Object}
         * @returns {Object}
         * @private
         */
        _getOptions: function (resource, method, data) {
            var options = {};
            options.host = this.host || this.constructor.host;
            options.port = this.port || this.constructor.port;
            options.method = method;
            options.path = this.path || this.constructor.path;
            resource = (utils.strFirstChar(resource) === '/') ? resource : '/' + resource;
            options.path = options.path + resource;
            options.protocol = this.protocol || this.constructor.protocol;
            if (data && data !== undefined) {
                options.data = data;
            }
            return options;
        }


    });



    return $Rest;

}));





/*
 * =============================================================
 * elliptical.providers.$Cookie
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'),require('../cookie/cookie'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc','../cookie/cookie'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.providers=root.elliptical.providers || {};
        root.elliptical.providers.$Cookie = factory(root.elliptical);
        root.returnExports = root.elliptical.providers.$Cookie;
    }
}(this, function (elliptical) {

    var $Cookie;
    $Cookie = elliptical.Class.extend({

        /**
         * @param {string} key
         * @returns {object}
         * @public
         */

        get: function (key) {
            var value= $.cookie(key);
            try {
                value = JSON.parse(value);
            } catch (ex) {

            }
            return value;
        },

        /**
         *
         * @param {string} key
         * @param {object} value
         * @param {object} params
         * @public
         */
        set: function (key,value,params) {
            if(params===undefined){
                params={};
                params.path='/';
            }
            if(params.path===undefined){
                params.path='/';
            }
            if(typeof value==='object'){
                value=JSON.stringify(value);
            }
            $.cookie(key,value,params);
        },

        /**
         *
         * @param {string} key
         * @public
         */
        delete: function (key) {
            $.removeCookie(key);
        },

        /**
         * @public
         */
        clear:function(){
            throw "Method 'clear' not implemented by the cookie provider";
        }


    }, {});



    return $Cookie;

}));


/*
 * =============================================================
 * elliptical.providers.$Local
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.providers=root.elliptical.providers || {};
        root.elliptical.providers.$Local = factory(root.elliptical);
        root.returnExports = root.elliptical.providers.$Local;
    }
}(this, function (elliptical) {

    var $Local;
    $Local = elliptical.Class.extend({


        /**
         * @param {string} key
         * @returns {object}
         * @public
         */
        get: function (key) {
            var value = localStorage.getItem(key);
            try {
                value = JSON.parse(value);
            } catch (ex) {

            }

            return value;
        },

        /**
         * @param {string} key
         * @param {object} value
         * @param {object} params - not used by this provider
         * @public
         */
        set: function (key,value,params) {
            if(typeof value==='object'){
                value=JSON.stringify(value);
            }

            localStorage.setItem(key, value);
        },

        /**
         *
         * @param {string} key
         */
        delete: function (key) {
            localStorage.removeItem(key);
        },

        /**
         * @public
         */
        clear:function(){
            localStorage.clear();
        }


    }, {});



    return $Local;

}));




/*
 * =============================================================
 * elliptical.providers.$Session
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.providers=root.elliptical.providers || {};
        root.elliptical.providers.$Session = factory(root.elliptical);
        root.returnExports = root.elliptical.providers.$Session;
    }
}(this, function (elliptical) {

    var $Session;
    $Session = elliptical.Class.extend({


        /**
         * @param {string} key
         * @returns {object}
         * @public
         */
        get: function (key) {
            var value = sessionStorage.getItem(key);
            try {
                value = JSON.parse(value);
            } catch (ex) {

            }

            return value;
        },

        /**
         * @param {string} key
         * @param {object} value
         * @param {object} params - not used by this provider
         * @public
         */
        set: function (key,value,params) {
            if(typeof value==='object'){
                value=JSON.stringify(value);
            }

            sessionStorage.setItem(key, value);
        },

        /**
         *
         * @param {string} key
         */
        delete: function (key) {
            sessionStorage.removeItem(key);
        },

        /**
         * @public
         */
        clear:function(){
            sessionStorage.clear();
        }


    }, {});


    return $Session;

}));



/*
 * =============================================================
 * elliptical.providers.$Template
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'),require('elliptical-utils'),require('elliptical-dustjs'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc','elliptical-utils','elliptical-dustjs'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.providers=root.elliptical.providers || {};
        root.elliptical.providers.$Template = factory(root.elliptical,root.elliptical.utils,dust);
        root.returnExports = root.elliptical.providers.$Template;
    }
}(this, function (elliptical,utils,dust) {

    var _=utils._;
    dust.optimizers.format = function (ctx, node) {
        return node;
    };

    dust._root = '';

    dust.onLoad=function(template,callback){
        if(template.indexOf('shared.') > -1){
            _loadTemplateFromSharedViews(dust,template,callback);
        }else{
            var err=new Error('Partial Not Found: ' + template);
            callback(err,null);
        }
    };

    var $Template;
    $Template = elliptical.Provider.extend({
        _data: {},

        $store: null,

        base: {
            server: 'base',
            client: 'base-client'
        },

        $provider: dust,

        compile: dust.compile,

        cache: dust.cache,

        model: 'template',

        api: '/api/template',

        namespace: null,

        root: '',

        setRoot:function(val) {
            this.root = val;
            dust._root = val;
        },


        /**
         *
         * @returns {String}
         * @public
         */
        getBase: function () {
            return (utils.isBrowser()) ? this.base.client : this.base.server;

        },

        /**
         *
         * @param opts {Object}
         */
        $setOpts: function (opts) {
            if (opts) {
                if (typeof opts.model !== 'undefined') {
                    this.model = opts.model;
                }
                if (typeof opts.api !== 'undefined') {
                    this.api = opts.api;
                }
                if (typeof opts.base !== 'undefined') {
                    this.base = opts.base;
                }
            }
        },

        $setProvider: function ($provider) {
            this.$provider = $provider;

        },

        /**
         *
         * @param template {String}
         * @param context {Object}
         * @param callback {Function}
         * @returns callback
         * @public
         */
        render: function (template, context, callback) {
            var $provider = this.$provider;
            var cache = $provider.cache;
            if (typeof template === 'object') {
                var ctrlName = template.name.toLowerCase();
                var ctrlView = template.view.toLowerCase();
                var ctrlTemplate = ctrlName + '.' + ctrlView;
                if (!_.isEmpty(cache)) {
                    var result = cache[ctrlTemplate];
                    if (result) {
                        $provider.render(ctrlTemplate, context, callback);
                    } else {
                        _loadTemplateFromControllerView(this, ctrlName, ctrlView, context, callback);
                    }
                } else {
                    _loadTemplateFromControllerView(this, ctrlName, ctrlView, context, callback);
                }
            } else {
                _loadTemplateByStringValue(this, template, context, callback);
            }

        },

        /**
         * set the provider as a global to the window object
         * on the browser side, if compiled templates are referenced in script tag, you'll need to set
         * a reference to dust on the window object
         */
        setBrowserGlobal: function () {
            if (typeof window != 'undefined') {
                window.dust = this.$provider;
            }
        }

    }, {
        /**
         * new instance init
         * @param base {boolean}
         */
        init: function (base) {
            if (base) {
                this.constructor._data.base = true;
            }
            this.root = this.constructor.root;
        },

        /**
         * renders with a context base
         * use render method on template provider's prototype to mixin a base context
         *
         * @param template {String}
         * @param context {Object}
         * @param callback {Function}
         * @returns callback
         * @public
         */
        render: function (template, context, callback) {

            if (this.constructor._data.base) {
                var baseRender = {
                    render: this.constructor.getBase()
                };
                var base = this.constructor.$provider.makeBase(baseRender);
                context = base.push(context);
            }

            this.constructor.render(template, context, function (err, out) {
                if (callback) {
                    callback(err, out);
                }
            });
        }
    });

    function _loadTemplateFromSharedViews($provider, template, callback) {
        var root = $provider._root;
        var url=root + '/views';
        var arr=template.split('.');
        for(var i=0; i<arr.length;i++){
            url+='/' + arr[i];
        }
        url+='.html';
        $.get(url,function(data){
            if(data){
                var compiled = $provider.compile(data, template);
                $provider.loadSource(compiled);
                callback(null,data);
            }else{
                callback(new Error('Error: cannot find ' + template + ' in shared views folder'),null);
            }
        });
    }


    function _loadTemplateFromControllerView(thisRef, ctrl, view, context, callback) {
            var root = thisRef.root;
            if(typeof window ===undefined){
                throw "Template provider for Controller/Action is currently not configured for non-browser environments"
            }
            var url=root + '/views/' + ctrl + '/' + view + '.html';
            var ctrlTemplate=ctrl + '.' + view;
            var $provider=thisRef.$provider;
            $.get(url,function(data){
                if(data){
                    var compiled = $provider.compile(data, ctrlTemplate);
                    $provider.loadSource(compiled);
                    $provider.render(ctrlTemplate,context,callback);
                }else{
                    callback('Error: Controller View does not exist',null);
                }   
            });
            
    }

    function _loadTemplateByStringValue(thisRef,template,context,callback){
        var $provider=thisRef.$provider;
        var cache=$provider.cache;
        if (_.isEmpty(cache)){
            _loadTemplateCacheFromStore(thisRef.model,thisRef.$store,$provider,thisRef.api,function(){
                $provider.render(template,context,callback);
            });
        }else{
            $provider.render(template,context,callback);
        }
    }

    /**
     * if template cache is empty, load it from the store or client-side, load it from scripts
     * @param model {String}
     * @param $store {Object}
     * @param $provider {Object}
     * @param api {String}
     * @param callback {Function}
     * @private
     */
    function _loadTemplateCacheFromStore(model, $store, $provider, api, callback) {
        if(!utils.isBrowser()){
            $store.getAll(model,function(err,data){
                for(var i= 0, max=data.length;i<max;i++){
                    var obj=JSON.parse(data[i]);
                    dust.loadSource(obj);
                }
                callback();
            });


        }else{

            //continue to query at intervals for cache to load from script
            var iterations=0;
            var process=new elliptical.Interval({
                delay:10
            });
            process.run(function(){
                checkCache($provider,process,iterations,callback);
            })
        }
    }

    function checkCache($provider,process,iterations,callback){
        var cache=$provider.cache;
        if(!utils._.isEmpty(cache)){
            process.terminate();
            if(callback){
                callback();
            }
        }else{
            if(iterations > 1000){
                process.terminate();
                if(callback){
                    callback();
                }
            }else{
                iterations++;
            }
        }
    }


    return $Template;

}));




/*
 * =============================================================
 * elliptical.providers.$Validation
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.providers=root.elliptical.providers || {};
        root.elliptical.providers.$Validation=factory(root.elliptical);
        root.returnExports = root.elliptical.providers.$Validation;
    }
}(this, function (elliptical) {
    var utils = elliptical.utils;

    var $Validation;
    $Validation = elliptical.Provider.extend({
        schemas: [],

        submitLabel: 'submitLabel',

        successMessage: 'Successfully Submitted...',

        post: function (form, name, callback) {
            var err = null;
            var schema = this.getSchema(name);
            for (var key in schema) {
                if (schema.hasOwnProperty(key)) {
                    if (schema[key].required && (typeof form[key] === 'undefined' || form[key] === '')) {
                        form[key + '_placeholder'] = utils.camelCaseToSpacedTitleCase(key) + ' Required...';
                        form[key + '_error'] = 'error';
                        if (!err) {
                            err = this.error();
                        }
                    } else if (schema[key].validate && typeof schema[key].validate === 'function') {
                        var msg = schema[key].validate(form);
                        if (msg) {
                            form[key + '_placeholder'] = msg;
                            form[key + '_error'] = 'error';
                            form[key] = '';
                            if (!err) {
                                err = this.error();
                            }
                        }
                    } else if (schema[key].confirm) {
                        if (form[key] && form['confirm' + key]) {
                            if (form[key] != form['confirm' + key]) {
                                form[key + '_placeholder'] = 'Does Not Match...';
                                form[key + '_error'] = 'error';
                                form['confirm' + key + '_placeholder'] = 'Does Not Match...';
                                form['confirm' + key + '_error'] = 'error';
                                if (!err) {
                                    err = this.error();
                                }
                            }
                        }
                    } else if (key === 'validate' && typeof schema[key] === 'function') {
                        var msg = schema['validate'](form);
                        if (msg) {
                            err = this.error(msg);

                        }
                    }
                }
            }
            if (err) {
                form = this.addSubmitLabel(form, false);
                callback(err, form);
            } else {
                form = this.deleteProperties(form);
                callback(null, form);
            }


        },

        put: function (schema, name, callback) {
            var obj = {
                name: name,
                schema: schema
            };

            var schemas = this.schemas;
            schemas.push(obj);
            if (callback) {
                callback(null, obj);
            }
        },

        onError: function (form, msg) {
            form = this.addSubmitLabel(form, msg, false);
            return form;
        },

        onSuccess: function (form) {
            form = this.addEmptySubmitLabel(form);
            return form;
        },

        getSchema: function (name) {
            var schema = null;
            for (var i = 0; i < this.schemas.length; i++) {
                if (this.schemas[i].name.toLowerCase() === name.toLowerCase()) {
                    schema = this.schemas[i].schema;
                    break;
                }
            }
            return schema;
        },

        error: function (msg) {
            if (typeof msg === 'undefined') {
                msg = 'Form Submission Error';
            }
            var err = {};
            err.message = msg;
            err.css = 'error';
            err.cssDisplay = 'visible';
            return err;
        },

        addSubmitLabel: function (form, msg, valid) {
            if (typeof valid === 'undefined') {
                valid = msg;
                msg = undefined;
            }
            var obj;
            if (valid) {
                obj = this.success();
            } else {
                obj = this.error(msg);
            }
            form[this.submitLabel] = obj;
            return form;
        },

        addEmptySubmitLabel: function (form) {
            form[this.submitLabel] = this.emptyLabelObject();
            return form;
        },

        success: function () {
            var msg = {};
            msg.message = this.successMessage;
            msg.css = 'success';
            msg.cssDisplay = 'visible';
            return msg;
        },

        emptyLabelObject: function () {
            var msg = {};
            msg.message = '&nbsp;';
            msg.css = '';
            msg.cssDisplay = '';
            return msg;
        },

        deleteProperties: function (form) {
            for (var key in form) {
                if (form.hasOwnProperty(key)) {
                    if (form['confirm' + key]) {
                        delete form['confirm' + key];
                    }
                    if (form['confirm' + key + '_placeholder']) {
                        delete form['confirm' + key + '_placeholder'];
                    }
                    if (form['confirm' + key + '_error']) {
                        delete form['confirm' + key + '_error'];
                    }
                    if (form[key + '_placeholder']) {
                        delete form[key + '_placeholder'];
                    }
                    if (form[key + '_error']) {
                        delete form[key + '_error'];
                    }
                }
            }

            return form;
        }

    }, {});

    return $Validation;
}));



/*
 * =============================================================
 * elliptical.services.Notify
 * =============================================================
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'),require('elliptical-providers'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc','elliptical-providers'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.services=root.elliptical.services || {};
        root.elliptical.services.Notify=factory(root.elliptical);
        root.returnExports = root.elliptical.services.Notify;
    }
}(this, function (elliptical) {


    var Notify=elliptical.Class.extend({
        '@resource':'Notify', //{String}
        $provider:null,

        show:function(text,params){
            return this.$provider.show(text,params);
        },

        hide:function(){
            return this.$provider.hide();
        },

        visible:function(){
            return this.$provider.visible();
        },

        toggle:function(){
            return this.$provider.toggle();
        }

    },{

        show:function(text,params){
            return this.constructor.show(text,params);
        },

        hide:function(){
            return this.constructor.hide();
        },

        visible:function(){
            return this.constructor.visible();
        },

        toggle:function(){
            return this.constructor.toggle();
        }
    });

    return Notify;



}));


/*
 * =============================================================
 * elliptical.services.Dialog
 * =============================================================
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'),require('elliptical-providers'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc','elliptical-providers'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.services=root.elliptical.services || {};
        root.elliptical.services.Dialog=factory(root.elliptical);
        root.returnExports = root.elliptical.services.Dialog;
    }
}(this, function (elliptical) {


    var Dialog=elliptical.Class.extend({
        '@resource':'Dialog', //{String}
        $provider:null,

        show:function(params){
            return this.$provider.show(params);
        },

        hide:function(){
            return this.$provider.hide();
        },

        setContent:function(params){
            return this.$provider.setContent(params);
        }

    },{
        show:function(params){
            return this.constructor.show(params);
        },

        hide:function(){
            return this.constructor.hide();
        },

        setContent:function(params){
            return this.constructor.setContent(params);
        }

    });

    return Dialog;

}));






/*
 * =============================================================
 * elliptical.services.Store
 * =============================================================
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.services=root.elliptical.services || {};
        root.elliptical.services.Store=factory(root.elliptical);
        root.returnExports = root.elliptical.services.Store;
    }
}(this, function (elliptical) {

    var Store;
    Store=elliptical.Class.extend({
        '@resource':null,
        $provider:null,

        get:function(key){
            return this.$provider.get(key);
        },

        set:function(key,value,params){
            return this.$provider.set(key,value,params);
        },

        delete:function(key){
            return this.$provider.delete(key);
        },

        clear:function(){
            return this.$provider.clear();
        }
    },{
        get:function(key){
            return this.constructor.get(key);
        },

        set:function(key,value,params){
            return this.constructor.set(key,value,params);
        },

        delete:function(key){
            return this.constructor.delete(key);
        },

        clear:function(){
            return this.constructor.clear();
        }
    });

    return Store;

}));

/*
 * =============================================================
 * elliptical.services.Validation
 * =============================================================
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'),require('elliptical-providers'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc','elliptical-providers'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.services=root.elliptical.services || {};
        root.elliptical.services.Validation=factory(root.elliptical,root.elliptical.providers);
        root.returnExports = root.elliptical.services.Validation;
    }
}(this, function (elliptical,providers) {
    var $Validation=providers.$Validation;

    var Validation=elliptical.Service.extend({
        '@resource':'Validation', //{String},
        $provider:$Validation,
        schemas:null,

        /**
         *
         * @param data {Object}
         * @param name {String}
         * @param callback {Function}
         */
        post: function (data, name, callback) {
            if (this.schemas && !this.$provider.schemas) {
                this.$provider.schemas = this.schemas;
            }
            this.$provider.post(data,name,callback);
        },

        put: function (data, name, callback) {
            if (this.schemas && !this.$provider.schemas) {
                this.$provider.schemas = this.schemas;
            }
            this.$provider.put(data, name, callback);
        },

        /**
         *
         * @param data {Object}
         * @returns {Object}
         */
        onSuccess:function(data){
            return this.$provider.onSuccess(data);
        },

        /**
         *
         * @param data {Object}
         * @param msg {String}
         * @returns {Object}
         */
        onError:function(data,msg){
            return this.$provider.onError(data,msg);
        }



    }, {
        init: function ($provider) {
            ($provider !== undefined) ? this.$provider = $provider : this.$provider = null;

        },

        post: function (data, name, callback) {
            var $provider = (this.$provider) ? this.$provider : this.constructor.$provider;
            if (this.schemas && !this.$provider.schemas) {
                $provider.schemas = this.schemas;
            }
            $provider.post(data, name, callback);
        },

        put: function (data, name, callback) {
            var $provider = (this.$provider) ? this.$provider : this.constructor.$provider;
            if (this.schemas && !$provider.schemas) {
                $provider.schemas = this.schemas;
            }
            $provider.put(data, name, callback);
        },

        /**
        *
        * @param data {Object}
        * @returns {Object}
        */
        onSuccess: function (data) {
            var $provider = (this.$provider) ? this.$provider : this.constructor.$provider;
            return $provider.onSuccess(data);
        },

        /**
         *
         * @param data {Object}
         * @param msg {String}
         * @returns {Object}
         */
        onError: function (data, msg) {
            var $provider = (this.$provider) ? this.$provider : this.constructor.$provider;
            return $provider.onError(data, msg);
        }

    });

    return Validation;



}));





/*
 * =============================================================
 * elliptical.Delegate
 * =============================================================
 *
 * dependencies:
 *
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'),require('elliptical-event'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc','elliptical-event'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.Delegate = factory(root.elliptical,root.elliptical.Event);
        root.returnExports = root.elliptical.Delegate;
    }
}(this, function (elliptical,Event) {

    var Delegate;
    Delegate = elliptical.Class.extend({
        bindings: null,

        init: function (bindings) {
            this.bindings = bindings;

        },

        on: function () {
            var bindings = this.bindings;
            if (bindings && bindings.length) {
                bindings.forEach(function (binding) {
                    var eventName = binding.event;
                    var name = binding.delegate;
                    _bind(eventName, name);
                });
            }

            function _bind(eventName, name) {
                $(document).on(eventName, '[delegate="' + name + '"]', function (event) {
                    if (_validTarget(eventName, 'delegate-target')) {
                        _handleEvent(event);
                    }

                });

                $(document).on(eventName, '[data-delegate="' + name + '"]', function (event) {
                    if (_validTarget(event, 'data-delegate-target')) {
                        _handleEvent(event);
                    }

                });
            }

            function _validTarget(event, attr) {
                if (event.target === event.currentTarget) {
                    return true;
                } else {
                    return ($(event.currentTarget).attr(attr) !== undefined);
                }
            }

            function _handleEvent(event) {
                var target = $(event.currentTarget);
                var evt, channel, camelCase;
                camelCase = false;
                if (target.attr('event')) {
                    evt = target.attr('event');
                } else {
                    evt = target.attr('data-event');
                }
                if (target.attr('channel')) {
                    channel = target.attr('channel');
                } else {
                    channel = target.attr('data-channel');
                }
                if (target.attr('camel-case')) {
                    camelCase = target.attr('camel-case');
                } else if (target.attr('data-camel-case')) {
                    camelCase = target.attr('data-camel-case');
                }

                /* pass the element attributes as the event data */
                var opts = $.element.getOpts(target[0], camelCase);
                //delete props channel and delegate-event
                if (opts.channel) {
                    delete opts.channel;
                }
                if (opts.event) {
                    delete opts.event;
                }
                if (opts.delegate) {
                    delete opts.delegate;
                }
                if (opts.camelCase) {
                    delete opts.camelCase;
                }

                opts.target = target[0];
                if (typeof channel !== 'undefined' && evt !== 'sync') {
                    Event.emit(channel + '.' + evt, opts);
                }
            }
        },

        off: function () {
            var bindings = this.bindings;
            if (bindings && bindings.length) {
                bindings.forEach(function (binding) {
                    var eventName = binding.event;
                    var name = binding.delegate;
                    _unbind(eventName, name);
                });
            }

            function _unbind(eventName, name) {
                $(document).off(event, '[delegate="' + name + '"]');
                $(document).on(eventName, '[data-delegate="' + name + '"]');
            }
        }

    });

    return Delegate;


}));



/*
 * =============================================================
 * elliptical.delegates.request
 * =============================================================
 * Copyright (c) 2014 S.Francis, MIS Interactive
 * Licensed MIT
 *
 * Dependencies:
 * none
 *
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
        root.elliptical.delegates=root.elliptical.delegates || {};
        root.elliptical.delegates.request=factory();
        root.returnExports =root.elliptical.delegates.request;
    }
}(this, function () {

    return function request(){
        //data-route attr excluded from delegated capture
        $(document).on('touchclick', 'a:not([data-route])', onRequest);

        function onRequest(event) {
            var href = $(event.currentTarget).attr('href');
            if (href !==undefined && href !== '#') {
                event.stopPropagation();
                event.preventDefault();

                //create data object
                var data = {
                    method: 'get',
                    href: href
                };

                /* query attributes and attach to the data objects
                 *
                 */
                $.each(this.attributes, function (i, att) {
                    data[att.name.toCamelCase()] = att.value;
                });
                data.route = href;
                //trigger event
                $(document).trigger('OnDocumentRequest', data);
            }
        }
       
    };

}));


/*
 * =============================================================
 * elliptical.delegates.submit
 * =============================================================
 * Copyright (c) 2014 S.Francis, MIS Interactive
 * Licensed MIT
 *
 * Dependencies:
 * elliptical-document
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-document'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-document'], factory);
    } else {
        // Browser globals (root is window)

        root.elliptical.delegates=root.elliptical.delegates || {};
        root.elliptical.delegates.submit=factory();
        root.returnExports =root.elliptical.delegates.submit;
    }
}(this, function () {

    return function submit(history){
        if(history===undefined){
            history=false;
        }
        //form must have role attribute to be captured
        $(document).on('submit', 'form[role="form"]', onSubmit);

        function onSubmit(event) {
            event.stopPropagation();
            event.preventDefault();
            var body = $(event.currentTarget).document();

            //create data object
            var data = {
                route: this.action,
                body: body,
                method: $(this).attr('method'),
                element: this
            };

            if (history) {
                $(document).trigger('OnDocumentRequest', data);
            } else {
                $(document).trigger('OnDocumentSubmit', data);
            }
        }

    };

}));



/*
 * =============================================================
 * elliptical.Request
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-mvc'),require('elliptical-router'),require('elliptical-services'),
            require('elliptical-utils'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc','elliptical-router','elliptical-services','elliptical-utils'], factory);
    } else {
        //browser

        root.elliptical.Request=factory(root.elliptical,root.elliptical.Router,root.elliptical.services,root.elliptical.utils,root.elliptical.providers);
        root.returnExports = root.elliptical.Request;
    }
}(this, function (elliptical,Router,services,utils,providers) {
    var Class=elliptical.Class;
    var Location=Router.Location;
    var _=utils._;
    var url_=Location.url;
    var $Cookie=providers.$Cookie;
    var $Session=providers.$Session;

    var Request;
    Request = Class.extend({}, {
        init: function () {

            this.params = {};
            this.query = {};
            this.body = {};
            this.route = {};
            this.files = {};


            Object.defineProperties(this, {
                'path': {
                    get: function () {

                        return Location.path;
                    },
                    configurable: false
                },

                'url': {
                    get: function () {

                        return Location.href;
                    },
                    configurable: false
                },

                'protocol': {
                    get: function () {
                        var protocol = Location.protocol;
                        protocol = protocol.replace(':', '');
                        return protocol;
                    },
                    configurable: false
                },

                'get': {
                    get: function (field) {
                        console.log('warning: "get" not implemented on the browser.');
                        return false;
                    },
                    configurable: false
                },

                'accepted': {
                    get: function () {
                        console.log('warning: "accepted" not implemented on the browser.');
                        return false;
                    },
                    configurable: false
                },

                'accepts': {
                    get: function () {
                        console.log('warning: "accepts" not implemented on the browser.');
                        return false;
                    },
                    configurable: false
                },

                'is': {
                    get: function () {
                        console.log('warning: "is" not implemented on the browser.');
                        return false;
                    },
                    configurable: false
                },

                'xhr': {
                    get: function () {
                        return true;
                    },
                    configurable: false
                },

                'acceptsLanguage': {
                    get: function (lang) {
                        console.log('warning: "acceptsLanguage" not implemented on the browser.');
                        return false;
                    },
                    configurable: false
                },

                'acceptsCharset': {
                    get: function (charset) {
                        console.log('warning: "acceptsLanguage" not implemented on the browser.');
                        return false;
                    },
                    configurable: false
                },

                'acceptsCharsets': {
                    get: function () {

                        return false;
                    },
                    configurable: false
                },

                'acceptedLanguages': {
                    get: function () {

                        return false;
                    },
                    configurable: false
                },

                'originalUrl': {
                    get: function () {

                        return false;
                    },
                    configurable: false
                },

                'subdomains': {
                    get: function () {

                        return false;
                    },
                    configurable: false
                },

                'secure': {
                    get: function () {

                        return false;
                    },
                    configurable: false
                },

                'stale': {
                    get: function () {
                        console.log('warning: "stale" not implemented on the browser.');
                        return false;
                    },
                    configurable: false
                },

                'fresh': {
                    get: function () {
                        console.log('warning: "fresh" not implemented on the browser.');
                        return false;
                    },
                    configurable: false
                },

                'host': {
                    get: function () {
                        return window.location.hostname;

                    },
                    configurable: false
                },

                'ip': {
                    get: function () {


                    },
                    configurable: false
                },

                'ips': {
                    get: function () {
                        console.log('warning: "ips" not implemented on the browser.');
                        return false;
                    },
                    configurable: false
                },

                'cookies': {
                    get: function (name) {
                       return $Cookie.get(name);
                    },
                    configurable: false
                },

                'signedCookies': {
                    get: function () {

                        return {};
                    },
                    configurable: false
                },

                'session': {
                    get: function (name) {
                        return $Session.get(name);
                    }
                }
            });
            this._parsedUrl = {};
            this._parsedUrl.pathname = Location.path;
            this._parsedUrl.virtualize = function (url) {
                var hashTag = window.elliptical.$hashTag;
                var virtualRoot = window.elliptical.$virtualRoot;

                if (hashTag) {
                    url = url_.hashTagFormat(url);
                }

                url = url_.pathComponent(url);
                return url;
            };
            this.header = function (key) {
                switch (key) {
                    case 'Referer':
                        return document.referrer;
                        break;
                }
            };
        }
    });

    return Request;

}));


/*
 * =============================================================
 * elliptical.Response
 * =============================================================
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'),require('elliptical-mvc'),require('elliptical-services'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils','elliptical-mvc','elliptical-services'], factory);
    } else {
        //browser
        root.elliptical.Response=factory(root.elliptical.utils,root.elliptical,root.elliptical.Router,root.elliptical.providers);
        root.returnExports = root.elliptical.Response;
    }
}(this, function (utils,elliptical,Router,providers) {
    var Location=Router.Location;
    var $Cookie=providers.$Cookie;
    var $Session=providers.$Session;
    var Class=elliptical.Class;

    var Response;
    Response = Class.extend({
        req: {}


    }, {
        init: function (req) {
            this.req = req;
            this.charset = {};
            this.context = {};
            this.transition = {};
            this.locals = {};
            this.status = function (value) {

            };
            this.set = function (field, value) {

            };
            this.get = function (field) {

            };
            this.cookie = function (name, value, options) {
                $Cookie.set(name,value,options);
            };
            this.clearCookie = function (name, options) {
                $Cookie.delete(name);
            };

            this.redirect = function (status, url) {
                if (typeof url === 'undefined') {
                    url = status;
                }
                url = decodeURIComponent(url);
                Location.redirect(url);

            };

            this.session=function(name,value){
                $Session.set(name,value);
            };

            this.location = function (path) {

            };
            this.send = function (status, body) {

            };
            this.json = function (status, body) {

            };
            this.jsonp = function (status, body) {

            };
            this.type = function (type) {

            };
            this.format = function (obj) {

            };
            this.attachment = function (filename) {

            };
            this.sendfile = function (path, options, fn) {

            };
            this.download = function (path, options, fn) {

            };
            this.links = function (links) {

            };

        },

        /**
           @param {object} context
           @param {string} template
           @param {object} params - props: append,selector,transition
           @param {function} callback
        */
        render: function (context,template,params, callback) {
            // support 0-4 args
            var req = this.req;
            var template_ = undefined, context_ = undefined, transition_ = undefined,params_=null, callback_ = null;
            var length = arguments.length;

            ///length==0
            if(length===0){
                template_ = {name: req.__name, view: req.__action};
                context_={};
            }

            ///length==1
            if (length === 1) if (typeof context === 'string') {
                template_=context;
                context_ = {};
            } else if (context instanceof Function) {
                callback_ = context;
                template_ = {name: req.__name, view: req.__action};
                context_ = {};
            } else {
                template_ = { name: req.__name, view: req.__action };
                context_ = context;
            }

            ///length==2
            if(length==2){
                if(typeof context==='object'){
                    context_=context;
                    if(typeof template==='string' || template===null){
                        template_=template;
                    }else if(template instanceof Function){
                        callback_=template;
                        template_ = { name: req.__name, view: req.__action };
                    }else{
                        params_=template;
                        template_ = { name: req.__name, view: req.__action };
                    }
                } else {
                    context_ = {};
                    template_=context;
                    if(template instanceof Function){
                        callback_=template;
                    }else{
                        params_=template;
                    }
                }
            }

          ///length==3
            if (length == 3) {
                if (typeof context === 'object') {
                    context_ = context;
                    if (typeof template === 'string' || template==null) {
                        template_ = template;
                        if (params instanceof Function) {
                            callback_ = params;
                        } else {
                            params_ = params;
                        }
                    } else {
                        template_ = { name: req.__name, view: req.__action };
                        params_ = template;
                        callback_ = params;
                    }
                } else {
                    context_ = {};
                    template_ = context;
                    callback_ = params;
                    params_ = template;
                }
            }

            ///length==4
            if(length===4){
                template_=template;
                context_ = context;
                params_ = params;
                callback_ = callback;
            }

            if(length > 4){
                throw "View render does not support more than 4 parameters"
            }

            ///if template has been set to null, reset it to the default controller name/action
            if (!template_) {
                template_ = { name: req.__name, view: req.__action };
            }
            if (!callback_ instanceof Function) {
                callback_ = null;
            }
            this.app.render(context_, template_,params_, req, callback_);
        },

        /**
         * merge a context with req.session.context
         * @param context {Object}
         * @public
         */
        setContext: function (context) {
            var _ = utils._;
            var req = this.req;
            req.session = req.session || {};
            _.merge(req.session, context);
        },

        /**
         * bind new instance of app.contextHelpers() to response
         * @returns {Object}
         */
        contextHelpers: function () {
            var req = this.req;
            var app = req.app;
            return new app.contextHelpers();
        },

        formContext: function () {
            return {
                submitLabel: {
                    css: "",
                    cssDisplay: "",
                    message: "&nbsp;"
                }
            }
        },

        /**
         * convenience method to execute function or next() based on error object
         * @param err {Object}
         * @param next {Function}
         * @param fn {Function}
         * @public
         */
        dispatch: function (err, next, fn) {
            if (!err) {
                fn.apply(this, arguments);
            } else {
                next(err);
            }
        }


    });

    return Response;

}));


/*
 * =============================================================
 * elliptical.application
 * =============================================================
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'),require('elliptical-mvc'),require('elliptical-event'),require('elliptical-providers'),
            require('./request'),require('./response'),require('elliptical-router'),require('./delegates/index'),require('elliptical-delegate'),
            require('elliptical-platform'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils','elliptical-mvc','elliptical-event','elliptical-providers',
            './request','./response','elliptical-router','./delegates/index','elliptical-delegate',
            'elliptical-platform'], factory);
    } else {
        //browser

        root.elliptical.application=factory(root.elliptical.utils,root.elliptical,root.elliptical.Event,
            root.elliptical.providers,root.elliptical.Request,root.elliptical.Response,root.elliptical.Router,root.elliptical.delegates,root.elliptical.Delegate);
        root.returnExports = root.elliptical.browser;
    }
}(this, function (utils,elliptical,Event,providers,Request,Response,Router,delegates,Delegate) {
    var _=utils._,
        Transitions=providers.$Transitions,
        url_=Router.Location.url;
        var Container=elliptical.Container;



    return {
        /**
         * app init
         * @internal
         *
         */
        init:function(){
            window.elliptical.$hashTag=false;
            this.history=false;
            this.sessionSync=false;
            this.__observables=[];
            this.async=elliptical.async;
            this.factory=elliptical.factory;
            this.contextSettings();
            this.setEnvironment();
            this.$setDefaultProviders();
            this.cache = {};
            /* define middleware stack */
            this.stack=[];
            /* init locations */
            this.locations=[];
            this.Router=Router;
            this.utils=utils;
            this._defineProps();

            /* define a 'click' delegate */
            var delegate_=new Delegate([{event:'touchclick',delegate:'click'}]);
            delegate_.on();
            /* init the middleware stack */
            initStack(this);

            function initStack(app){
                /* monkey patch support for Function.name(IE) */
                utils.patchFunctionName();

                app.router = function appRouter() {
                    app.next();
                };
                /* use __name property to identify appRouter. Function.name is unreliable under minification */
                app.router.__name='appRouter';
                var route = '/';
                var fn = app.router;
                app.stack.push({route: route, handle: fn});

            }

        },

        _defineProps:function(){
            /* getters/setters props */
            this._debug=false;
            this._virtualRoot='/';
            this._hashTag=false;
            this.settings.siteTitle='';
            var app_=this;

            Object.defineProperties(this, {
                'debug': {
                    get:function(){
                        return app_._debug;
                    },

                    set: function (val) {
                        Router.debug=val;
                        app_._debug=val;
                    }
                },

                'hashTag': {
                    get:function(){
                        return app_._hashTag;
                    },

                    set: function (val) {
                        Router.hashTag=val;
                        app_._hashTag=val;
                        window.elliptical.$hashTag=val;
                    }
                },

                'virtualRoot':{
                    get:function(){
                        return app_._virtualRoot;
                    },

                    set: function (val) {
                        Router.virtualRoot=val;
                        app_._virtualRoot=val;
                        app_.context.rootPath=val;
                        window.elliptical.$virtualRoot=val;
                    }
                },

                'siteRootTitle':{
                    get:function(){
                        return app_.settings.siteTitle;
                    },

                    set: function (val) {
                        app_.settings.siteTitle=val;
                    }
                }
            });
        },

        Location:function(params){
            if(params.history){
                this._setLocationHistoryService();
            }

            return Router.Location;
        },

        $setDefaultProviders:function(){
            //set the default Model provider
            var Service=elliptical.Service;
            //pagination provider
            Service.$paginationProvider=providers.$Pagination;
            //set the view provider to the template provider
            elliptical.View.$provider=providers.$Template;
        },


        /**
         * sets the environment (production or dev)
         * @param env {String}
         * @returns {String}
         * @public
         */
        setEnvironment:function(env){
            if(typeof env !== 'undefined'){
                this.context.ENV=env.toLowerCase();
            }else{
                if(!setFromDocumentQuery(this)){
                    setFromLocationQuery(this);
                }
            }

            function setFromDocumentQuery(c){
                var html=$('html');
                var dataEnv=html.attr('data-environment');
                if(typeof dataEnv !== 'undefined'){
                    c.context.ENV=dataEnv.toLowerCase();
                    return true;
                }else{
                    return false;
                }
            }

            function setFromLocationQuery(c){
                var hostname=document.location.hostname;
                c.context.ENV=(utils.isLocalHost(hostname)) ? 'development' : 'production';
            }
        },

        getPort:function(){
            return undefined;
        },


        /**
         * returns the environment(production or dev)
         * @returns {String}
         * @public
         */
        getEnvironment:function(){
            return this.context.ENV;
        },

        /**
         * configure
         * @param mode {String}
         * @param fn {Function}
         * @public
         */
        configure:function(mode,fn){
            if(typeof mode==='function'){
                fn=mode;
                fn.call(this);
            }else if(typeof mode==='string'){
                if(mode.toLowerCase()==='production' && this.context.ENV==='production'){
                    fn.call(this);
                }else if(mode.toLowerCase()==='development' && this.context.ENV==='development'){
                    fn.call(this);
                }
            }
        },


        /**
         * SERVER ONLY
         * returns a configuration object from config.json
         */
        config:function(){
            //ignore
        },




        /**
         *  **History Enabled Only**
         *
         * maps to Router.get
         * @param route {String}
         * @param callbacks {Function}
         * @public
         */
        get:function(route,callbacks){
            Router.get(route,callbacks);
        },


        /**
         *  **History Enabled Only**
         *
         * maps to Router.post
         * @param route {String}
         * @param callbacks {Function}
         * @public
         */
        post:function(route,callbacks){
            Router.post(route,callbacks);
        },


        /**
         *  **History Enabled Only**
         *
         * maps to Router.put
         * @param route {String}
         * @param callbacks {Function}
         * @public
         */
        put:function(route,callbacks){
            Router.put(route,callbacks);
        },


        /**
         *  **History Enabled Only**
         *
         * maps to Router.delete
         * @param route {String}
         * @param callbacks {Function}
         * @public
         */

        delete:function(route,callbacks){
            Router.delete(route,callbacks);
        },


        /**
         *  **History Enabled Only**
         *
         * @returns {Object}
         * @public
         */
        contextHelpers:function(){
            this.form=function(){
                return {
                    submitLabel:{
                        cssDisplay:'hidden',
                        message:'&nbsp;'
                    }
                }
            };
        },


        /**
         *
         *
         * context settings
         * @returns void
         * @public
         */
        contextSettings: function(){
            /* init app.context merged with template context for every route */
            this.context={};
            this.context.virtualRoot='/';

            /* this is a browser app */
            this.isServer=false;
            this.isBrowser=true;


            /* create an empty config object on app.settings */
            this.settings=this.settings || {};
            this.settings.config={
                cookie:{},
                session:{},
                providers:{}
            };
        },



        /**
         * BROWSER ONLY
         * appends template scripts tag to the document
         * @params rootPath {String}
         */
        templatesScriptLoader: function(rootPath){
            var root=this.virtualRoot;
            if(typeof rootPath !== 'undefined'){
                root=rootPath;
            }
            if(root==='/'){
                root='';
            }
            window.onload=function(){
                var script = document.createElement("script");
                script.src = root + "/scripts/templates.js";
                document.body.appendChild(script);
            };
        },

        /**
         *  **History Enabled Only**
         *
         * add an acl to a root path
         * @param path {String}
         * @param excludeArray {Array}
         * @returns void
         * @public
         */
        location: function(path,excludeArray){
            /* path must have leading slash */
            if (path.substring(0, 1) != '/') {
                path = '/' + path;
            }

            if(typeof excludeArray !== 'object'){
                excludeArray=[];
            }

            var access={
                path:path,
                exclude:excludeArray
            };

            this.locations.push(access);
        },

        /**
         *
         * @param url {String}
         * @returns {String}
         */
        parseRoute:function(url){
            return (this.hashTag) ? url_.hashTagFormat(url) : url;
        },


        /**
         *  **History Enabled Only**
         *
         *  subscriber to the Router dispatch emitted event
         */
        onDispatchRequest:function(){
            var self=this;
            Event.on('OnRouteDispatch',function(data){
                //dispatch, unless
                if(!(self.__cancelledRoute && self.__route===data.route)){
                    var route=data.route;
                    var handlers=data.handlers;
                    self.dispatch(route,handlers);
                }else{
                    self.__cancelledRoute=false;
                    self.__route=null;
                }

            });

        },

        /**
         *   **History Enabled Only**
         *   One Exception: setting the rootPath
         *
         * adds a function to the middleware stack
         *
         * @param route {String}
         * @param fn {Function}
         * @returns void
         * @public
         */
        use:function (route,fn){
            var stack = this.stack;
            if ('string' != typeof route) {
                fn = route;
                route = '/';
            }

            if (typeof fn != 'function') {
                //set the root path
                this.virtualRoot=route;
                return; //if not a function, exit
            }

            /* check if handler is appRouter */
            if (fn.__name && fn.__name === this.router.__name) {
                /* if so, delete the current app.router position in the stack */
                for (var i = 0; i < stack.length; i++) {
                    var handle = stack[i].handle;
                    if (handle.__name && handle.__name === this.router.__name || handle.length === 0) {
                        stack.splice(i, 1);
                        break;
                    }
                }
            }

            try {
                if (fn.length === 0 && fn.__name===undefined) {
                    return;
                }
            } catch (ex) {

            }
            //push the handler onto the middleware stack
            stack.push({route: route, handle: fn});
        },

        /**
         *  **History Enabled Only**
         *
         *  dispatches the callbacks for a route
         * @param route {String}
         * @param handlers {Array}
         * @returns void
         * @public
         */
        dispatch:function(route, handlers){
            route = _checkRoute(route);
            var stack = this.stack;

            /* build the middleware stack for this route */
            var thisCallStack = [];
            for (var i = 0; i < stack.length; i++) {
                var handle = stack[i].handle;
                if (handle.__name && handle.__name === this.router.__name) {
                    //push the route callbacks onto the stack at this position
                    for (var j = 0; j < handlers.length; j++) {
                        thisCallStack.push(handlers[j]);
                    }
                } else {
                    var rte = stack[i].route;
                    var index = route.toLowerCase().indexOf(rte);
                    if ((index > -1) && (route.length === rte.length || route.substring(index + 1, 0) === '/')) {
                        thisCallStack.push(stack[i].handle);
                    }
                }
            }

            /* instantiate request,response objects */
            _closeObservables(this);
            var req = new Request();
            req.route=route;
            var res = new Response(req);
            var app_=this;
            req.app=res.app=app_;
            req.res=res;
            res.req=req;

            /* if history, redefine res.redirect */
            if(this.history){
                res.redirect=function(route){
                    Router.location(route,'get',null);
                };
            }

            /* run the stack of callbacks */
            _callStack(thisCallStack, req, res);


            /**
             *
             * @param route
             * @returns {String}
             * @private
             */
            function _checkRoute(route) {
                if (route.substring(0, 1) != '/') {
                    route = '/' + route;
                }
                return route;
            }


            /**
             * executes the middleware stack
             * @param stack {Array}
             * @param req {Object}
             * @param res {Object}
             * @private
             */
            function _callStack(stack, req, res) {
                var i = 0;

                function next(err) {
                    var fn = stack[i++];

                    if (typeof fn === 'undefined') {
                        return;
                    }

                    if (typeof err != 'undefined') {
                        if (fn.length === 4) {
                            req=_applyFnProps(req,fn);
                            res=_applyFnProps(res,fn);
                            fn(err, req, res, next);
                        } else {
                            next(err);
                        }
                    } else {
                        if (fn.length < 4) {
                            req=_applyFnProps(req,fn);
                            res=_applyFnProps(res,fn);
                            fn(req, res, next);
                        } else {
                            next();
                        }
                    }
                }
                app_.next=next; /* next() is mangled under minification, so preserve the name by attaching it as a prop  */
                next();
            }

            function _closeObservables(app){
                var arr=app.__observables;
                arr.forEach(function(o){
                    o.close();
                })
            }
            function _applyFnProps(obj,f){
                obj.__name=f.__name;
                obj.__action=f.__action;
                return obj;
            }
        },

        closeObservables:function(){
            var arr=this.__observables;
            arr.forEach(function(o){
                o.close();
            })
        },

        /**
         * SERVER ONLY
         * server-side execution of a function
         * @param fn {Function}
         */
        server:function(fn){
            //ignore
        },

        /**
         * BROWSER ONLY
         * client-side execution of a function
         * @param fn {Function}
         */
        browser:function(fn){
            fn.call(this);
        },

        /**
         * SERVER ONLY
         * convenience method to set standard middleware,cookies and session
         * @param params
         * @param $provider
         */
        defaultMiddleware: function (params,$provider) {
            //ignore
        },


        /**
         * SERVER ONLY
         * execute bootstrap functions on server start-up
         * @param stack {Array}(of Functions)
         * @param server {Object}
         * @param fn {Function} Callback
         */
        bootstrap: function (stack, server, fn) {
            //ignore
        },

        /**
         * executes document listeners, if applicable, then executes user provided function
         * @param history {Boolean}
         * @param formsHistory {Boolean}
         * @param fn {Function}
         */
        listen:function(history,formsHistory,fn){
            var app_=this;
            var env=this.getEnvironment();
            var func=null;
            var length=arguments.length;
            //support 0-3 params
            if(length===0){
                /* form actions */
                delegates.submit();
            }
            if(length===1)if (typeof history === 'function') {
                func = history;
                /* form actions */
                delegates.submit();
            } else {
                if (history) {
                    start(false,false); //history for http get only, event capture for forms
                }
            }
            if(length===2)if (typeof formsHistory === 'function') {
                func = formsHistory;
                start(false,false);
            } else {
                if (history && formsHistory) {
                    start(true,false);//history for all http actions
                } else if (history) {
                    start(false,false); //history for http get only, event capture for forms
                }
            }

            if(length===3){
                func=fn;
                if(history && formsHistory){
                    start(true,false);//history for all http actions
                }else if(history){
                    start(false,false); //history for http get only, event capture for forms
                }
            }

            if(func){
                $(function(){
                    setTimeout(function(){
                        func.call(app_);
                    },500);
                });
            }

            app_.start = function () {
                start(false, true);
            };

            function start(formHistory,ignoreSubmit){
                //form actions
                if (!ignoreSubmit) {
                    delegates.submit(formHistory);
                }
               
                //http get requests
                delegates.request();

                /* subscribe to the router dispatch event */
                app_.onDispatchRequest();
                /* replace Location redirect,reload functions */
                app_._setLocationHistoryService();

                if(env==='production'){
                    Router.debug=false;
                }
                Router.start();

                //setup convenient callback for history that allows for DI
                app_.history=function(fn){
                    document.addEventListener('OnDocumentHistory', function (event) {
                        var data=event.detail;
                        fn.call(app_,data,app_.container);
                    });
                }
            }


        },

        _setLocationHistoryService:function(){
            this.history=true;
            Router.Location.redirect=function(route){
                Router.location(route,'get',null);
            };

            Router.Location.reload=function(){
                var route=Location.path;
                Router.location(route,'get');
            };
        },


        /**
         *  **History Enabled Only**
         *
         * define a onBeforeRender hook
         * @param fn {Function}
         * @public
         */
        onBeforeRender:function(fn){
            if(typeof fn==='function'){
                this.viewCallback=fn;
            }
        },

        /**
         *  **History Enabled Only**
         *
         * render view 
         * @param {object} context
         * @param {string|object} template
         * @param {object} params
         * @param {object} req
         * @param {function} callback
         * @public
         */
        render:function(context,template,params,req,callback){
            context = context || {};
            var app = this;
            var transition = null, selector = null, append = false,delay=null;
            if (params && params !== undefined) {
                transition = params.transition;
                selector = params.selector;
                append = params.append;
                delay = params.delay;
            }

            //instantiate the view object
            var View=elliptical.View;
            var view = new View();

            try{
                //merge context with app.context
                _.merge(context,app.context);

                //extend context with req.session

                if(req.session){
                    _.defaults(context,req.session);
                }
            }catch(ex){

            }

            context=setPageTitle(context,app);

            //reset root path, if default
            if(context.rootPath && context.rootPath==='/'){
                context.rootPath='';
            }

            //if no selector passes, get if from the View constructor
            if (!selector || selector === undefined) {
                selector = View.selector;
            }
           
            var intDelay = (delay && delay !== undefined) ? parseInt(delay) : 0;
            
            //render...if onBeforeRender hook is defined, pass to it before rendering the view
            if(typeof app.viewCallback !='undefined'){
                app.viewCallback(req,this,context,function(data){
                    setTimeout(function () {
                        _render(data);
                    },intDelay)
                });
            }else{
                setTimeout(function () {
                    _render(context);
                },intDelay)
            }

            //private dry function encapsulation of view render method
            function _render(cxt){
                //set browser context
                var clientNamespace=View.clientContextRootNamespace;
                (View.pushContextToClient) ? setClientContext(clientNamespace, cxt) : setClientContext(clientNamespace, '');
                var element_ = $(selector);
                view.render(template, cxt, function (err, out) {
                    if (append) {
                        var doc = $.parseHTML(out, document, true);
                        element_.append(doc);
                        if (callback && callback instanceof Function) {
                            callback(null, out);
                        }
                    } else if(transition && transition !==undefined) {
                        view.transition(selector, out, params, callback);
                    }else{
                        element_.html(out);
                        if (callback && callback instanceof Function) {
                            callback.call(this);
                        }
                    }
                });
            }

            // provide the context to the browser consistent with the server-side rendering method from elliptical.server
            function setClientContext(namespace,context){
                //TODO delete the script object, if exists

                if(window[namespace] && window[namespace].elliptical && window[namespace].elliptical.context) {
                    window[namespace].elliptical.context = context;
                }else if(window[namespace]){
                    window[namespace].elliptical={};
                    window[namespace].elliptical.context=context;
                }else{
                    window[namespace]={};
                    window[namespace].elliptical={};
                    window[namespace].elliptical.context=context;
                }
            }
            function setPageTitle(context,app){
                if(context.PageTitle){
                    if(app.settings.siteTitle){
                        context.PageTitle=app.settings.siteTitle + '-' + context.PageTitle;
                    }

                }else{
                    if(app.settings.siteTitle){
                        context.PageTitle=app.settings.siteTitle;
                    }
                }

                return context;
            }
        },

        //app DI container
        container:Container
    }

}));


/*
 * =============================================================
 * elliptical.browser
 * =============================================================
 *
 *
 *
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'),require('elliptical-mvc'),require('elliptical-event'),require('elliptical-middleware'),
            require('elliptical-providers'),require('elliptical-services'),require('elliptical-http'),require('elliptical-crypto'),
            require('./application'),require('./response'),require('./request'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils','elliptical-mvc','elliptical-event','elliptical-middleware','elliptical-providers','elliptical-services',
            'elliptical-http','elliptical-crypto','./application','./response','./request'], factory);
    } else {
        //browser
        root.elliptical.browser=factory(root.elliptical.utils,root.elliptical,root.elliptical.Event,root.elliptical.middleware,root.elliptical.providers,
            root.elliptical.services,root.elliptical.http,root.elliptical.crypto,root.elliptical.application,root.elliptical.Response,root.elliptical.Request);
        root.returnExports = root.elliptical.browser;
    }
}(this, function (utils,elliptical,Event,middleware,providers,services,http,crypto,application,Response,Request) {




    var _ = utils._;
    elliptical.Event=Event;
    elliptical.application=application;
    elliptical.Response=Response;
    elliptical.Request=Request;
    elliptical.http=http;
    elliptical.providers=providers;
    elliptical.services=services;
    elliptical.crypto = crypto;


    /* expose a try...catch  facade */
    elliptical.Try=function(next,fn){
        try{
            fn.apply(this,arguments);
        }catch(ex){
            next(ex);
        }
    };



    /**
     * Expose createApplication().
     */
    var exports_ = createApplication;


    /**
     * @return {Function}
     * @public
     */
    function createApplication() {
        /* create the browser app */
        var app=function(){};

        /* expose application object */
        _.defaults(app, application);

        /* init */
        app.init();

        return app;
    }


    /* expose elliptical */
    _.defaults(exports_, elliptical);

    /* expose elliptical middleware */
    _.defaults(exports_, middleware);

    /* expose elliptical services */
    _.defaults(exports_, services);

    window.elliptical=exports_;
    window.elliptical.$virtualRoot='/';

    return exports_;

}));



///elliptical.binding
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical=root.elliptical || {};
        root.elliptical.binding=factory(root.elliptical.utils);
        root.returnExports =root.elliptical.binding;
    }
}(this, function (utils) {

    var BINDING_ACTIVE=false;
    var BINDINGS=[];
    var BINDING_CONTEXTS=[];

    //use mutation summary to setup and tear down bindings. In a SPA, event handlers on a element passed into a binding(which is a closure)
    //is classic memory leak. So, we keep a log of the bindings and when the element is removed from the DOM, null the closure
    function bindingMutationListener(){

        $(document).on('OnDocumentMutation',function(event,summary){
            if(summary.added){
                testForBindings(summary.added);
            }
            if(summary.removed){
                destroyBindings(summary.removed);
            }
        });

    }
    //handle initial onload
    $(function(){
        var added=document.querySelectorAll('[ea]');
        if(added.length){
            testForBindings(added);
        }
    });

    function Binding(val,fn) {
        var self=this;
        if(!BINDING_ACTIVE){
            BINDING_CONTEXTS.push({val:val,fn:fn,context:this});
            bindingMutationListener();
            BINDING_ACTIVE=true;
        }else{
            BINDING_CONTEXTS.push({val:val,fn:fn,context:this});
        }
        this.jsonParseMessage = function (obj) {
            try {
                var msgObj = JSON.parse(obj);
                if (msgObj.message) {
                    return msgObj.message;
                } else {
                    return obj;
                }
            } catch (ex) {
                return obj;
            }
        };

        this.render = function (element,template, context, callback) {
            window.dust.render(template, context, function (err, out) {
                if (!err) {
                    element.html(out);
                }
               
                if (callback) {
                    callback(err, out);
                }
            });
        };

        this.click='touchclick';

        this._events=[];

        this.onDestroy=function(){};

        this.event=function(element, event, selector,callback) {
            var obj = {};
            obj.element = element;
            obj.event = event;

            //support 3-4 params
            var length=arguments.length;
            if(length===3){
                callback=(typeof selector==='function') ? selector : null;
                selector=null;
            }
            obj.selector=selector;
            obj.callback=callback;
            var arr = this._events;
            if ($.inArray(obj, arr) === -1) {
                this._events.push(obj);
            }
            if(selector){
                element.on(event,selector,function(){
                    var args = [].slice.call(arguments);
                    if(callback){
                        callback.apply(this,args);
                    }
                });
            }else{
                element.on(event,function(){
                    var args = [].slice.call(arguments);
                    if(callback){
                        callback.apply(this,args);
                    }
                });
            }

        };

        this.unbindEvents=function () {

            var events=this._events;
            var length=events.length;
            for(var i=0;i<length;i++){
                var obj=events[i];
                (obj.selector) ? obj.element.off(obj.event,obj.selector) : obj.element.off(obj.event);
            }
            events.length=0;
        }
    }

    function testForBindings(added){
        var contexts=BINDING_CONTEXTS;
        contexts.forEach(function(obj){
            var results=$(added).selfFind('[ea="' + obj.val + '"]');
            if(results[0]){
                $.each(results,function(index,result){
                    BINDINGS.push({node:result,context:obj.context,val:obj.val,fn:obj.fn});
                    initBinding(obj.context,result,obj.val,obj.fn,obj.id=utils.randomString(8));
                });
            }
        });
    }


    function initBinding(context,node,val,fn){
        setTimeout(function(){
            fn.call(context,node);
        },500);
    }


    function destroyBindings(removed){
        var result=$(removed).selfFind('[ea]');
        if(result.length && result.length > 0){
            $.each(result,function(index,obj){
                destroyBinding(obj);
            });
        }
    }

    function destroyBinding(node){
        var contexts=BINDINGS;
        var index=0;
        contexts.forEach(function(obj){
            if(obj.node===node){
                //clean-up to avoid memory leaks
                obj.context.unbindEvents();
                obj.context.onDestroy();
                obj.context=null;
                if(node && node.parentNode){
                    node.parentNode.removeChild(node);
                }
                obj.fn=null;//null the closure, otherwise any event handlers set on the element==memory leak
                obj.node=null;
                deleteObjFromBindings(index);
                obj=null;
            }
            index++;
        });
    }

    function deleteObjFromBindings(index){
        BINDINGS.splice(index,1);
    }

    var binding=function(val,fn){
        return new Binding(val,fn);
    };


    return binding;

}));












