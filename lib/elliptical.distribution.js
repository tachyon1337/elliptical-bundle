/**
 * Elliptical element content distribution and instantiation
 *
 * NOTE: There is no concept of "Shadow DOM" or "Shady DOM" in the elliptical implementation.
 *       There is simply the element's "Light DOM" and the element's definition, or document-fragment template
 *       Elliptical simply distributes the element's light DOM into the content insertion points defined in the element's template
 *       to create a cloned innerHTML fragment that is then inserted back into the element's light DOM to create an instance
 *
 *       The custom element's api is then implemented by a jQuery object instance api defined by the "prototype" injected into
 *       the applicable $.element, $.component factory. The factories extend jquery.ui.widget. So the element's private and public api
 *       is an extended jquery ui widget.
 *
 * NOTE: Content distribution for composite elements is recursive. The only caveat is that other custom elements in an element's light DOM should
 *       attributed with "content-init" to avoid premature jQuery instantiation which can result in the element's init code being executed twice.
 *       Once for the original element in the light DOM and once for the element in the re-inserted light DOM. The element's api is attached the jquery object and not
 *       to the element's prototype. In any event, premature instantiation is not a duplicate instantiation. The premature jquery object instance is destroyed with
 *       the original element removal.
 *
 *          <foo-element>
 *              <h1>Example of Elements in Foo's Light DOM</h1>
 *              <bar-element content-init></bar-element>
 *              <x-element content-init>
 *                  <h2 class="header">My Header</h2>
 *               </x-element>
 *          </foo-element>
 *
 *
 */
