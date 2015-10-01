
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
            this.isHistory = false;

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

                app_.isHistory = true;
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
                app_.history = function (fn) {
                    var xx = document;
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
                var route=Router.Location.href;
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
    elliptical.Location=elliptical.Router.Location;

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
