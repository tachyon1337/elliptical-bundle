
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
        '@resource':'Store',
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
 * elliptical.services.Search
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
        root.elliptical.services.Search=factory(root.elliptical);
        root.returnExports = root.elliptical.services.Search;
    }
}(this, function (elliptical) {

    var Search;
    Search=elliptical.Class.extend({
        '@resource':'Search',
        $provider:null,

        find:function(params){
            return this.$provider.find(params);
        }

    },{
        find:function(params){
            return this.constructor.find(params);
        }


    });

    return Search;

}));


/*
 * =============================================================
 * elliptical.services.Sort
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
        root.elliptical.services.Sort=factory(root.elliptical);
        root.returnExports = root.elliptical.services.Sort;
    }
}(this, function (elliptical) {

    var Sort;
    Sort=elliptical.Class.extend({
        '@resource':'Sort',
        $provider:null,

        sort:function(params){
            return this.$provider.sort(params);
        },

        sorted:function(params){
            return this.$provider.sorted(params);
        },

        refresh:function(params){
            return this.$provider.refresh(params);
        }

    },{
        sort:function(params){
            return this.constructor.sort(params);
        },

        sorted:function(params){
            return this.constructor.sorted(params);
        },

        refresh:function(params){
            return this.constructor.refresh(params);
        }


    });

    return Sort;

}));