(function(){

    var Scope={
        linkImports:[],
        importElements:[],
        upgradeElementQueueFlag:false,
        mutationsArray:[]
    };

    function supportsTemplate() {
        if ($.browser.msie) {
            return false;
        }
        return ('content' in document.createElement('template'));
       
    }

    function isLightDOMElement(element) {
        try{
            if(element.hasAttribute('content-init')){
                return false;
            }
            return (element.getAttribute('definition')===null);
        }catch(ex){
            return false;
        }

    }

    function testAttr(attr){
        var patt=/href|tcmuri|rowspan|colspan|class|nowrap|cellpadding|cellspacing|ea/;
        return patt.test(attr);
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




    var NATIVE_TEMPLATE=supportsTemplate();
    var IMPORT_SELECTOR='link[rel="import"][property="elliptical"]';
    var ON_DOCUMENT_MUTATION='OnDocumentMutation';
    var ON_DOCUMENT_ADDED_MUTATION='OnDocumentAddedMutation';
    var WEB_COMPONENTS_READY='WebComponentsReady';
    var IMPORTS_LOADED='HTMLImportsLoaded';
    var PARSE_ATTR='parse-attr';
    var QUEUED_IMPORTS_INTERVAL=100;
    var QUEUE_TIMEOUT=500;
    var DISCOVER_TIMEOUT=800;
    var UPGRADE_TIMEOUT=10;
    var QUEUE_MAX=15;
    var READY_COUNT=0;
    var LINK_IMPORT_MAX_CHECK=40;


    var PolyFill={
        template:function(d){  //polyfills html5 template (IE & safari) http://jsfiddle.net/brianblakely/h3EmY/
            if(NATIVE_TEMPLATE){
                return false;
            }

            var qPlates = d.getElementsByTagName('template'),
                plateLen = qPlates.length,
                elPlate,
                qContent,
                contentLen,
                docContent;

            for(var x=0; x<plateLen; ++x) {
                elPlate = qPlates[x];
                qContent = elPlate.childNodes;
                contentLen = qContent.length;
                docContent = d.createDocumentFragment();

                while(qContent[0]) {
                    docContent.appendChild(qContent[0]);
                }

                elPlate.content = docContent;
            }
        },

        templateInnerHTML:function(template){  //polyfill unsupported template innerHTML
            if(NATIVE_TEMPLATE){
                return template.innerHTML;
            }else{
                var content=template.content;
                var innerHTML='';
                var childNodes=content.childNodes;
                var length=childNodes.length;
                for(var i=0;i<length;i++){
                    var ele=$(childNodes[i]);
                    var ele0=ele[0];
                    if(ele0.innerHTML !==undefined){
                        innerHTML+=ele0.outerHTML;
                    }

                }
                return innerHTML;
            }
        }
    };


    var Events={
        documentMutation:function(summary){
            $(document).trigger(ON_DOCUMENT_MUTATION,summary);
        },

        documentAddedMutation:function(added){
            $(document).trigger(ON_DOCUMENT_ADDED_MUTATION,{summary:added});
        },

        webComponentsReady:function(){
            setTimeout(function(){
                var event=document.createEvent("CustomEvent");
                event.initCustomEvent(WEB_COMPONENTS_READY, true, true, {});
                document.dispatchEvent(event);
            },QUEUE_TIMEOUT);
        }
    };

    var Observer={
        set:function(){
            $(document).mutationSummary("connect", this.on.bind(this), [{ all: true }]);
        },

        on:function(mutationSummary){
            Events.documentMutation(mutationSummary);
            var summary=mutationSummary[0];
            var self=this;
            if(summary.added){
                setTimeout(function(){
                    self.onAdded(summary.added);
                },QUEUE_TIMEOUT);

            }
        },

        onAdded:function(added){
            Events.documentAddedMutation(added);
            Parser.linkImportMutations(added);
            Parser.customElementMutations(added);
        }

    };

    var DOM={
        parser:function(markup){
            var doc = document.implementation.createHTMLDocument("");
            if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                doc.documentElement.innerHTML = markup;
            }
            else {
                doc.body.innerHTML = markup;
            }
            return doc;
        },

        walk:function(node,func,callback){
            func(node);
            node = node.firstChild;
            while (node) {
                this.walk(node, func);
                node = node.nextSibling;
            }
            callback();
        }
    };

    var Parser={
        bindLinkImports:function(){
            var links_=$(IMPORT_SELECTOR);
            var links=this.recursivelyGetLinks(links_);
            this.parseLinkImports(links);
        },

        linkImportMutations:function(added){
            var links_=$(added).selfFind(IMPORT_SELECTOR);
            if(links_[0]){
                Scope.upgradeElementQueueFlag=true;
                var links=this.recursivelyGetLinks(links_);
                if(links.length===0){
                    this.queueLinkImportMutations(links_);
                }else{
                    (this.verifyLinkImports(links)) ? this.throwReady(links) : this.queueLinkImports(links);
                }
            }
        },

        /**
         * throws WebComponents Ready event, resets Queue Flag to false, calls parseLinkImports
         * @param {array} links - array of link imports
         */
        throwReady:function(links){
            Events.webComponentsReady();
            Scope.upgradeElementQueueFlag=false;
            this.parseLinkImports(links);
        },

        /**
         * verifies link imports contain a template document fragment
         * @param {array} links
         * @returns {object}
         */
        verifyLinkImports:function(links){
            var link=links[0];
            var templates=this.getTemplateFromImport(link);
            return templates[0];
        },

        queueLinkImports:function(links){
            var self=this;
            this.onLinkImportsComplete(links,function(links){
                self.throwReady(links);
            });
        },

        onLinkImportsComplete:function(links,callback){
            var self=this;
            var count=0;
            var timeoutId=setInterval(function(){
                var imported=self.verifyLinkImports(links);
                if(imported || count > LINK_IMPORT_MAX_CHECK){
                    clearInterval(timeoutId);
                    callback(links);
                }else{
                    count++;
                }
            },QUEUED_IMPORTS_INTERVAL);

        },

        getTemplateFromImport:function(link){
            var doc=link.import;
            PolyFill.template(doc);
            return $(doc).find('template').not('[template]');
        },

        queueLinkImportMutations:function(links){
            var self=this;
            var timeoutId=setInterval(function(){
                links=self.recursivelyGetLinks(links);
                if(links[0]){
                    clearInterval(timeoutId);
                    self.verifyLinkImports(links);
                }
            },QUEUED_IMPORTS_INTERVAL);
        },

        recursivelyGetLinks:function(links){
            var _linkImports=[];
            var self=this;
            $.each(links,function(index,link){
                var arrLinks=self.recurseLink(link,[]);
                _linkImports=_linkImports.concat(arrLinks);
            });

            return _linkImports;
        },

        recurseLink:function(link,arr){
            if (!link.import) {
                return arr;
            } else {
                Scope.linkImports.push(link);
                arr.push(link);
                var all = link.import.all;
                if (all !== undefined) {
                    var length = all.length;
                    for (var i = 0; i < length; i++) {
                        var link_ = all[i];
                        var import_ = link_.import;
                        if (import_ !== undefined) {
                            this.recurseLink(link_,arr);
                        }
                    }
                    return arr;
                } else {
                    return arr;
                }
            }
        },

        parseLinkImports:function(links){
            var self=this;
            $.each(links,function(index,link){
                self.parseImportDocument(link,index);
            });
        },

        parseImportDocument:function(link,idx){
            var templates=this.getTemplateFromImport(link);
            var template = templates[0];
            
            if(template){
                var parentNode=template.parentNode;
                var tag=parentNode.tagName;
                var definitionAlreadyExists=this.checkForDuplicate(tag);
                if(!definitionAlreadyExists){
                    var templateStr=PolyFill.templateInnerHTML(template);
                    var parse=(this.parseAttribute(parentNode)) ? true : false;
                    var o_={tag:tag,index:idx,parse:parse,str:templateStr,template:template};
                    Scope.importElements.push(o_);
                }
            }
        },

        doUpgrade: function(element){
            var noTemplate=element.getAttribute('no-template');
            var upgraded=element.dataset.upgraded;
            return (!noTemplate && noTemplate !=='' && (upgraded===undefined || upgraded==='false'));
        },

        upgradeElement: function(element, parseAttr, template, templateStr,callback){
            /* if the element definition contains a 'parse-template' attribute, we will need to
             to regex replace ##attribute## occurrences in the definition with values in the instance
             before we clone the template.content and append to the element instance(hence, attributeBind)
             */
            //element.dataset.upgraded='parsing';
            var clone;
            var $element=$(element);
            if (parseAttr && element.attributes) {
                //clone template node content from definition
                clone = this.elementAttributeBind(element, templateStr);
                //merge the content with the innerHTML of the instance(replaces ui-template node in the definition with the instance innerHTML)
                clone = this.distributeContent(clone, element);
                $element.empty();
                try{
                    element.appendChild(clone);
                    $element.find('[content-init]').removeAttr('content-init');
                    $element.find('content').remove();
                    element.dataset.upgraded = true;
                    //publish the upgrade event
                    $(document).trigger('OnElementImport', { node: element });
                    if(callback){
                        callback(element);
                    }
                }catch(ex){
                    console.log(ex);
                }



            } else {
                var content = template.content;
                if(!content){
                    if(callback){
                        callback(element);
                    }
                }
                //IE issue: if template.content has no childNodes, create a new document-fragment from the templateStr
                if (content.childNodes && content.childNodes.length === 0) {
                    template = this.createTemplateNode(templateStr);
                }
                //clone template node content from definition
                clone = template.content.cloneNode(true);
                //merge the content with the innerHTML of the instance
                clone = this.distributeContent(clone, element);
                $element.empty();
                //append the cloned content to the element instance
                element.appendChild(clone);
                $element.find('[content-init]').removeAttr('content-init');
                $element.find('content').remove();
                element.dataset.upgraded = true;
                //publish the upgrade event
                $(document).trigger('OnElementImport', { node: element });
                if(callback){
                    callback(element);
                }
            }

        },

        parseAttribute:function(importNode){
            var att=importNode.getAttribute(PARSE_ATTR);
            return (att || att ==='');
        },

        elementAttributeBind: function(element,templateStr){
            var self=this;
            $.each(element.attributes, function(i, att){
                /* note: "{{ }}" interferes with other popular template engines, including dustjs
                 hence, we use "[[ ]]"
                 */
                var re = new RegExp("\\[\\[" + att.name + "\\]\\]","g");
                templateStr=templateStr.replace(re,att.value);

            });
            //replace undefined [[attr]] occurrences in the templateStr with an empty string
            templateStr=templateStr.replace(/\[\[(.*?)]]/g, '');
            templateStr=templateStr.replace(/\[\[/g, '');
            var template = self.createTemplateNode(templateStr);
            return template.content.cloneNode(true);
        },

        parseElementImport:function(tag,element,callback,queueRequest){
            var length=Scope.importElements.length;
            var elementImport=null;

            for(var i=0;i<length;i++){
                var tag_=Scope.importElements[i].tag;
                if(tag_.toLowerCase()===tag.toLowerCase()){
                    elementImport=Scope.importElements[i];
                    break;
                }
            }

            if(elementImport){
                var proto=Object.getPrototypeOf(element);
                if(proto._tagName !==undefined){
                    proto._imported=true;
                }
                var parseAttr=elementImport.parse;
                var templateStr=elementImport.str;
                var template=elementImport.template;
                if(this.doUpgrade(element)){
                    this.upgradeElement(element,parseAttr,template,templateStr,callback);
                }else{
                    if(callback){
                        callback(null);
                    }
                }

            }else{
                if(queueRequest){
                    this.queueParsingRequest(tag,element,callback);
                }
            }
        },

        queueParsingRequest:function(tag,element,callback){
            var count_=0;
            var self=this;

            var timeoutId=setInterval(function(){
                var proto=Object.getPrototypeOf(element);
                var hasBeenStampedForImport=false;
                if(proto && proto._tagName !==undefined){
                    if(proto._imported && proto._imported !==undefined){
                        hasBeenStampedForImport=true;
                    }
                }
                if(hasBeenStampedForImport || count_ > QUEUE_MAX){
                    if(callback){
                        callback(null);
                    }
                    clearTimeout(timeoutId);
                }else {
                    count_++;
                    self.parseElementImport(tag,element,callback,false);
                }

            },QUEUE_TIMEOUT);
        },

        distributeContent: function(clone,instance){
            var innerHtml = instance.innerHTML;
            innerHtml = (innerHtml.trim) ? innerHtml.trim() : innerHtml.replace(/^\s+/, '');
            if (innerHtml === '') {
                return clone;
            }
            var content = clone.querySelectorAll('content');
            if (content) if (content.length > 1) {
                for (var i = 0; i < content.length; i++) {
                    var select = content[i].getAttribute('select');
                    if (select) {
                        var node=instance.querySelector(select);
                        if(node){
                            $(content[i]).replaceWith(node);
                        }
                    }
                }
                return clone;
            } else {
                $(content[0]).replaceWith(innerHtml);
                return clone;
            } else {
                var contentForm = clone.querySelector('form');
                if (contentForm) {
                    $(contentForm).replaceWith(innerHtml);
                    return clone;
                } else {
                    return clone;
                }
            }
        },



        createTemplateNode:function(templateStr){
            templateStr = '<template>' + templateStr + '</template>';
            var doc = new DOMParser().parseFromString(templateStr, 'text/html');
            //mainly for safari here(???, native DOMParser for safari returning null)
            if (!doc) {
                doc = DOM.parser(templateStr);
            }
            PolyFill.template(doc);
            return doc.querySelector('template');
        },

        checkForDuplicate:function(tag){
            var length=Scope.importElements.length;
            var alreadyExists=false;
            for(var i=0; i<length;i++){
                var element_=Scope.importElements[i];
                if(tag===element_.tag){
                    alreadyExists=true;
                    break;
                }
            }
            return alreadyExists;
        },

        customElementMutations:function(added){
            if(!Scope.upgradeElementQueueFlag){
                Element.discover(added);
            }else{
                var timeoutId=setInterval(function(){
                    if(!Scope.upgradeElementQueueFlag){
                        clearInterval(timeoutId);
                        Element.discover(added);
                    }
                },QUEUED_IMPORTS_INTERVAL);
           }
        }
    };

    var Element={

        discover: function(added){
            var self=this;
            setTimeout(function(){
                self.discoverCustomElementDefinitions(added);
            },DISCOVER_TIMEOUT);

        },

        discoverCustomElementDefinitions:function(added,doc){
            var self=this;
            var definitions= $.widget.definitions;
            if(definitions && definitions.length){
                definitions.forEach(function(obj){
                    var elements = (doc) ? $(added).find(obj.tagName) : $(added).selfFind(obj.tagName);
                    if(elements && elements.length >0){
                        self.instantiateCustomElements(elements,obj.name);
                    }
                });
            }
        },

        instantiateCustomElements:function(elements,name){
            var self=this;
            $.each(elements,function(index,element){
                self.instantiate(element, name);
            });
        },

        instantiate:function(element, name){
            var $element = $(element);
            var camelCase = $element.attr('camel-case');
            if (camelCase === undefined) {
                camelCase = true;
            }
            //check is light DOM element and not already instantiated
            var isDOM=isLightDOMElement(element);
            if(isDOM){
                var isInstantiated = this.isInstantiated(element, name);
                var proto = Object.getPrototypeOf(element);
                if (!isInstantiated) {
                    if (proto._tagName === undefined) {
                        this.assignPrototype(element);
                    }
                    var opts = this.getOpts(element, camelCase);
                    $element[name](opts);
                }
            }
        },

        isInstantiated:function(node,name){
            var dataset=node.dataset;
            if(dataset.upgraded===undefined){
                dataset.upgraded=false;
            }
            return (name=== $.data(node,'custom-' + name));
        },

        assignPrototype:function(element){
            var proto = undefined;
            var tagName = element.tagName.toLowerCase();
            var length = $.widget.upgraded.length;
            var upgraded = $.widget.upgraded;
            for (var i = 0; i < length; i++) {
                if (tagName === upgraded[i].tagName.toLowerCase()) {
                    proto = upgraded[i].proto;
                    break;
                }
            }
            if (proto !== undefined) {
                element.__proto__ = proto;
            }
        },

        getOpts:function(element,camelCase){
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
                        (opt !== 'template') ? opts[opt.toCamelCase()] = booleanCheck(val.toCamelCase()) : (opts[opt] = booleanCheck(val));

                    }else{
                        opts[opt.toCamelCase()]= booleanCheck(val);
                    }
                }
            });

            return opts;
        }
    };


    /* listeners ---------------------------------------------------- */
    window.addEventListener(IMPORTS_LOADED, function(event) {
        Parser.bindLinkImports();
    });

    window.addEventListener(WEB_COMPONENTS_READY, function(event) {
        if(READY_COUNT===0){
            Element.discoverCustomElementDefinitions(document,true);
            READY_COUNT=1;
        }
    });


    Observer.set();

    //public api
    var HTML5Imports={};
    HTML5Imports.upgradeElement=function(tag,node,callback){
        Parser.parseElementImport(tag,node,callback,true);

    };

    HTML5Imports.instantiate=function(element,name){
        Element.instantiate(element,name);
    };

    window._HTML5Imports=HTML5Imports;


})();
