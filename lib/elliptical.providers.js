


/*
 * =============================================================
 * elliptical.providers.$OData
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
        root.elliptical.providers = root.elliptical.providers || {};
        root.elliptical.providers.$OData = factory(root.elliptical);
        root.returnExports = root.elliptical.providers.$OData;
    }
}(this, function (elliptical) {

    var $OData;
    $OData = elliptical.Provider.extend({

        filter: function (endpoint, filter) {
            if (typeof filter === 'object') {
                filter = this._getFilterString(filter);
            }
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
        },

        _getFilterString: function (query) {
            /* 
               default:[field] eq [value]

               sw_[field]==startswith
               swl_[field]==startswith, tolower
               swu_[field]==startswith, toupper
               c_[field]==contains
               cl_[field]==contains,tolower
               cu_[field]==contains,toupper
               ew_[field]==endswith
               ewl_[field]==endswith,tolower
               ewu_[field]==endswith,toupper
               eql_[field]==eq, tolower
               equ_[field]==eq,toupper

               examples: sw_Name=Bob ---> startswith(Name,'Bob')
                         Name=Bob --> Name eq 'Bob'
                         cl_Name=B ---> substringof(tolower(Name),tolower('B')) 
            */
            var str = '';
            var checksum = 0;
            for (var key in query) {
                if (query.hasOwnProperty(key)) {
                    var prop;
                    var value = decodeURIComponent(query[key]);
                    if (key.indexOf('sw_') === 0) {
                        prop = key.substring(3);
                        str += (checksum > 0) ? " and startswith(" + prop + ",'" + value + "')" : "startswith(" + prop + ",'" + value + "')";
                        checksum++;
                    } else if (key.indexOf('swl_') === 0) {
                        prop = key.substring(4);
                        str += (checksum > 0) ? " and startswith(tolower(" + prop + "),tolower('" + value + "'))" : "startswith(tolower(" + prop + "),tolower('" + value + "'))";
                        checksum++;
                    }else if(key.indexOf('swu_')===0){
                        prop = key.substring(4);
                        str += (checksum > 0) ? " and startswith(toupper(" + prop + "),toupper('" + value + "'))" : "startswith(toupper(" + prop + "),toupper('" + value + "'))";
                        checksum++;
                    } else if (key.indexOf('c_') === 0) {
                        prop = key.substring(2);
                        str += (checksum > 0) ? " and substringof(" + prop + ",'" + value + "')" : "substringof(" + prop + ",'" + value + "')";
                        checksum++;
                    } else if (key.indexOf('cl_') === 0) {
                        prop = key.substring(3);
                        str += (checksum > 0) ? " and substringof(tolower(" + prop + "),tolower('" + value + "'))" : "substringof(tolower(" + prop + "),(tolower('" + value + "'))";
                        checksum++;
                    } else if(key.indexOf('cu_')===0){
                        prop = key.substring(3);
                        str += (checksum > 0) ? " and substringof(toupper(" + prop + "),toupper('" + value + "'))" : "substringof(toupper(" + prop + "),(toupper('" + value + "'))";
                        checksum++;
                    } else if (key.indexOf('ew_') === 0) {
                        prop = key.substring(3);
                        str += (checksum > 0) ? " and endswith(" + prop + ",'" + value + "')" : "endswith(" + prop + ",'" + value + "')";
                        checksum++;
                    }else if (key.indexOf('ewl_')===0){
                        prop = key.substring(4);
                        str += (checksum > 0) ? " and endswith(tolower(" + prop + "),tolower('" + value + "'))" : "endswith(tolower(" + prop + "),tolower('" + value + "'))";
                        checksum++;
                    }else if(key.indexOf('ewu_')===0){
                        prop = key.substring(4);
                        str += (checksum > 0) ? " and endswith(toupper(" + prop + "),toupper('" + value + "'))" : "endswith(toupper(" + prop + "),toupper('" + value + "'))";
                        checksum++;
                    } else if (key.indexOf('eql_') === 0) {
                        prop = key.substring(4);
                        str += (checksum > 0) ? " and tolower(" + key + ") eq tolower('" + value + "')" : "tolower(" + key + ") eq tolower('" + value + "')";
                        checksum++;
                    }else if(key.indexOf('equ_')===0){
                        prop = key.substring(4);
                        str += (checksum > 0) ? " and toupper(" + key + ") eq toupper('" + value + "')" : "toupper(" + key + ") eq toupper('" + value + "')";
                        checksum++;
                    } else if (key.indexOf('$') !== 0) {
                        str += (checksum > 0) ? " and " + key + " eq '" + value + "'" : key + " eq '" + value + "'";
                        checksum++;
                    }

                }
            }

            return str;
        }

    }, {});

    return $OData;


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
        root.elliptical.providers = root.elliptical.providers || {};
        root.elliptical.providers.$Pagination = factory(root.elliptical);
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

            if (params.paginate) {
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
                var baseUrl, rawUrl, page, count, pageSize, pageSpread, data;
                baseUrl = params.baseUrl;
                rawUrl = params.rawUrl;
                page = params.page;


                if (result instanceof Array) {
                    count = result.length;
                    data = result;

                } else {
                    count = result[count_];
                    data = result[data_];
                    if (count === undefined) {
                        count = result.count;
                    }
                    if (data === undefined) {
                        data = result.data;
                    }
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
                var querySearch = getQuerySearch(rawUrl);

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
                if (page === pageCount) {
                    pagination.nextPage = pagination.lastPage;
                }

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
                if (querySearch && querySearch !== undefined) {
                    pageUrl += querySearch;
                }
                return pageUrl;
            }

            function assignRecordPointers(count, page, pageSize) {
                var beginRecord = (page - 1) * pageSize + 1;
                if (count === 0) {
                    beginRecord = 0;
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

            function getQuerySearch(url) {
                var index = url.indexOf('?');
                var length = url.length;
                if (index > -1) {
                    return url.substring(index, length);
                } else {
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
        module.exports = factory(require('elliptical-mvc'), require('elliptical-http'), require('../odata/odata'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc', 'elliptical-http', '../odata/odata'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.providers = root.elliptical.providers || {};
        root.elliptical.providers.$Rest = factory(root.elliptical, root.elliptical.http, root.elliptical.providers.$OData);
        root.returnExports = root.elliptical.providers.$Rest;
    }
}(this, function (elliptical, http, $OData) {
    var factory = elliptical.factory;
    var async = elliptical.async || window.async;
    var utils = elliptical.utils;


    var $Rest;
    $Rest = elliptical.Provider.extend({
        _data: null,
        port: null,
        path: null,
        host: null,
        protocol: null,
        $queryProvider: $OData,
        onSend: null,
        withCredentials: false,

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
            this.withCredentials = opts.withCredentials || this.constructor.withCredentials;

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
                options.path += (resource.indexOf('/') === -1) ? '/' + q : q;
            }

            //test query options
            if (query && typeof query.filter !== 'undefined' && !utils.emptyObject(query.filter)) {
                options.path += this.$queryProvider.filter(options.path, query.filter);
            }

            if (query && typeof query.orderBy !== 'undefined' && !utils.emptyObject(query.orderBy)) {
                options.path += this.$queryProvider.orderBy(options.path, query.orderBy);
            }

            if (query && typeof query.orderByDesc !== 'undefined' && !utils.emptyObject(query.orderByDesc)) {
                options.path += this.$queryProvider.orderByDesc(options.path, query.orderBy, query.orderByDesc);
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
            options.withCredentials = this.withCredentials || this.constructor.withCredentials;

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
        root.elliptical.providers = root.elliptical.providers || {};
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
        set: function (key, value, params) {
            if (typeof value === 'object') {
                value = JSON.stringify(value);
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
        clear: function () {
            localStorage.clear();
        }


    }, {});



    return $Local;

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
        module.exports = factory(require('elliptical-mvc'), require('elliptical-utils'), require('elliptical-dustjs'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-mvc', 'elliptical-utils', 'elliptical-dustjs'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.providers = root.elliptical.providers || {};
        root.elliptical.providers.$Template = factory(root.elliptical, root.elliptical.utils, dust);
        root.returnExports = root.elliptical.providers.$Template;
    }
}(this, function (elliptical, utils, dust) {

    var _ = utils._;
    dust.optimizers.format = function (ctx, node) {
        return node;
    };

    dust._root = '';

    dust.onLoad = function (template, callback) {
        if (template.indexOf('shared.') > -1) {
            _loadTemplateFromSharedViews(dust, template, callback);
        } else {
            var err = new Error('Partial Not Found: ' + template);
            callback(err, null);
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

        setRoot: function (val) {
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
                if (template.indexOf('shared.') > -1) {
                    _loadTemplateFromSharedViews($provider, template, function (err, out) {
                        $provider.render(template, context, callback);
                    });
                } else {
                    _loadTemplateByStringValue(this, template, context, callback);
                }

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

    function _sharedUrlPath($provider, template) {
        var root = $provider._root;
        var url = root + '/views';
        var arr = template.split('.');
        for (var i = 0; i < arr.length; i++) {
            url += '/' + arr[i];
        }
        url += '.html';
        return url;
    }

    function _loadTemplateFromSharedViews($provider, template, callback) {
        var url = _sharedUrlPath($provider, template);
        $.get(url, function (data) {
            if (data) {
                var compiled = $provider.compile(data, template);
                $provider.loadSource(compiled);
                callback(null, data);
            } else {
                callback(new Error('Error: cannot find ' + template + ' in shared views folder'), null);
            }
        });
    }


    function _loadTemplateFromControllerView(thisRef, ctrl, view, context, callback) {
        var root = thisRef.root;
        if (typeof window === undefined) {
            throw "Template provider for Controller/Action is currently not configured for non-browser environments"
        }
        var url = root + '/views/' + ctrl + '/' + view + '.html';
        var ctrlTemplate = ctrl + '.' + view;
        var $provider = thisRef.$provider;
        $.get(url, function (data) {
            if (data) {
                var compiled = $provider.compile(data, ctrlTemplate);
                $provider.loadSource(compiled);
                $provider.render(ctrlTemplate, context, callback);
            } else {
                callback('Error: Controller View does not exist', null);
            }
        });

    }

    function _loadTemplateByStringValue(thisRef, template, context, callback) {
        var $provider = thisRef.$provider;
        var cache = $provider.cache;
        if (_.isEmpty(cache)) {
            _loadTemplateCacheFromStore(thisRef.model, thisRef.$store, $provider, thisRef.api, function () {
                $provider.render(template, context, callback);
            });
        } else {
            $provider.render(template, context, callback);
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
        if (!utils.isBrowser()) {
            $store.getAll(model, function (err, data) {
                for (var i = 0, max = data.length; i < max; i++) {
                    var obj = JSON.parse(data[i]);
                    dust.loadSource(obj);
                }
                callback();
            });


        } else {

            //continue to query at intervals for cache to load from script
            var iterations = 0;
            var process = new elliptical.Interval({
                delay: 10
            });
            process.run(function () {
                checkCache($provider, process, iterations, callback);
            })
        }
    }

    function checkCache($provider, process, iterations, callback) {
        var cache = $provider.cache;
        if (!utils._.isEmpty(cache)) {
            process.terminate();
            if (callback) {
                callback();
            }
        } else {
            if (iterations > 1000) {
                process.terminate();
                if (callback) {
                    callback();
                }
            } else {
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
        root.elliptical.providers = root.elliptical.providers || {};
        root.elliptical.providers.$Validation = factory(root.elliptical);
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
 * elliptical.providers.$Sort
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
        root.elliptical.providers = root.elliptical.providers || {};
        root.elliptical.providers.$Sort = factory(root.elliptical);
        root.returnExports = root.elliptical.providers.$Sort;
    }
}(this, function (elliptical) {
    var Location = elliptical.Router.Location;
    var $Sort;
    $Sort = elliptical.Class.extend({


        /**
         * @param {object} params
         * @public
         */
        sort: function (params) {
            var sortOrder = params.sortOrder;
            var field = params.field;
            var url = Location.href;
            var queryVar = (sortOrder === 'asc') ? '$orderBy' : '$orderByDesc';
            var path = this._getSortUrl(url, field, queryVar);
            Location.href=path;
        },

        /**
         * @param {object} params
         * @public
         */
        sorted: function (params) {
            var url = Location.href;
            if (url.indexOf('$orderBy') <= -1) {
                return null;
            } else {
                var field = Location.url.queryString(url, '$orderBy');
                if (field && field !== undefined) {
                    return {
                        field: field,
                        sort: 'asc'
                    };
                } else {
                    return {
                        field: Location.url.queryString(url, '$orderByDesc'),
                        sort: 'desc'
                    }
                }
            }
        },

        refresh: function (params) {
            if (typeof params === 'string') {
                Location.redirect(params);
            }
        },

        _getSortUrl: function (url, val, queryVar) {
            var index = url.indexOf('$orderBy');
            var str = queryVar + '=' + encodeURIComponent(val);
            if (index > -1) {
                url = url.substr(0, index) + str;
                return url;
            } else {
                url += (url.indexOf('?') > -1) ? '&' + str : '?' + str;
                return url;
            }
        }


    }, {});


    return $Sort;

}));


/*
 * =============================================================
 * elliptical.providers.$Navigation
 * =============================================================
 *  detail prev/next navigation
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
        root.elliptical.providers = root.elliptical.providers || {};
        root.elliptical.providers.$Navigation = factory(root.elliptical);
        root.returnExports = root.elliptical.providers.$Navigation;
    }
}(this, function (elliptical) {
    var utils=elliptical.utils;
    var _ = utils._;
    var $Navigation;
    $Navigation = elliptical.Class.extend({
        idProp:'id',
        nextQS:'?dir=next',
        prevQS:'?dir=prev',

        get:function(params){
            var navigation={
                next: null,
                prev: null
            };

            var nav=params.data;
            if(!nav){
                return navigation;
            }

            var id = params.id;
            var baseUrl=params.baseUrl;
            if(utils.strLastChar(baseUrl)!=='/'){
                baseUrl+='/';
            }

            var idProp=this.idProp;
            var nextQS=this.nextQS;
            var prevQS=this.prevQS;

            var index = this._getIndex(nav, id, idProp);
            var length = nav.length;
            length = length - 1;
            if (index < length) {
                navigation.next = baseUrl + nav[index + 1][idProp] + nextQS;
            }
            if (index > 0) {
                navigation.prev = baseUrl + nav[index - 1][idProp] + prevQS;
            }

            return navigation;

        },

        _getIndex:function(data, id, idProp){
            return _.findIndex(data, function (obj) {
                return obj[idProp].toString() === id.toString();
            })
        }

    }, {});



    return $Navigation;

}));


