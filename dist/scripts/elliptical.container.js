
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
         * registers a type
         * @param {string} [name] - if type has a @resource property set as the name and provider is passed
         * @param {object} type - required

         */
        registerType:function(name,type){
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
         *  maps a registered provider to a type by the string name of the provider type
         *  or: directly maps a provider type to a type
         * @param {string} [name] - optional, string name of type
         * @param {object} type - the type
         * @param {*} $name - string name of a registered provider type, or a provider type
         */
        mapType:function(name,type,$name){
            if($name===undefined){
                $name=type;
                type=name;
                name=null;
            }

            if(typeof $name!=='string'){
                (name) ? this._mapType(name,type,$name) : this._mapType(type,$name);
                return;
            }
            var self=this;
            var count=0;
            var MAX_COUNT=6;
            var INTERVAL=400;
            if(!mapType_(type,$name,this)){
                var timeoutId=setInterval(function(){
                    if(mapType_(type,$name,self)){
                        clearInterval(timeoutId);
                    }else{
                        count++;
                        if(count > MAX_COUNT){
                            clearInterval(timeoutId);
                        }
                    }
                },INTERVAL)
            }

            function mapType_(type,$name,context){
                var $providerType=context.getType($name);
                if($providerType){
                    (name) ? context._mapType(name,type,$providerType) : context._mapType(type,$providerType);
                    return $providerType;
                }else{
                    return null;
                }
            }

        },

        _mapType:function(name,type,provider){
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
        }
    }

}));
