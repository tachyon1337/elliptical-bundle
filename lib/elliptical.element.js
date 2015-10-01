

/*
 * =============================================================
 * elliptical.widget
 * =============================================================
 *
 *
 * elliptical extensions of the jQuery UI factory
 * uses the Polymer Platform to create custom elements/web components and creates a "stateful widget instance"
 * of a custom element on the jQuery object
 * other enhancements include: template rendering, animation support, media query support, device support, location support
 *
 * dependencies:
 * jquery widget ui factory
 * elliptical platform
 * elliptical utils
 *
 * provider dependencies:
 * dust.js-->template
 * animation-->animation support -->transition plugin method for transitions, transforms provider for 3d transforms
 * touch--->touch/gesture/media query/device support, jQuery special events for click,hover that trigger corresponding touch gestures
 */
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'),require('elliptical-platform'),require('./widget.factory'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils','elliptical-platform','./widget.factory'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function () {

    //init providers
    //var touch_= $.touch || {};
    //var transit_= $.transit || {};
    var device_ = $.device || {};
    var mq_ = device_.mq || {};

    /* extend base prototype public options */
    /* for the most part, we follow a dependency injection/provider pattern for UI factory enhancements */
    var options = {
        $providers:{
            template:window.dust || {},
            device: device_,
            mq: mq_,
            transforms: $.transforms || {},
            location:function(url){window.location=url;},
            utils: $.utils || {},
            transition:$.transition || {}
        },
        mqMaxWidth: 1024
    };
    
    $.extend($.Widget.prototype.options, options);

    /* private data store */
    var _data = {
        containerSelector: '[data-role="container"]',
        $containerSelector:'ui-container',
        drawerClass: 'touch-ui-drawer',
        $drawerElement:'<touch-ui-drawer></touch-ui-drawer>',
        touchMenuClass: 'touch-ui-menu',
        touchDropdownClass: 'touch-ui-dropdown',
        $menuElement:'<ui-menu></ui-menu>',
        $touchMenuElement:'<touch-ui-menu></touch-ui-menu>',
        menuClass: 'ui-menu',
        listItem:'li',
        $listItem:'menu-item',
        $listItemElement:'<menu-item></menu-item>',
        dropdownClass: 'ui-dropdown',
        $dropdownElement:'<ui-dropdown></ui-dropdown>',
        searchClass: 'ui-search',
        $searchRole:'[role="search"]',
        $overlayElement:'<ui-overlay></ui-overlay>',
        hardwareAcceleratedClass: 'ui-hardware-accelerated',
        leftBoxShadowClass: 'ui-left-box-shadow',
        fixedToggleContainerClass: 'ui-fixed-toggle-container',
        overflowContainerClass: 'ui-overflow-container',
        $toggleSelector:'ui-toggle',
        loadingContainer:'.ui-loading-container',
        loading:'.ui-loading',
        loadingDelay:300,
        $modalElement:'<ui-modal></ui-modal>',
        modalClass:'ui-modal',
        modal:null,
        modalOpacity:.4,
        modalZIndex:99999,
        click:'touchclick',
        hover:'touchhover',
        $elements:['ui-container',
            'ui-overlay',
            'ui-modal',
            'ui-menu',
            'menu-item',
            'ui-brand',
            'ui-toggle',
            'menu-item-dropdown',
            'menu-item-search',
            'menu-divider',
            'grid-row',
            'grid-columns',
            'ui-select',
            'ui-input-icon',
            'ui-loading',
            'ui-notification',
            'ui-slide-notification',
            'ui-flex-grid',
            'ui-flex-table',
            'ui-dropdown',
            'ui-mega-dropdown',
            'ui-media-object',
            'ui-box',
            'ui-breadcrumb',
            'breadcrumb-item',
            'ui-menu-tab',
            'ui-flex-list',
            'ui-flex-gallery',
            'ui-flex-form',
            'ui-radio-list',
            'form-item',
            'flex-box',
            'flex-form',
            'flex-list',
            'flex-label',
            'ui-badge',
            'ui-semantic-label',
            'ui-semantic-checkbox',
            'ui-tip',
            'ui-column',
            'column-item',
            'ui-flex-container',
            'ui-social',
            'social-icon',
            'touch-ui-drawer',
            'touch-ui-menu',
            'touch-ui-dropdown',
            'touch-ui-toggle',
            'touch-ui-brand',
            'touch-icons',
            'touch-icon',
            'touch-ui-brand',
            'ui-icons',
            'screen-icon',
            'ui-screentab',
            'ui-step-progress',
            'progress-item',
            'touch-template',
            'empty-template'
        ]

    };

    //$.Widget.prototype._data = $.Widget.prototype._data || {};
    //$.extend($.Widget.prototype._data, _data);

    $._$customelements=_data.$elements;

    /* private -------------------------------------------------------------------------------------------------------*/

    /**
     * use _getCreateEventData as a 'reserved hook' to bind the internal store to the instance
     * @private
     */
    $.Widget.prototype._getCreateEventData= function(){
        //this._data=$.widget.extend({},this._data);
        //set our own data store record of an instance
        $.data(this.element[0],'custom-' + this.widgetName,this.widgetName);


        /* fire this to hook the original method */
        this._onCreateEventData();
    };


    /**
     * replaces _getCreateEventData for the instance method hook
     * @private
     */
    $.Widget.prototype._onCreateEventData= $.noop;


    /* expose an animation method for widget animations/transitions */
    /**
     *
     * @param element {Object}
     * @param options {Object}
     * @param callback {Function}
     * @private
     */
    $.Widget.prototype._transition = function (element, options, callback) {
        try{
            $.transition = this.options.$providers.transition;
        }catch(ex){
            $.transition=$.transit;
        }
        options = options || {};
        if (options === {}) {
            options.duration = 300;
            options.preset = 'fadeIn';
        }
        if(options.preset==='none'){
            element.hide();
            return;
        }
        element.transition(options, function () {
            if (callback) {
                callback.call(element[ 0 ]);
            }
        });
    };

    /* expose render method for templates */
    /**
     *
     * @param element {Object}
     * @param options {Object}
     * @param callback {Function}
     * @private
     */
    $.Widget.prototype._render = function (element, options, callback) {
        var provider = $.Widget.prototype.options.$providers.template;
        var context=parseTemplateContext(options,provider);
        var template=templateReference(options,provider);
        provider.render(template, context, function (err, out) {
            var html=out;
            element.html(html);
            if (callback) {
                callback(err, html);
            }
        });
    };

    /**
     * method that returns parsed html from a rendered template(however, does not insert it into an element like 'render')
     * @param options {Object}
     * @param callback {Function}
     * @private
     */
    $.Widget.prototype._renderTemplate = function (options, callback) {
        options.parse=(options.parse !== undefined) ? options.parse : true;
        var provider = $.Widget.prototype.options.$providers.template;
        var context=parseTemplateContext(options,provider);
        var template=templateReference(options,provider);
        provider.render(template, context, function (err, out) {
            //var html = out.replace(/<ui-template(.*?)>/g, '').replace(/<\/ui-template>/g, '');
            var html=out;
            var parsedHtml
            if(html!==undefined){
                parsedHtml= (options.parse) ? $.parseHTML(html) : html;
            }
            if (callback) {
                callback(err, parsedHtml);
            }
        });
    };

    $.Widget.prototype._renderTemplateString = function (element, options, callback) {
        var provider = $.Widget.prototype.options.$providers.template;
        var templateString = options.templateString;
        var template = options.template;
        var model = options.model;
        if (typeof options.compile !== 'undefined') {
            if (options.compile) {
                var compiled = provider.compile(templateString, template);
                provider.loadSource(compiled);
            }
        }
        provider.render(template, model, function (err, out) {
            element.html(out);
            if (callback) {
                callback(err, out);
            }
        });
    };

    /**
     * renders a ui-template element fragment
     * @param element {Object}
     * @param options {Object}
     * @param callback {Function}
     * @private
     */
    $.Widget.prototype._renderFragment = function (element, options, callback) {
        var provider = $.Widget.prototype.options.$providers.template;
        var context=parseTemplateContext(options,provider);
        var template=templateReference(options,provider);
        provider.render(template, context, function (err, out) {
            //var html=out.replace(/<ui-template(.*?)>/g,'').replace(/<\/ui-template>/g,'');
            var html=out;
            if(html!==undefined){
                element.html(html);
            }
            if (callback) {
                callback(err, html);
            }
        });
    };

    $.Widget.prototype._precompileTemplate = function (id,node,prop) {
        var str=getTemplateFragmentById(id);
        if(!str){
            var $provider = $.Widget.prototype.options.$providers.template;
            precompileTemplateFragment($provider,node,id,prop);
        }
    };

    /**
        * fetches the uncompiled string template fragment for the passed id
        * @param id {String}
        * @returns {String}
        */
    $.Widget.prototype._getFragmentById = function (id) {
        return getTemplateFragmentById(id);
    };

    function parseTemplateContext(options,provider){
        if (provider === null) {
            throw new Error('Error: render requires a template provider to be set');
        }
        if (typeof options === 'undefined') {
            throw new Error('Error: render requires an options object');
        }
        if (typeof options.template === 'undefined' && typeof options.templateStr ==='undefined') {
            throw new Error('Error: template name or template string is required');
        }
        options.model = options.model || {};
        var context={};
        (options.context) ? context[options.context]=options.model : context=options.model;

        return context;
    }

    function templateReference(opts,$provider){
        if(opts.template){
            return opts.template
        }else if(opts.templateStr){
            var name='str_' + rndString(8);
            var compiled = $provider.compile(opts.templateStr, name);
            $provider.loadSource(compiled);

            return name;
        }else{
            return null;
        }
    }

    function precompileTemplateFragment($provider, node, id,prop) {
        node = upgradeTemplateCustomElements(node);
        var html = node.prop(prop);
        html = html.replace(/&quot;/g,'"');
        var obj={
            id:id,
            fragment:html
        };
        if($$.fragments===undefined){
            $$.fragments=[];
        }
        $$.fragments.push(obj);
        var compiled=$provider.compile(html,id);
        $provider.loadSource(compiled);
    }

    function getTemplateFragmentById(id){
        var fragment;
        if(!$$ || !$$.fragments){
            return null;
        }
        if (!$$.fragments.length > 0){
            return null;
        }
        $$.fragments.forEach(function(obj){
            if(obj.id===id){
                fragment=obj.fragment;
            }
        });

        return fragment;

    }

    function upgradeTemplateCustomElements(node){
        var upgrades = node.find('[html5-imported="true"]').not('[data-upgraded="true"]');
        if (upgrades.length > 0) {
            $.each(upgrades, function (index, element) {
                _HTML5Imports.upgradeElement(element.tagName, element);
            });
        }
        return node;
    }

    $.Widget.prototype._renderElementTemplateImports=function(templateNode,scope){
        if(_HTML5Imports ===undefined){
            return false;
        }
        var provider = $.Widget.prototype.options.$providers.template;
        var upgrades=templateNode.find('[html5-imported="true"]').not('[data-upgraded="true"]');
        if(upgrades.length > 0){
            $.each(upgrades,function(index,element){
                _HTML5Imports.upgradeElement(element.tagName,element);
            });
            $.each(upgrades,function(index,element){
                var $element=$(element);
                var att=$element.attr('render-inline');
                if(att){
                    var modelProp=$element.attr('inline-scope');
                    var model=scope[modelProp];
                    var parent=$element.parent();
                    var template=$element.attr('inline-template');
                    provider.render(template, model, function (err, out) {
                        if(out){
                            var html=out.replace(/<ui-template(.*?)>/g,'').replace(/<\/ui-template>/g,'');
                            parent.html(html);
                            
                        }
                    });
                }
            });
        }
    };

    function rndString(length){
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    }

    /**
     * converts a string into a html document
     * @param htmlString {String}
     * @returns {HTMLDocument}
     * @private
     */
    $.Widget.prototype._DOMParser=function(htmlString){
        return new DOMParser().parseFromString(htmlString, 'text/html');

    };

    $.Widget.prototype._randomString = function (length) {
        return rndString(length);

    };

    /*key-value session store */
    /**
     * get value
     * @param key {String}
     * @returns {Object}
     * @private
     */
    $.Widget.prototype._getData = function (key) {
        return sessionStorage.getItem(key);
    };

    /**
     * set key/value
     * @param key {String}
     * @param val {Object}
     * @private
     */
    $.Widget.prototype._setData = function (key, val) {
        sessionStorage.setItem(key, val);
    };



    $.Widget.prototype._utils=$.Widget.prototype.options.$providers.utils || {};

    /**
     * private method that returns screen mode
     * @returns {string}
     * @private
     */
    $.Widget.prototype._mode = function () {
        return (this._device.viewport.width > this.options.mqMaxWidth) ? "desktop" : "touch";
    };



    /**
     *
     * @param obj {Object}
     * @returns {Object}
     * @private
     */
    $.Widget.prototype._offset=function(obj){
        var curleft = curtop = 0;
        if (obj.offsetParent) {
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
        }
        return{
            top:curtop,
            left:curleft
        }
    };

    /**
     * preload images from element
     * @param element {Object}
     * @param callback {Function}
     * @returns {boolean}
     * @private
     */
    $.Widget.prototype._preloadImages = function (element, callback) {
        var imgArray = [];
        var err = {};
        var data = {};
        var images = element.find('img').not('[data-src]');
        var length = images.length;
        var counter = 0;
        if (length === 0) {
            if (callback) {
                err.message = 'No images found in element';
                callback(err, null);
            }
            return false;
        }
        $.each(images, function (i, img) {
            var image = new Image();
            $(image).bind('load', function (event) {
                counter++;
                imgArray.push(image);
                if (counter === length) {
                    if (callback) {
                        data.images = imgArray;
                        data.length = counter;
                        callback(null, data);
                    }
                }
            });
            image.src = img.src;
        });
        return true;
    };


    /**
     *
     * @param evt {String}
     * @param data {Object}
     * @private
     */
    $.Widget.prototype._onEventTrigger = function (evt, data) {
        var event = $.Event(evt);

        this._trigger(evt, event, data);
        //this.element.trigger(evt,data);
        //$(window).trigger(evt,data);
    };

    /**
     * scrollTop event dispatcher
     * @param ypos {Number}
     * @param evt {String}
     * @private
     */
    $.Widget.prototype._scrollTop= function (ypos, evt) {
        if ($.type(ypos) !== "number") {
            ypos = 0;
        } else if (typeof evt === 'undefined') {
            evt = 'scrollTop';
        }

        setTimeout(function () {
            window.scrollTo(0, ypos);
            $(document).trigger(evt, { x: 0, y: ypos });
        }, 20);
    };

    /**
     *
     * @param element {Object}
     * @private
     */
    $.Widget.prototype._setHardwareAcceleration = function (element) {
        var provider=$.Widget.prototype.options.$providers.transforms;
        this._data.set('toggleAcceleration',provider.setHardwareAcceleration(element,this._data.get('hardwareAcceleratedClass')));
    };

    /**
     *
     * @param element {Object}
     * @private
     */
    $.Widget.prototype._resetHardwareAcceleration = function (element) {
        var provider=$.Widget.prototype.options.$providers.transforms;
        provider.resetHardwareAcceleration(element,this._data.get('toggleAcceleration'),this._data.get('hardwareAcceleratedClass'));
    };

    $.Widget.prototype._setContainerOverflow = function (element) {
        var provider=$.Widget.prototype.options.$providers.transforms;
        this._data.set('toggleOverflow',provider.setContainerOverflow(element,this._data.get('overflowContainerClass')));
    };

    /**
     *
     * @param element {Object}
     * @private
     */
    $.Widget.prototype._resetContainerOverflow = function (element) {
        var provider=$.Widget.prototype.options.$providers.transforms;
        provider.resetContainerOverflow(element,this._data.get('overflowContainerClass'));
    };

    /**
     *
     * @param container {object}
     * @private
     */
    $.Widget.prototype._resetContainer = function (container) {
        var provider=$.Widget.prototype.options.$providers.transforms;
        provider.resetContainer(container,this._data.get('leftBoxShadowClass'),this._data.get('fixedToggleContainerClass'));
    };


    /**
     *
     * @param element {object}
     * @private
     */
    $.Widget.prototype._resetTransition = function (element) {
        var provider=$.Widget.prototype.options.$providers.transforms;
        provider.resetTransition(element);
    };

    /**
     *
     * @param element {object}
     * @private
     */
    $.Widget.prototype._resetTransform = function (element) {
        var provider=$.Widget.prototype.options.$providers.transforms;
        provider.resetTransform(element);
    };

    /**
     *
     * @param element {Object}
     * @param coordinates {Object}
     * @private
     */
    $.Widget.prototype._transform = function (element, coordinates) {
        var provider=$.Widget.prototype.options.$providers.transforms;
        provider.transform(element,coordinates);

    };

    /**
     *
     * @param element {object}
     * @param opts {object}
     * @param callback {function}
     * @private
     */
    $.Widget.prototype._3dTransition = function (element, opts, callback) {
        var provider=$.Widget.prototype.options.$providers.transforms;
        provider.transition3d(element,opts,callback);

    };

    /**
     * requestAnimationFrame wrapper
     * @type {window.requestAnimationFrame|*|Function}
     * @private
     */
    $.Widget.prototype._requestAnimationFrame = (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            setTimeout(callback, 1000 / 60);
        }
        );


    $.Widget.prototype._press = function () {
        var press = ('ontouchend' in document) ? 'touchstart' : 'click';
        return press;
    };

    
    $.Widget.prototype._device=$.Widget.prototype.options.$providers.device;
    $.Widget.prototype._mq=$.Widget.prototype.options.$providers.mq;



    /**
     * @param opts {Object}
     * @param callback {Function}
     * @private
     */
    $.Widget.prototype._loadTemplate = function (opts,callback) {
        throw new Error('Load Template method not implemented for this widget');
    };

    /**
     * add modal overlay
     * @param element {Object}
     * @param opts {Object}
     * @param callback {Function}
     * @private
     */
    $.Widget.prototype._setModal = function (element,opts,callback) {
        //support 0-3 params
        var length=arguments.length;
        if(length===0){
            element=$('body');
            opts={};
            callback=null;
        }else if(length===1){
            if(typeof element==='function'){
                callback=element;
                element=$('body');
                opts={};
            }else if(element.context){
                opts={};
                callback=null;
            }else{
                opts=element;
                element=$('body');
            }
        }else if(length===2){
            if(typeof opts==='function'){
                callback=opts;
                if(element.context===undefined){
                    opts=element;
                    element=$('body');
                }else{
                    opts={};
                }
            }else{
                callback=null;
            }
        }

        var div=$('<div class="ui-modal"></div>');
        if(opts.cssClass){
            div.addClass(opts.cssClass);
        }

        if(opts.zIndex){
            div.css({
                'z-index':opts.zIndex
            });
        }
        if(this._data){
            this._data.set('modal',div);
        }else{
            this._modal=div;
        }

        var opacity=(opts.opacity) ? opts.opacity : .3;
        div.css({
            opacity:0
        });
        element.append(div);

        var transitions=(this._transition) ? this._transition : $.Widget.prototype._transition;

        transitions(div,{
            opacity:opacity,
            duration:250
        },function(){
            if(callback){
                callback();
            }
        });
    };

    /**
     * remove modal
     * @param callback {Function}
     * @private
     */
    $.Widget.prototype._removeModal = function (callback) {
        var self=this;
        var modal=null;
        if(this._data){
            modal=this._data.get('modal');
        }else{
            modal=this._modal;
        }

        if(!modal || modal===undefined ){
            return;
        }
        var transitions=(this._transition) ? this._transition : $.Widget.prototype._transition;
        transitions(modal,{
            opacity:0,
            duration:250
        },function(){
            modal.remove();
            (self._data) ? self._data.set('modal',null) : self._modal=null;
            if(callback){
                callback();
            }
        });
    };

    /**
     * overwrite the jQuery UI _trigger method to use: namespaced tagname + event
     * (i)Ex: <my-tag></my-tag> : my.tag.event
     * (ii) if the namespaced widgetEventPrefix does not match the namespaced tagname(.e.g, ui interactions),
     * then the event will be my.tag.prefix.event
     * (iii) if the tag is not a custom element, the event will be namespace.prefix.event (e.g, ui.sort.create, sortable defined on, say, a <div>)
     * @param type {String}
     * @param event {Object}
     * @param data {Object}
     * @returns {boolean}
     * @private
     */
    $.Widget.prototype._trigger=function( type, event, data ) {
        try{
            var prop, orig,
                callback = this.options[ type ];

            data = data || {};
            var prefix=this.widgetEventPrefix;
            var tagName=this.bindings[0].tagName.toLowerCase();
            var tagArray=tagName.split('-');
            var tagLength=tagArray.length;
            var nameSpacedTagName=$.utils.string.tagNameToNamespace(tagName);
            var arr=prefix.toArrayFromCamelCase();
            var nameSpacedPrefix= $.utils.array.toNamespaceFromArray(arr);
            if(nameSpacedPrefix===nameSpacedTagName){
                prefix=nameSpacedPrefix;
            }else if(tagLength > 1){
                prefix= nameSpacedTagName + '.' + prefix;
            }else{
                prefix=this.namespace + '.' + prefix;
            }

            event = $.Event( event );
            event.type = ( type === prefix ?
                type :
            prefix + '.' + type ).toLowerCase();
            // the original event may come from any element
            // so we need to reset the target on the new event
            event.target = this.element[ 0 ];

            // copy original event properties over to the new event
            orig = event.originalEvent;
            if ( orig ) {
                for ( prop in orig ) {
                    if ( !( prop in event ) ) {
                        event[ prop ] = orig[ prop ];
                    }
                }
            }

            this.element.trigger( event, data );
            return !( $.isFunction( callback ) &&
            callback.apply( this.element[0], [ event ].concat( data ) ) === false ||
            event.isDefaultPrevented() );
        }catch(ex){

        }

    };

    /**
     * location handler
     * @param url {String}
     * @private
     */
    $.Widget.prototype._location=function(url){
        var fn=$.Widget.prototype.options.$providers.location;
        fn(url);
    };

    /**
     * registers custom tag as an custom element
     * @param tag {String}
     * @param ElementProto {Object}
     * @private
     */
    $.Widget.prototype._registerElement=function(tag,ElementProto){
        if(typeof ElementProto ==='undefined'){
            ElementProto=HTMLElement.prototype;
            ElementProto._name='HTMLElement';
        }
        var proto = Object.create(ElementProto);
        proto._tagName = tag;
        var object_={prototype:proto};

        /* register the element */
        if(ElementProto._name==='HTMLElement'){
            document.registerElement(tag,object_);
        }else{
            object_=getExtendedObject(ElementProto._name,object_);
            document.registerElement(tag,object_);
        }

    };

    /**
     * registers an array of custom tags as custom elements
     * @param arr (ofString or ofObject) object={name,prototype)
     * @private
     */
    $.Widget.prototype._registerElements=function(arr){

        if(typeof arr==='string'){ //support simple passing of a string
            $.Widget.prototype._registerElement(arr);
        }else{
            if(arr.length>0){
                arr.forEach(function(t){
                    (typeof t==='string') ? $.Widget.prototype._registerElement(t) : $.Widget.prototype._registerElement(t.name, t.prototype);
                });
            }
        }
    };

    $.Widget.prototype._getAttrs=function(element,camelCase){
        return $.widget.getOpts(element,camelCase);
    };

    $.Widget.prototype._jsonParseMessage = function (obj) {
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


    /* public --------------------------------------------------------------------------------------------------------*/


    /**
     *
     * @param opts {object} opts.model,opts.template
     * @param callback {function}
     * @public
     */
    $.Widget.prototype.loadTemplate = function (opts, callback) {
        this._loadTemplate(opts, function (err, out) {
            if (callback) {
                callback(err, out);
            }
        });
    };

    /**
     *
     * @param options {object}
     * @public
     */
    $.Widget.prototype.setOptions = function (options) {
        this._setOptions(options);
    };


    /* replace show,hide with css3 transitions */
    $.each({ show: "fadeIn", hide: "fadeOut" }, function (method, defaultEffect) {
        $.Widget.prototype[ "_" + method ] = function (element, options, callback) {
            var _event = (options) ? options.event : null;
            if (typeof options === "string") {
                options = { effect: options };
            }
            var hasOptions,
                effectName = !options ?
                    method :
                        options === true || typeof options === "number" ?
                    defaultEffect :
                    options.effect || defaultEffect;
            options = options || {};
            if (typeof options === "number") {
                options = { duration: options };
            }
            hasOptions = !$.isEmptyObject(options);
            options.complete = callback;
            if (options.delay) {
                element.delay(options.delay);
            }

            if (!options.duration) {
                options.duration = 300; //default value
            }

            //we are using our own CSS3 Transitions/animations implementation instead of jQuery UI Effects

            var obj = {};
            obj.duration = options.duration;
            obj.preset = options.effect;

            //test for css3 support; if not, then on 'show' or 'hide', just call the jquery methods
            if ($('html').hasClass('no-css3dtransforms') || options.effect === 'none') {
                if (_event === 'show') {
                    element.show();
                    if (callback) {
                        callback();

                    }
                } else if (_event === 'hide') {
                    element.hide();
                    if (callback) {
                        callback();

                    }
                }

            } else {
                this._transition(element, obj, callback);
            }
        };
    });

    /**
     * expose render
     * @param element {Object}
     * @param opts {Object}
     * @param callback {Function}
     */
    $.widget.render=function(element,opts,callback){
        $.Widget.prototype._render(element,opts,callback);
    };


    /**
     * getters & setters for widget providers
     *
     */
    $.widget.$providers=function(opts){
        for (var key in opts) {
            if (opts.hasOwnProperty(key)) {
                $.Widget.prototype.options.$providers[key]=opts[key];
            }
        }
    };

    /**
     * getter/setter
     * @type {{options: void}}
     */
    $.widget.config={
        options:Object.defineProperties({}, {
            'mqMaxWidth':{
                get: function () {
                    return  $.Widget.prototype.options.mqMaxWidth;
                },
                set:function(val){
                    $.Widget.prototype.options.mqMaxWidth=val;

                }
            }
        })
    };



    /**
     * custom definitions array reference
     * @type {Array}
     */
    $.widget.definitions=[];
    $.widget.upgraded = [];

    /**
     * register the element as a custom element (depends on Platform which polyfills document.register)
     * @param name {String}
     * @param tagName {String}
     * @param ElementProto {Object}
     * @param registerDef {Boolean}
     */
    $.widget.register=function(name,tagName,ElementProto,registerDef){
        //record the element definition
        var regElement_={};
        regElement_.name=name;
        regElement_.tagName=tagName;

        if(registerDef===undefined){
            registerDef=true;
        }

        //define the object
        var proto = Object.create(ElementProto);
        proto._tagName = tagName;
        var object_={prototype:proto};

        /* custom element callbacks
        *  pass them onto the element instance, where the UI factory can hook into them
        * */
        proto.attachedCallback=function(){
            //if(this._attachedCallback){
                //this._attachedCallback();
            //}
        };

        proto.detachedCallback=function(){
            //if(this._detachedCallback){
                //this._detachedCallback();
            //}
        };

        proto.createdCallback = function () {
            _HTML5Imports.instantiate(this,name);

        };

        proto.attributeChangedCallback = function (n, o, v) {
            if (n === 'loaded') {
                this.removeAttribute('ui-preload');
            }
            if(n==='data-upgraded' && v==='true'){
                //attributeNotification(this);
            }

            if(this._attributeChangedCallback){
                //this._attributeChangedCallback(n,o,v);
            }
        };

        /* register the element */
        if (ElementProto._name === 'HTMLElement') {
            document.registerElement(tagName, object_);
           
        }else{
            regElement_.tagName='[is="' + tagName + '"]';
            object_=getExtendedObject(ElementProto._name,object_);
            document.registerElement(tagName,object_);
        }

        if (registerDef) {
            pushElementDefinition(regElement_);
        }
    };



    function pushElementDefinition(obj) {
        if (!isTagDefined(obj.tagName)) {
            $.widget.definitions.push(obj);
        }
    }


    /**
     * register a custom tag as a custom element
     * @param tag
     * @param ElementProto
     */
    $.widget.registerElement=function(tag,ElementProto){
        $.Widget.prototype._registerElement(tag,ElementProto);
    };

    /**
     * register an array of custom tags as custom elements
     * @param arr
     */
    $.widget.registerElements=function(arr){
        $.Widget.prototype._registerElements(arr);
    };

    /**
     * registers the elliptical css components as custom elements
     */
    $.widget.registerFrameworkElements=function(){
        //var arr= $.Widget.prototype._data.$elements;
        //var arr= $._$customelements;
        //arr.forEach(function(t){
            //$.widget.registerElement(t);
        //});
    };

    /**
     * registers template custom elements
     */
    $.widget.registerTemplateElements=function(){
        $.widget.registerElement('ui-template');
        $.widget.registerElement('ui-model');
    };



    function isTagDefined(tagName) {
        tagName = tagName.toLowerCase();
        var isDefined = false;
        var definitions = $.widget.definitions;
        var length = definitions.length;
        for (var i = 0; i < length; i++) {
            var tagName_ = definitions[i].tagName.toLowerCase();
            if (tagName_ === tagName) {
                isDefined = true;
                break;
            }
        }

        return isDefined;
    }



    /**
     *
     * @param element {Object}
     * @param camelCase {Boolean}
     * @returns {Object}
     */
    function getOpts(element,camelCase){
        if(camelCase===undefined){
            camelCase=true;
        }
        var opts={};
        $.each(element.attributes,function(i,obj){
            var opt=obj.name;
            var val = obj.value;
            if(!testAttr(opt)){
                var patt=/data-/;
                if(patt.test(opt)){
                    opt=opt.replace('data-','');
                }
                if(camelCase && camelCase !=='false'){
                    (opt !== 'template') ? opts[opt.toCamelCase()] = booleanCheck(val) : (opts[opt] = booleanCheck(val));

                }else{
                    opts[opt.toCamelCase()]= booleanCheck(val);
                }
            }
        });

        return opts;
    }

    function booleanCheck(val) {
        if (val === 'false') {
            val = false;
        }
        if (val === 'true') {
            val = true;
        }
        return val;
    }

    /**
     *
     * @param attr {String}
     * @returns {boolean}
     */
    function testAttr(attr){
        var patt=/href|tcmuri|rowspan|colspan|class|nowrap|cellpadding|cellspacing/;
        return patt.test(attr);
    }


    /**
     * extends the object to pass to document.register for HTML element interfaces that inherit from HTMLElement
     * extended object={prototype:proto,extends:name}
     * ex: HTMLInputElement-->obj.extends='input'
     * @param name {String}
     * @param obj {Object}
     * @returns {Object}
     */
    function getExtendedObject(name,obj){
        var type=name.replace(/HTML/g,'').replace(/Element/g,'');
        type=type.toLowerCase();
        obj.extends=type;
        return obj;
    }


    /**
     *
     * @param element {Object}
     * @param camelCase {Boolean}
     * @returns {Object}
     */
    $.widget.getOpts=function(element,camelCase){
        return getOpts(element,camelCase);
    };


    $.widget.setModal=function(element,opts,callback){
        $.Widget.prototype._setModal(element,opts,callback);
    };

    $.widget.removeModal=function(){
        $.Widget.prototype._removeModal();
    };




    return $;
    

}));






