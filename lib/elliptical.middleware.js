
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