/*
 * =============================================================
 * elliptical.element
 * =============================================================
 * the elliptical UI factory
 *
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('./widget'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./widget'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory($);
    }
}(this, function ($) {

    function _upgradedDataSet(node){
        if(!node){
            return null;
        }
        var dataSet=node.dataset;
        if(dataSet !==undefined){
            return node.dataset.upgraded;
        }else{
            return undefined;
        }

    }



    /* define the base element  */
    $.widget('elliptical.element',{

        /**
         * should never be overwritten, _initElement becomes the de facto dev hook
         * @private
         */
        _create:function(){
            /* init events array */
            this._destroyed=false;
            this._data={
                _store:{},
                get:function(prop){
                    if(this._store){
                        return this._store[prop];
                    }

                },
                set:function(prop,val){
                    if(this._store){
                        this._store[prop]=val;
                    }
                }

            };
            this._data.click='touchclick';
            this._data.hover='touchhover';
            this._data.events=[];
            $.extend(this.options, $.Widget.prototype.options);

            this._onBeforeCreate();
        },

        _onBeforeCreate:function(){
            (this.options.proxyUpgrade) ? this._proxyUpgradeElement() : this._upgradeElement();
        },

        _proxyUpgradeElement:function(){
            if(this.element[0].dataset){
                this.element[0].dataset.upgraded=true;
            }
            this._onCreate();
        },

        _upgradeElement:function(){
            var self=this;
            var upgraded = _upgradedDataSet(this.element[0]);
            if(upgraded===null){
                this._destroy();
            }
            if(upgraded==='true'){
                this._onCreate();
            }else{
                var tagName=this._tagName;
                _HTML5Imports.upgradeElement(tagName, this.element[0],function(element){
                    upgraded = _upgradedDataSet(element);
                    if(upgraded==='true'){
                        self._onCreate();
                    }else{
                        self.destroy();
                    }
                });
            }
        },

        _onCreate: function(){
            if(this._created){
                return;
            }else{
                this._created=true;
            }
            this._publishReady();
            if(!this.options.skipInit){
                this._initElement();
                this.__onInit();
            }
            this._setAttributes();
            var evt_ = this.widgetName.toLowerCase() + '.loaded';
            $(window).trigger(evt_, { target: this.element });
            this.__componentCallbacks();
        },

        _publishReady: function(){
            this._onEventTrigger('loaded',this.element);
        },

        /**
         * init Element
         */
        _initElement: $.noop,

        /**
         * generally, should not overwrite this
         * @private
         */
        __onInit:function(){
            this._events();
            this._onInit();
        },

        /**
         * @private
         */
        _onInit: $.noop,


        /**
         * called by default by _onInit; event listener registrations should go here, although this is not a requirement
         */
        _events: $.noop,

        /**
         * event facade
         * register an event listener that is automatically disposed on _destroy()
         * if unbind=true, it is destroyed on any call to _unbindEvents() within the $.element lifecycle
         * NOTE: using the _event facade for event handling not a requirement, just a convenience. The convenience of this
         * facade pattern is not in writing event handlers per se, but in automating the cleanup
         *
         *
         * NOTE: the facade wrapper supports event delegation but does not automatically delegate
         * this._event(li,click,function(event){}) ---> no delegation, listener is attached to each li
         * this._event(ul,click,'li',function(event){}) -->delegation, listener is attached to ul, li clicks bubble up
         *
         * @param element {Object}
         * @param event {String}
         * @param selector {String}
         * @param unbind {Boolean}
         * @param callback {Function}
         * @private
         */
        _event: function (element, event, selector,unbind,callback) {
            var obj = {};
            obj.element = element;
            obj.event = event;

            //support 3-5 params
            var length=arguments.length;
            if(length===3){
                callback=(typeof selector==='function') ? selector : null;
                unbind=false;
                selector=null;
            }else if(length===4){
                callback=(typeof unbind==='function') ? unbind : null;
                if(typeof selector==='boolean'){
                    unbind=selector;
                    selector=null;
                }else{
                    unbind=false;
                }
            }
            obj.selector=selector;
            obj.unbind = unbind;
            obj.callback=callback;
            if(!this._data || !this._data.events){
                return;
            }
            var arr = this._data.events;
            if ($.inArray(obj, arr) === -1) {
                this._data.events.push(obj);
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

        },

        /**
         * unbinds registered event listeners. When called from _destroy(), all events are disposed, regardless.
         * If called during the $.element lifecycle, events are disposed if unbind flag was set at registration
         * @param destroy {Boolean}
         * @private
         */
        _unbindEvents: function (destroy) {
            if (typeof destroy === 'undefined') {
                destroy = false;
            }
            if(!this._data || !this._data.events){
                return;
            }
            var events=this._data.events;
            $.each(events, function (index, obj) {
                if (!destroy) {
                    if (obj.unbind) {
                        (obj.selector) ? obj.element.off(obj.event,obj.selector) : obj.element.off(obj.event);
                        events.splice(index,1);
                    }
                } else {
                    (obj.selector) ? obj.element.off(obj.event,obj.selector) : obj.element.off(obj.event);
                    obj=null;
                }
            });

            if (destroy) {
                events.length=0;
                this._onUnbindEvents();
            }

        },

        /**
         * additional event cleanup, if needed, should be placed here. Invoked on _destroy()
         * @private
         */
        _onUnbindEvents: $.noop,

        _hide:function(){
            this.element.hide();
        },

        _show:function(){
            this.element.show();
        },

        _find:function(selector){
            return this.element.find(selector);
        },


        /**
         * destroy event
         * @private
         */
        _destroy: function () {
            if(!this._data){
                return;
            }
            this._onEventTrigger('destroyed',this.element);
            this._unbindEvents(true);
            this.__onDispose();
            this._dispose();
            this._onDestroy();
            $.removeData(this.element[0],'custom-' + this.widgetName);
            this._data._store=null;
            this._data.events.length=0;
            this._destroyed=true;
            var node=this.element[0];
            //var proto=Object.getPrototypeOf(node);
            //proto=null;
            node.__proto__=null;
        },

        __onDispose:function(){
            var that=this;
            if(this.__disposeFunc && this.__disposeFunc.length){
                this.__disposeFunc.forEach(function(f){
                    f.call(that);
                });
            }
        },

        /* custom element callback events */

        __componentCallbacks:function(){
            var element=this.element[0];
            var self=this;

        },

        _distributeContent:function(tagName,element,callback){
            _HTML5Imports.upgradeElement(tagName, element,callback);
        },

        _resetSemanticState:function(){
            this.element.removeClass('error')
                .removeClass('warning')
                .removeClass('success')
                .removeClass('info')
        },

        _setAttributes:function(){
            var element=this.element;
            var self=this;
            if(element[0].hasAttribute && element[0].hasAttribute('disabled')){
                element.query('input',function(result){
                    if(result[0]){
                        result.attr('disabled',true);
                    }
                    self._onDisabled(element);
                });
            }
            if(element[0].hasAttribute && element[0].hasAttribute('readonly')){
                element.query('input',function(result){
                    if(result[0]){
                        result.attr('readonly',true);
                    }
                    self._onReadOnly(element);
                });
            }
        },


        _onImport: $.noop,

        _attachedCallback: $.noop,

        _detachedCallback: $.noop,

        _attributeChangedCallback: $.noop,

        _onDisabled: $.noop,

        _onReadOnly: $.noop,



        /**
         * for cleanup
         * @private
         */
        _dispose: $.noop,


        /**
         * for cleanup
         * @private
         */
        _onDestroy: $.noop,

        instanceOf : function(){
            console.log(this);
            return true;
        },

        runInit:function(){
            this._initElement();
        },

        service:function(name){
            if(name===undefined && this.options){
                name=this.options.service;
            }
            if(this.__serviceLocator){
                return this.__serviceLocator(name);
            }else{
                var protoLocator= $.elliptical.element.prototype.__serviceLocator;
                if(protoLocator){
                    return protoLocator(name);
                }
            }
        },

        serviceAsync:function(name,callback){
            if(typeof name==='function'){
                callback=name;
                name=undefined;
            }
            var self=this;
            var INTERVAL=300;
            var MAX_COUNT=5;
            var count=0;
            var service=this.service(name);
            if(service && service!==undefined){
                callback(service);
            }else{
                var intervalId=setInterval(function(){
                    service=self.service(name);
                    if(service && service !==undefined){
                        clearInterval(intervalId);
                        callback(service);
                    }else if(count > MAX_COUNT){
                        clearInterval(intervalId);
                        callback(null);
                    }else{
                        count++;
                    }
                },INTERVAL);
            }
        }

    });

    function parseElementNameParams(s){
        var tagName=null;
        var name=null;
        var err=null;
        var arrNamespace=s.split('.');
        var arrTagName=s.split('-');
        if(arrNamespace.length > 1){
            name=s;
            tagName= s.replace('.','-');
        }else if(arrTagName.length > 1){
            tagName=s;
            name= arrTagName[0] + '.' + $.utils.string.dashToCamelCase(s);
        }else{
            err=true;
        }
        return {
            tagName:tagName,
            name:name,
            err:err
        }
    }

    /// a factory wrapper that returns an $.element factory for the supplied base function
    /// the $.element factory will register the element as a jquery ui widget with baseObject or base(if base is not undefined);
    /// register the element as a WC3 custom element (document.registerElement)
    $.elementFactory=function(baseObject){

        return function (ElementProto,name,tagName, base, prototype) {

            //widget base object
            var base_= null;
            //widget string namespace
            var name_=null;
            //registered element tag name
            var tagName_=null;
            //registered element prototype
            var ElementProto_=null;
            //widget prototype
            var prototype_=null;

            var objName;

            /* support 2-5 params */
            var length=arguments.length;
            if(length < 2){
                throw "Error: Element requires a minimum of two parameter types: string name and a singleton for the prototype"
            }else if(length===2){
                prototype_ = name;
                if(typeof ElementProto==='object'){
                    throw "Error: Element requires a string name parameter";
                }
                if(typeof name!=='object'){
                    throw "Error: Element requires a singleton for the prototype";
                }
                objName=parseElementNameParams(ElementProto);
                name_=objName.name;
                tagName_=objName.tagName;
                if(objName.err){
                    throw "Error: Element requires a string tag name or a namespaced name";
                }
            }else if(length===3){
                prototype_=tagName;
                if(typeof ElementProto==='object'){
                    if(typeof name!=='string'){
                        throw "Error: Element requires a string name parameter";
                    }
                    if(typeof tagName!=='object'){
                        throw "Error: Element requires a singleton for the prototype";
                    }
                    ElementProto_=ElementProto;
                    objName=parseElementNameParams(name);
                    name_=objName.name;
                    tagName_=objName.tagName;
                }else{
                    if(typeof name!=='string'){
                        objName=parseElementNameParams(ElementProto);
                        name_=objName.name;
                        tagName_=objName.tagName;
                        base_=name;
                    }else{
                        name_=ElementProto;
                        tagName_=name;
                    }
                }
            }else if(length===4){
                prototype_=base;
                if(typeof ElementProto==='object'){
                    ElementProto_=ElementProto;
                    if(typeof name!=='string'){
                        throw "Error: Element requires a string name parameter or tag name";
                    }
                    if(typeof tagName==='string'){
                        name_=name;
                        tagName_=tagName;
                    }else{
                        objName=parseElementNameParams(name);
                        name_=objName.name;
                        tagName_=objName.tagName;
                        base_=tagName;
                    }
                }else{
                    name_=ElementProto;
                    tagName_=name;
                    base_=tagName;
                }
            }else{
                prototype_=prototype;
                ElementProto_=ElementProto;
                name_=name;
                tagName_=tagName;
                base_=base;
            }


            if(!base_){
                base_=baseObject;
            }

            if(!tagName_){
                tagName_=name_.replace('.','-');
            }


            /* if no ElementPrototype defined, assign the HTMLElement prototype */
            if(!ElementProto_){
                var __proto__=HTMLElement.prototype;
                __proto__._name='HTMLElement';
                ElementProto_=__proto__;
            }

            //store the tagName as a "private variable" on the singleton
            prototype_._tagName=tagName_;

            /* implement using the extended jQuery UI factory */
            $.widget(name_, base_, prototype_);

            //method Name from namespaced name
            var methodName=name_.split('.')[1];

            /* register the element as a WC3 custom element */
            try{
                $.widget.register(methodName,tagName_,ElementProto_);
            }catch(ex){

            }


        };
    };



    /**
     * define the default $.element factory with baseObject $.elliptical.element
     * @param ElementProto {Object} <optional>, only should be supplied if the element not derived from HTMLElement
     * @param name {String} <optional> , optional if tagName is supplied
     * @param tagName {String} <optional>, optional if name is supplied
     * @param base {Object} <optional>
     * @param prototype {Object}
     */

    $.element = $.elementFactory($.elliptical.element);

    //register framework css components as custom elements

    $.element.custom=true;
    try{
        $.widget.registerFrameworkElements();
    }catch(ex){

    }
    $.widget.registerElement('ui-element');

    //register template elements
    try{
        $.widget.registerTemplateElements();
    }catch(ex){

    }

    /* make public props/methods available on $.element */
    for(var key in $.widget){
        $.element[key]= $.widget[key];
    }


    return $;

}));




//service locator injection

(function(){

    $.element.serviceLocator=function(fn,container){
        var proto={
            __serviceLocator:fn.bind(container)
        };

        $.extend($.elliptical.element.prototype,proto);
    };

})();

