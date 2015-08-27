elliptical.module=(function (app) {

     //create the app
    app = elliptical();

    //app title
    app.context.siteTitle='Caracole Dashboard';

    //disable dashboard widgets && floating action button(fab)
    app.context.disableDashboard='disabled';
    app.context.fabHide='hide';

    //views root
    var viewsRoot='/views';

    //using local parallels api project
    var isLocalApi=false;

    //define native services
    var Service = elliptical.Service;
    var Sort=elliptical.Sort;
    var Location = elliptical.Router.Location;
    var Event=elliptical.Event;
    var http=elliptical.http;

    //define native providers
    var $Cookie=elliptical.providers.$Cookie;
    var $Rest=elliptical.providers.$Rest;
    var $ODataSort=elliptical.providers.$ODataSort;
    var $Template = elliptical.providers.$Template;

    //app Dependency Injection container
    var container=app.container;


    ////// Dashboard Widget Implementation Definitions...currently disabled in this project...requires Google Analytics backend
    //define the Dashboard Service "interface"
    elliptical.DashboardService=Service.extend({
        "@resource":'DashBoardService',
        element:null,
        show:function(element){this.$provider.show(element)},
        hide:function(key){
            var Settings=container.getType('Settings');
            var component=Settings.getDashboard(key);
            component.active=false;
            Settings.setDashboard(key,component);
        },
        refresh:function(element){this.$provider.refresh(element)},
        setElement:function(element) {this.element=element},
        onAfterGet:function(element,scope) {this.$provider.onAfterGet(element,scope)},
        action:function(element,params) {this.$provider.action(element,params)}
    },{
        element:null,
        show:function(element){this.constructor.show(element)},
        hide:function(key){this.constructor.hide(key)},
        refresh:function(element){this.constructor.refresh(element)},
        setElement:function(element){this.element=element},
        onAfterGet:function(element,scope){this.constructor.onAfterGet(element,scope)},
        action:function(element,params) {this.constructor.action(element,params)}

    });

    //extend service class for reporting
    elliptical.ReportService=Service.extend({
        getFilter:function(params){return this.$provider.getFilter(params)},
        sum:function(dateValue,prop,type,callback){this.$provider.sum(dateValue,prop,type,callback)}
    },{
        getFilter:function(params){return this.constructor.getFilter(params)},
        sum:function(dateValue,prop,type,callback){this.constructor.sum(dateValue,prop,type,callback)}
    });

    ////// End Dashboard widget implementation definitions //////////////////


    //inject the app container to implement the web component service locator
    $.element.serviceLocator(container.getType,container);


    //configure $Rest provider for dashboard run locally on localhost
    app.configure('development',function(){
        $Rest.protocol = 'http';
        $Rest.path = '/api';
        if(isLocalApi){
            $Rest.host = '192.168.1.125';
            $Rest.port = 3000;
        }else{
            $Rest.host = 'dashboard.caracole.misinteractive.com';
            $Rest.port=80;
        }
    });

    //configure $Rest,$Template providers for dashboard run remotely in browser
    app.configure('production',function(){
        $Rest.protocol = location.protocol.replace(':','');
        $Rest.path = '/api';
        $Rest.host = location.hostname;
        $Rest.port = ($Rest.protocol === 'https') ? 443 : 80;
        //set client-side views folder location under dashboard folder
        $Template.setRoot('/dashboard');
        viewsRoot='/dashboard/views';
        //set virtual root
        app.virtualRoot='/Dashboard';
    });

    //configuration for any mode
    app.configure(function(){
        //use hashTags for url routing
        app.hashTag=true;

        //page size and grid size constants
        app.PAGE_SIZE=9;
        app.GRID_SIZE=10;

        ////// middleware setup //////////////////////////////////////////////

        // middleware service locator
        app.use(elliptical.serviceLocator());

        ///global callback to handle route authentication
        app.use(elliptical.globalCallback(function (req, res, next) {
            var profileCookie=req.cookies.profile;
            if(profileCookie===undefined  && req.route !=='/profile/login'){
                res.redirect('/Profile/Login');
            }else{
                next();
            }
        }));

        //app.router
        app.use(app.router);

        //error
        app.use(elliptical.httpError());

        //http 404
        app.use(elliptical.http404());

        ////// end middleware ////////////////////////////////////////////////////
    });

    //instance of the $Rest provider
    var $rest = new $Rest();

    //asp.net OData prop settings for pagination
    Service.$paginationProvider.count = 'count';
    Service.$paginationProvider.data = 'items';

    //handle token authorization in the request
    $rest.onSend=function(req, options, resource, callback){
        var profile=$Cookie.get('profile');
        if(profile && profile !==undefined){
            var token=profile.apiToken;
            options.authorization=http.encodeSessionToken(token);
        }
        callback.call(this,null,options);
    };

    //IoC registrations
    container.mapType('Service',Service, $rest);
    container.registerType('Location',Location);
    container.registerType('Event',Event);
    container.registerType('$Cookie',$Cookie);
    container.registerType('$Rest',$Rest);
    container.registerType('$rest',$rest);
    container.mapType(Sort,$ODataSort);

    /* listen */
    app.listen(true,function(){
        //load in the menu and toolbar into the global layout on page load
        $.get(viewsRoot + '/shared/md-menu.html',function(data){
            var menuPlaceholder=$('[data-menu-placeholder]');
            menuPlaceholder.html(data);
        });
        $.get(viewsRoot + '/shared/md-toolbar.html',function(data){
            var toolbarPlaceholder=$('[data-toolbar-placeholder]');
            toolbarPlaceholder.html(data);
        });
        //set site title in title tag
        $('title').html(app.context.siteTitle);

    }); //single page app

    return app;

})(elliptical.module);
elliptical.module = (function (app) {
    var container = app.container;

    elliptical.binding('alt-image', function (node) {

        var $node=$(node);
        var currentImg=null;
        var Event=container.getType('Event');
        var Notify=container.getType('Notify');

        this.event($(window),'autocomplete.focus',onInputFocus);
        this.event($(window),'autocomplete.reset',onInputReset);
        this.event($node,this.click,'alt-image',onClick);
        var handleDelete=Event.on('alt-image.delete',onDelete);
        var handleInsert=Event.on('alt-image.insert',onInsert);
        var handleUpdate=Event.on('alt-image.update',onUpdate);
        var handleError=Event.on('alt-image.error',onError);

        var alt={
            _id:null,
            get image(){
                return $node.find('[data-id="' + this._id + '"]');
            },

            set id(val){
                this._id=val;
            },

            get new(){
                return $('<alt-image data-id="' + this._id + '" class="active"><img src="http://media.r3vstack.com/assets/caracole/' + this._id + '?width=100&height=100" data-img="' + this._id + '"></alt-image>');
            },

            get src(){
                return 'http://media.r3vstack.com/assets/caracole/' + this._id + '?width=100&height=100';
            }

        };

        function removeActive(){
            $node.find('alt-image').removeClass('active');
        }

        function onInputFocus(event,data){
            currentImg=data.value;
            removeActive();
            alt.id=currentImg;
            alt.image.addClass('active');
        }

        function onInputReset(event,data){
            removeActive();
            currentImg=null;
        }

        function onClick(event){
            removeActive();
            var target=$(event.currentTarget);
            target.addClass('active');
            currentImg=target[0].dataset.id;
            Event.emit('alt-image.select',{value:currentImg});
        }

        function onDelete(data){
            alt.id=data.value;
            alt.image.remove();
            currentImg=null;
        }

        function onInsert(data){
            alt.id=data.value;
            removeActive();
            $node.append(alt.new);
            currentImg=data.value;
            notify('Alt Image Added');
        }

        function onUpdate(data){
            removeActive();
            alt.id=data.oldValue;
            var altImage=alt.image;
            var img=altImage.find('img');
            alt.id=data.value;
            var src=alt.src;
            img.attr('src',alt.src);
            altImage[0].dataset.id=data.value;
            altImage.addClass('active');
            img[0].dataset.img=data.value;
            notify('Alt Image Updated');
        }

        function onError(data){
            notify(data.message);
        }

        function notify(message){
            var _notify= new Notify();
            _notify.show(message);
        }

        this.onDestroy=function(){
            Event.off(handleDelete);
            Event.off(handleInsert);
            Event.off(handleUpdate);
            Event.off(handleError);
        }

    });

    return app;
})(elliptical.module);
/// binds the Dashboard icon cards to dashboard datepicker changes

elliptical.module = (function (app) {

    var container = app.container;
    var EVENT_NAME='db.datapicker.change';

    elliptical.binding('cards', function (node) {
        var $node=$(node);
        var Event=container.getType('Event');
        var DatePicker=null;
        var handle=Event.on(EVENT_NAME,populate);

        this.onDestroy=function(){
          Event.off(handle);
        };

        function populate(dateValue){
            var Async=container.getType('Async');
            var Order=container.getType('Order');
            var User=container.getType('User');
            var StatisticsGraph=container.getType('StatisticsGraph');

            Async([
                function(callback){callback(null,'N/A')},
                function(callback){callback(null,'N/A')},
                function(callback){callback(null,'N/A')},
                function(callback){callback(null,'N/A')}
            ],function(err,results){
                updateOrders(results[0]);
                updateSales(results[1]);
                updateUsers(results[2]);
                updateVisits(results[3]);
                updateDateRange();
            });
        }


        function updateOrders(data){
            var span=$node.find('[data-id="orders"]');
            span.text(data);
        }

        function updateSales(data){
            var span=$node.find('[data-id="sales"]');
            //var sales=data.toFixed(2);
            var sales=data;
            span.text(sales);
        }

        function updateUsers(data){
            var span=$node.find('[data-id="users"]');
            span.text(data);
        }

        function updateVisits(data){
            var span=$node.find('[data-id="visits"]');
            span.text(data);
        }

        function updateDateRange(){
            var span=$('[data-id="date-range"]');
            //var range=DatePicker.getDateRange();
            //if(range){
                //span.text(range);
            //}
            span.text('N/A');
        }

        //var datePicker=container.getType('DatePicker');
        //DatePicker=datePicker;
        //var dateValue=datePicker.getDate();
        var dateValue=undefined;
        populate(dateValue);
    });


    return app;
})(elliptical.module);
///Dashboard Settings Binding: Listens for changes in the switch settings in Settings > Dashboard and calls the Settings service
/// to update the persistence store

elliptical.module = (function (app) {
    var container = app.container;

    elliptical.binding('dashboard-settings', function (node) {
        this.event($(document),'md.switch.change',onChange);

        function onChange(event,data){
            var Settings=container.getType('Settings');
            var component=Settings.getDashboard(data.id);
            component.active=data.checked;
            Settings.setDashboard(data.id,component);
        }
    });


    return app;
})(elliptical.module);
/// deletes the currently active/selected value from the key collection
/// sets the currently active value by listening for (1) autocomplete focus event (2) value element click

elliptical.module = (function (app) {
    var container = app.container;

    elliptical.binding('delete-association', function (node) {

        var $node=$(node);
        var key=node.dataset.key;
        var keyProp=node.dataset.keyProp;
        var channel=node.dataset.channel;
        var valueProp=node.dataset.valueProp;
        var label=node.dataset.label;
        var currentValue=null;
        var Event=container.getType('Event');
        var ConfirmDialog=container.getType('ConfirmDialog');
        var Notify=container.getType('Notify');
        var Image=container.getType('Image/DeleteImage');

        this.event($(window),'autocomplete.focus',onInputFocus);
        this.event($(window),'autocomplete.reset',onInputReset);
        this.event($node,this.click,onDelete);
        var handleSelect=Event.on(channel + '.select',onSelect);
        var handleInsert=Event.on(channel + '.insert',onInsert);
        var handleUpdate=Event.on(channel + '.update',onUpdate);
        var handleItemDelete=Event.on('item.delete',onItemDelete);

        function onInputFocus(event,data){
            if(data.id!==undefined){
                currentValue=data.value;
                $node.removeClass('disabled');
            }
        }

        function onSelect(data){
            currentValue=data.value;
            $node.removeClass('disabled');
        }

        function onDelete(){
            if($node.hasClass('disabled') || currentValue===null){
                return;
            }
            var dialog=new ConfirmDialog();
            dialog.setContent('Confirm Delete','Are you sure you wish to delete the selected ' + label + '?');
            dialog.show(function(confirmed){
                if(confirmed){
                    handleDelete();
                }
            });
        }

        function handleDelete(){
            var params={};
            params[keyProp]=key;
            params[valueProp]=currentValue;
            Image.post(params,function(err,data){
                (err) ? notify('Error Deleting ' + label) : onSuccess();
            });
        }

        function onInsert(data){
            $node.removeClass('disabled');
            currentValue=data.value;
        }

        function onUpdate(data){
            $node.removeClass('disabled');
            currentValue=data.value;
        }

        function onInputReset(){
            $node.addClass('disabled');
            currentValue=null;
        }

        function onSuccess(){
            notify(label + ' Deleted');
            Event.emit(channel + '.delete',{value:currentValue});
            $node.addClass('disabled');
            currentValue=null;
        }

        function notify(message){
            var _notify= new Notify();
            _notify.show(message);
        }

        function onItemDelete(){
            $node.addClass('disabled');
            currentValue=null;
        }

        this.onDestroy=function(){
            Event.off(handleSelect);
            Event.off(handleInsert);
            Event.off(handleUpdate);
            Event.off(handleItemDelete);
        }

    });


    return app;
})(elliptical.module);
/// generic detail view binding
/// node element with the ea binding in the view should have the following attributes set:
/// service,label


elliptical.module = (function (app) {
    var container = app.container;

    elliptical.binding('detail', function (node) {
        var $node=$(node);
        var serviceName=$node.attr('service');
        var label=$node.attr('label');
        var Service=container.getType(serviceName);
        var ConfirmDialog=container.getType('ConfirmDialog');
        var Notify=container.getType('Notify');

        var deleteItem=$node.find('[action="delete"]');
        this.event($node,this.click,'[action="delete"]:not(.disabled)',onDelete);

        function onDelete(event){
            var dialog=new ConfirmDialog();
            dialog.setContent('Confirm Delete','Are you sure you wish to delete this ' + label.toLowerCase() + '?');
            dialog.show(function(confirmed){
                if(confirmed){
                    _handleDelete();
                }
            });
        }

        function _handleDelete(){
            var id=deleteItem[0].dataset.id;
            var notify= new Notify();
            Service.delete({id:id},function(err,data){
                var message=(err) ? 'Error: Error deleting ' + label.toLowerCase() : label + ' has been deleted';
                notify.show(message);
                _addDisabledClass();
            });
        }

        function _addDisabledClass(){
            deleteItem.addClass('disabled');
        }

    });


    return app;
})(elliptical.module);
/// Calls the Dialog service when the FAB is clicked

elliptical.module = (function (app) {
    var container=app.container;
    elliptical.binding('fab',function(node){

        this.event($(node),this.click,onClick);

        function onClick(event){
            var service=container.getType('FabTransform');
            service.show();
        }
        var type=node.getAttribute('fab-type');
        if(type==='orders'){
            forOrders();
        }

        function forOrders(){
            var datePicker=$('db-datepicker');
            datePicker.dbDatepicker('clear');

        }
    });

    return app;
})(elliptical.module);
elliptical.module = (function (app) {
    var container = app.container;

    elliptical.binding('image-sku', function (node) {

        var $node=$(node);
        var currentSku=null;
        var Event=container.getType('Event');
        var Notify=container.getType('Notify');

        this.event($(window),'autocomplete.focus',onInputFocus);
        this.event($(window),'autocomplete.reset',onInputReset);
        this.event($node,this.click,'span',onClick);
        var handleDelete=Event.on('sku.delete',onDelete);
        var handleInsert=Event.on('sku.insert',onInsert);
        //var handleUpdate=Event.on('sku.update',onUpdate);
        var handleError=Event.on('sku.error',onError);

        var sku={
            _id:null,
            get label(){
                return $node.find('[data-id="' + this._id + '"]');
            },

            set id(val){
                this._id=val;
            },

            get new(){
                return $('<span data-id="' + this._id + '" class="active">' + this._id + '</span>');
            },

            get src(){
                return 'http://media.r3vstack.com/assets/caracole/' + this._id + '?width=100&height=100';
            }

        };

        function removeActive(){
            $node.find('span').removeClass('active');
        }

        function onInputFocus(event,data){
            currentSku=data.value;
            removeActive();
            sku.id=currentSku;
            sku.label.addClass('active');
        }

        function onInputReset(event,data){
            removeActive();
            currentSku=null;
        }

        function onClick(event){
            removeActive();
            var target=$(event.currentTarget);
            target.addClass('active');
            currentSku=target[0].dataset.id;
            Event.emit('sku.select',{value:currentSku});
        }

        function onDelete(data){
            sku.id=data.value;
            sku.label.remove();
            currentSku=null;
        }

        function onInsert(data){
            sku.id=data.value;
            removeActive();
            $node.append(sku.new);
            currentSku=data.value;
            notify('Sku Added');
            var imageTool=$('image-selection-tool');
            imageTool.imageSelectionTool('disableInput',data.value);

        }

        function onUpdate(data){
            removeActive();
            sku.id=data.oldValue;
            var skuLabel=sku.label;
            skuLabel.text(data.value);
            sku.id=data.value;
            skuLabel[0].dataset.id=data.value;
            notify('Sku Updated');
        }

        function onError(data){
            notify(data.message);
        }

        function notify(message){
            var _notify= new Notify();
            _notify.show(message);
        }

        this.onDestroy=function(){
            Event.off(handleDelete);
            Event.off(handleInsert);
            //Event.off(handleUpdate);
            Event.off(handleError);
        }

    });

    return app;
})(elliptical.module);
/// generic list view binding
/// node element with the ea binding in the view should have the following attributes set:
/// service,label,item-selector,detail-action
/// the items in the list/repeating item element should have a data-id attribute set
/// detail-action is a string template , e.g.,'/Detail/[id]', that replaces [id] with the data-id value

/// this binding should be complimented by a binding or listener that has an Event listener(Event.on, not a DOM listener)
/// for the EVT_CHANNEL in order to sync the count display

elliptical.module = (function (app) {

    var EVT_CHANNEL='list.change';
    var container=app.container;

     elliptical.binding('list',function(node){
         var $node=$(node);
         var serviceName=$node.attr('service');
         var Async=container.getType('Async');
         var label=$node.attr('label');
         label=(label && label !==undefined) ? label : 'item(s)';
         var itemSelector=$node.attr('item-selector');
         itemSelector=(itemSelector && itemSelector !==undefined) ? itemSelector : 'li';
         var detailAction=$node.attr('detail-action');
         var Service=container.getType(serviceName);
         var ConfirmDialog=container.getType('ConfirmDialog');
         var Notify=container.getType('Notify');
         var Event=container.getType('Event');
         var Location=container.getType('Location');


         var deleteItem=$node.find('[action="delete"]');
         var viewItem=$node.find('[action="view"]');

         this.event($(document),'md.checkbox.change',onCheckboxChange);
         this.event($node,this.click,'[action="delete"]:not(.disabled)',onDelete);
         this.event($node,this.click,'[action="view"]:not(.disabled)',onView);

         function onCheckboxChange(event,data){
             if(data.checked){
                 _removeDisabledClass();
             }else{
                 if(!_multiChecked()){
                     _addDisabledClass();
                 }
             }
         }

         function onDelete(event){
             var dialog=new ConfirmDialog();
             dialog.setContent('Confirm Delete','Are you sure you wish to delete the selected ' + label.toLowerCase() + '(s)?');
             dialog.show(function(confirmed){
                 if(confirmed){
                     _handleDelete();
                 }
             });
         }

         function onView(event){
             var checked=_getMultiChecked();
             var id=checked[0].dataset.id;
             var url=detailAction.replace('[id]',id);
             Location.redirect(url);
         }

         function _removeDisabledClass(){
             deleteItem.removeClass('disabled');
             viewItem.removeClass('disabled');
         }

         function _addDisabledClass(){
             deleteItem.addClass('disabled');
             viewItem.addClass('disabled');
         }

         function _getMultiChecked(){
             return $node.find('md-checkbox[checked]');
         }

         function _multiChecked(){
             var checked=_getMultiChecked();
             return (checked.length > 1);
         }

         function _handleDelete(){
             var checked=_getMultiChecked();
             var notify= new Notify();
             if(checked.length<2){
                 var id=checked[0].dataset.id;
                 _deleteFromDOM(id);
                 Service.delete({id:id},function(err,data){
                     (err) ? notify.show('Error: Error deleting ' + label.toLowerCase()) : onDeletions(label + ' has been deleted',1,notify);
                 });

             }else{
                 var ids=_getIds(checked);
                 var funcArray=[];
                 ids.forEach(function(i){
                     funcArray.push(function(callback){Service.delete({id:i},callback)});
                 });
                 Async(funcArray,function(err,results){
                     (err) ? notify.show('Error: Error deleting ' + label.toLowerCase() + '(s)') : onDeletions(ids,label + '(s) have been deleted',ids.length,notify);
                 });
             }
         }

         function onDeletions(ids,msg,count,notify){
             _deleteIdsFromDOM(ids);
             notify.show(msg);
             _addDisabledClass();
             Event.emit(EVT_CHANNEL,{removed:count});
         }

         function _deleteIdsFromDOM(ids){
             ids.forEach(function(id){
                _deleteFromDOM(id);
             });
         }

         function _deleteFromDOM(id){
             $node.find(itemSelector + '[data-id="' + id + '"]').remove();
         }

         function _getIds(checked){
             var ids=[];
             var length=checked.length;
             for(var i=0; i<length; i++){
                 ids.push(checked[i].dataset.id);
             }
             return ids;
         }

     });

    return app;
})(elliptical.module);
/// Handles setting the correct menu path on page load
/// also handles menu 404--menu can't match menu item to a route(applies mainly to history events, i.e back button)

elliptical.module = (function (app) {
    var container = app.container;

    elliptical.binding('menu', function (node) {
        this.event($(document),'md.menu.url.404',onUrl404);

        var menuService=container.getType('MenuService');
        menuService.setElement($(node));
        var Location=container.getType('Location');
        var path=Location.path;
        menuService.show(path);

        function onUrl404(event,data){
            var url=Location.href;
            if(url.indexOf('/Product')>-1){
                menuService.show('/Product/List/1?$orderBy=Number',true);
            }else if(url.indexOf('/Custom')>-1){
                menuService.show('/Custom/List/1?$orderBy=Number',true);
            }else if(url.indexOf('CustType=Caracole Classic')>-1){
                menuService.show('/Dealer/List/1?CustType=Caracole Classic',true);
            }else if(url.indexOf('CustType=Caracole Modern')>-1){
                menuService.show('/Dealer/List/1?CustType=Caracole Modern',true);
            }
        }

    });


    return app;
})(elliptical.module);
/// integrates elliptical service locator with Polymer components

elliptical.module = (function (app) {
    var container=app.container;
    elliptical.binding('paper-service',function(node){
        setTimeout(function(){
            node.service=function(name){
                return container.getType(name);
            }
        },800);

    });


    return app;
})(elliptical.module);
//Profile Binding: sets/updates the Avatar dropdown profile content

elliptical.module = (function (app) {
    var container = app.container;

    elliptical.binding('profile', function (node) {
        var $node=$(node);
        var Event=container.getType('Event');
        var handleLogin=Event.on('app.login',setUser);
        var handleLogout=Event.on('app.logout',setGuest);

        this.onDestroy=function(){
            Event.off(handleLogin);
            Event.off(handleLogout);
        };

        function init(){
            var Profile=container.getType('Profile');
            var _profile=Profile.authenticated();
            if(!_profile){
                setGuest();
            }else{
                setUser(_profile);
            }
        }

        function setGuest(){
            var obj={
                name:'Guest',
                link:'/Profile/Login',
                label:'Sign In'
            };
            updateDom(obj);
        }

        function setUser(p){
            var obj={
                name: p.name,
                link:'/Profile/Logout',
                label:'Sign Out'
            };
            updateDom(obj);
        }

        function updateDom(obj){
            var profileName=$node.find('[data-profile-name]');
            profileName.text(obj.name);
            var link=$node.find('[data-profile-link]');
            link.attr('href',obj.link);
            link.html(obj.label);
        }

        init();
    });


    return app;
})(elliptical.module);
/*

 elliptical.binding binds a closure to any mutated element(i.e,  elements added to the DOM) that has an "ea" attribute.
 The binding passes a reference to the HTML node to the closure

 <html-tag ea="my-binding"></html-tag>

 elliptical.binding("my-binding",function(node){
         ///the callback instance
 });

any callback instance automatically has this.event,this.OnDestroy, this.click, this.jsonParseMessage bound

because a closure with a bound element reference is a recipe for memory leaks in SPA apps, most events should be registered
using this.event which guarantees event unbinding on element destruction. If a handler is not registered with this.event, the handler should
be unbound using the this.OnDestroy.

unbound event handlers==memory leaks in SPAs

that being said, the closure is set to null when the element instance is destroyed, to snuff out the leaks


this.click is a click/touch event that replaces 'click'

 */

elliptical.module = (function (app) {
    var container = app.container;

    elliptical.binding('remove', function (node) {
        var $node=$(node);
        var id=node.dataset.id;
        var label=node.dataset.label;
        var Service=node.dataset.service;
        var ConfirmDialog=container.getType('ConfirmDialog');
        var Notify=container.getType('Notify');
        var Event=container.getType('Event');

        this.event($node,this.click,onDelete);


        function onDelete(){
            var dialog=new ConfirmDialog();
            dialog.setContent('Confirm Delete','Are you sure you wish to delete this ' + label + '?');
            dialog.show(function(confirmed){
                if(confirmed){
                    handleDelete();
                }
            });
        }

        function handleDelete(){
            /*Service.delete(id,function(err,data){
                (err) ? notify('Error Deleting ' + label) : onSuccess();
            });*/
            onSuccess();
        }

        function onSuccess(){
            var mainPanel=$('[main-panel]');
            mainPanel.addClass('hidden');
            notify(label + ' Deleted');
            Event.emit('item.delete',{});
        }

        function notify(message){
            var _notify= new Notify();
            _notify.show(message);
        }


    });


    return app;
})(elliptical.module);
/// toolbar search binding

elliptical.module = (function (app) {
    var container=app.container;

    elliptical.binding('search', function (node) {
        var Search=container.getType('Search');
        var Location=container.getType('Location');
        var $node=$(node);
        this.event($node,this.click,'button',onClick);
        this.event($node,'keypress',onKeypress);

        function onClick(event){
            var input=$(node).find('input');
            var val=input.val();
            var search=new Search();
            var url=_getUrl();
            if(val !==''){
                input.val('');
                search.find({url:url,value:val});
            }
        }

        function onKeypress(event){
            if (event.which !== 13) {
                return;
            }
            onClick(event);
        }

        function _getUrl(){
            return Location.href;
        }
    });


    return app;
})(elliptical.module);
elliptical.module = (function (app) {
    var container = app.container;
    var EVENT_NAME='db.datapicker.change';

    elliptical.binding('stats-graph', function (node) {
        var $node=$(node);
        var Event=container.getType('Event');
        var handle=Event.on(EVENT_NAME,refresh);

        this.onDestroy=function(){
            Event.off(handle);
        };

        function refresh(){

            $node.dbBarchart('refresh','line');
        }
    });


    return app;
})(elliptical.module);
/// updates pagination labels on list/grid deletions

elliptical.module = (function (app) {
    var container=app.container;
    var EVT_CHANNEL='list.change';

    elliptical.binding('to-label', function (node) {
        var Event=container.getType('Event');
        var count={
            _value:null,
            get value(){
               if(this._value){
                   return this._value;
               }else{
                   this._value=parseInt($(node).text());
                   return this._value;
               }
            },

            set value(val){
                this._value=val;
            }
        };

        var listen=Event.on(EVT_CHANNEL,onChange);

        this.onDestroy=function(){
            Event.off(listen);
        };

        function onChange(data){
            var _count=count.value;
            _count=(data.removed) ? _count - data.removed : _count + data.added;
            $(node).text(_count);
            count.value=_count;
        }

    });


    return app;
})(elliptical.module);
/// clears the document of tooltips on tooltip clicks, otherwise hovered tooltips will persist on screen when clicked because the
/// the SPA will clear the element when loading a new view but the tooltip is bound to Document, not to the content placeholder element

elliptical.module = (function (app) {
    elliptical.binding('tooltip',function(node){
        this.event($(node),this.click,function(event){
            $(document).tooltip('clear');
        });
    });

    return app;
})(elliptical.module);
elliptical.module = (function (app) {
    var container = app.container;
    var PAGE_SIZE=app.PAGE_SIZE;

    var Controller = new elliptical.Controller(app, 'Custom');
    Controller('/@action/:id', {
        List: function (req, res, next) {
            var Try=container.getType('Try');
            var Event=container.getType('Event');
            var serviceLabel="Items";
            var Custom=container.getType('Custom');
            var custom=new Custom();
            var page=req.params.id;
            Try(next,function(){
                custom
                    .paginate({
                        baseUrl:'/Custom/List',
                        rawUrl:req.url,
                        page:page,
                        pageSize:PAGE_SIZE
                    })
                    .filter(req.query)
                    .orderBy(req.query.$orderBy)
                    .get(function(err,result){
                        res.dispatch(err,next,function(){
                            res.context.items=result.data;
                            res.context.pagination=result.pagination;
                            res.context.count=result.pagination.count;
                            res.context.label=serviceLabel;
                            res.render(res.context);
                        });
                    });
            });
        },

        Detail:function(req,res,next){
            var Try=container.getType('Try');
            var Event=container.getType('Event');
            var Async=container.getType('Async');
            var Custom=container.getType('Custom');
            var Image=container.getType('Image');
            var id=req.params.id;
            Event.emit('route.search.morph',{});
            Try(next,function(){
                Async([
                    function(callback) { Custom.get({id:id},callback)},
                    function(callback) { Image.get({id:id},callback)}
                ],function(err,results){
                    res.dispatch(err,next,function(){
                        res.context.number=results[0].number;
                        res.context.product=results[0];
                        res.context.imgs=results[1];
                        res.render(res.context);
                    });
                });
            });
        }
    });

    return app;

})(elliptical.module);
elliptical.module = (function (app) {
    var container = app.container;
    var PAGE_SIZE=app.GRID_SIZE;

    var Controller = new elliptical.Controller(app, 'Dealer');
    Controller('/@action/:id', {
        List: function (req, res, next) {
            var Try=container.getType('Try');
            var Event=container.getType('Event');
            var serviceLabel="Dealers";
            var Dealer=container.getType('Dealer');
            var dealer=new Dealer();
            var page=req.params.id;
            Try(next,function(){
                dealer
                    .paginate({
                        baseUrl:'/Dealer/List',
                        rawUrl:req.url,
                        page:page,
                        pageSize:PAGE_SIZE
                    })
                    .filter(req.query)
                    .orderBy(req.query.$orderBy)
                    .orderByDesc(req.query.$orderByDesc)
                    .get(function(err,result){
                        res.dispatch(err,next,function(){
                            res.context.dealers=result.data;
                            res.context.pagination=result.pagination;
                            res.context.count=result.pagination.count;
                            res.context.label=serviceLabel;
                            res.render(res.context);
                        });
                    });
            });
        },

        Detail:function(req,res,next){
            var Try=container.getType('Try');
            var Event=container.getType('Event');
            var id=req.params.id;
            var Dealer=container.getType('Dealer');
            Event.emit('route.search.morph',{});
            Try(next,function(){
                Dealer.get({id:id},function(err,data){
                    res.dispatch(err,next,function(){
                        res.context.dealer=data;
                        res.context.method='put';
                        res.context.edit={};
                        res.context.edit.id=data.id;
                        res.context.action='Edit';
                        res.render(res.context);
                    });
                });
            });
        },

        Create:function(req,res,next){
            var Try=container.getType('Try');
            var Event=container.getType('Event');
            Event.emit('route.search.morph',{});
            Try(next,function(){

                res.context.dealer={};
                res.context.dealer.country='USA';
                res.context.dealer.types=[{key: "classic", value: false,label:"Caracole Classic"}, {key: "modern_artistry", value: false,label:"Modern Artistry"},{key:"modern_craftsman",value:false,label:"Modern Craftsman"}];
                res.context.dealer.boutique='N';
                res.context.method='post';
                res.context.action='Create';
                res.render(res.context,'detail');
            });
        }
    });

    return app;

})(elliptical.module);
elliptical.module = (function (app) {

    var Controller = new elliptical.Controller(app,'Help');
    Controller('/@action', {
        Index:function(req,res,next){
            var Try=req.service('Try');
            Try(next,function(){
                res.render(res.context);
            });
        }

    });


    return app;
})(elliptical.module);

elliptical.module=(function (app) {
    var container=app.container;
    var Controller = new elliptical.Controller(app,'Home');

    Controller('/@action', {
        Index:function(req,res,next){
            var Try=container.getType('Try');
            Try(next,function(){
                var Settings=container.getType('Settings');
                var dashboard;
                if(app.context.disableDashboard && app.context.disableDashboard !==undefined){
                    dashboard=null;
                }else{
                    dashboard=Settings.getDisplayModel();
                }
                res.context.dashboard=dashboard;
                res.render(res.context);
            });
        }
    });


    return app;

})(elliptical.module);

elliptical.module = (function (app) {
    var container = app.container;
    var PAGE_SIZE=app.PAGE_SIZE;

    var Controller = new elliptical.Controller(app, 'Image');
    Controller('/@action/:id', {
        List: function (req, res, next) {
            var Try=container.getType('Try');
            var Event=container.getType('Event');
            var serviceLabel="Items";
            var Image=container.getType('Image');
            var image=new Image();
            var page=req.params.id;
            Try(next,function(){
                image
                    .paginate({
                        baseUrl:'/Image/List',
                        rawUrl:req.url,
                        page:page,
                        pageSize:PAGE_SIZE
                    })
                    .filter(req.query)
                    .orderBy(req.query.$orderBy)
                    .get(function(err,result){
                        res.dispatch(err,next,function(){
                            res.context.items=result.data;
                            res.context.pagination=result.pagination;
                            res.context.count=result.pagination.count;
                            res.context.label=serviceLabel;
                            res.render(res.context);
                        });
                    });
            });
        },

        Detail:function(req,res,next){
            var Try=container.getType('Try');
            var Event=container.getType('Event');
            var Async=container.getType('Async');
            var Image=container.getType('Image/GetSkus');
            var id=req.params.id;
            Event.emit('route.search.morph',{});
            Try(next,function(){
                Async([
                    function(callback) { Image.get({id:id},callback)},
                    function(callback) { Image.get({},callback)}
                ],function(err,results){
                    res.dispatch(err,next,function(){
                        res.context.id=id;
                        res.context.image={};
                        res.context.image.id=id;
                        res.context.image.imageSkus=results[0];//skus associated with image
                        res.context.skus=results[1]; //all product skus
                        res.render(res.context);
                    });
                });
            });
        }
    });

    return app;

})(elliptical.module);
elliptical.module = (function (app) {
    var container = app.container;
    var PAGE_SIZE=app.PAGE_SIZE;

    var Controller = new elliptical.Controller(app, 'Product');
    Controller('/@action/:id', {
        List: function (req, res, next) {
            var Try=container.getType('Try');
            var Event=container.getType('Event');
            var serviceLabel="Items";
            var Product=container.getType('Product');
            var product=new Product();
            var page=req.params.id;
            Try(next,function(){
                product
                    .paginate({
                        baseUrl:'/Product/List',
                        rawUrl:req.url,
                        page:page,
                        pageSize:PAGE_SIZE
                    })
                    .filter(req.query)
                    .orderBy(req.query.$orderBy)
                    .get(function(err,result){
                        res.dispatch(err,next,function(){
                            res.context.items=result.data;
                            res.context.pagination=result.pagination;
                            res.context.count=result.pagination.count;
                            res.context.label=serviceLabel;
                            res.render(res.context);
                        });
                    });
            });
        },

        Detail:function(req,res,next){
            var Try=container.getType('Try');
            var Event=container.getType('Event');
            var Async=container.getType('Async');
            var Product=container.getType('Product');
            var Image=container.getType('Image');
            var id=req.params.id;
            Event.emit('route.search.morph',{});
            Try(next,function(){
                Async([
                    function(callback) { Product.get({id:id},callback)},
                    function(callback) { Image.get({id:id},callback)}
                ],function(err,results){
                    res.dispatch(err,next,function(){
                        res.context.number=results[0].number;
                        res.context.product=results[0];
                        res.context.imgs=results[1];
                        res.render(res.context);
                    });
                });
            });
        }
    });

    return app;

})(elliptical.module);
elliptical.module = (function (app) {
    var container=app.container;
    var Controller = new elliptical.Controller(app, 'Profile');

    Controller('/@action', {
        Index: function (req, res, next) {
            var Try = req.service('Try');
            Try(next, function () {
                var $Cookie=container.getType('$Cookie');
                var profile=$Cookie.get('profile');
                var Profile=container.getType('Profile');
                Profile.get({id:profile.id},function(err,data){
                    res.context.user=data;
                    res.context.method='put';
                    res.render(res.context);
                });
            });
        },

        Login: function (req, res, next) {
            var Try = req.service('Try');
            Try(next, function () {
                res.context.method='login';
                res.render(res.context);
            });
        },

        Logout: function (req, res, next) {
            var Try = req.service('Try');
            Try(next, function () {
                var $Cookie=container.getType('$Cookie');
                var profile=$Cookie.get('profile');
                var Profile=container.getType('Profile');
                Profile.logout({id:profile.id},function(err,data) {
                    res.dispatch(err,next,function(){
                        res.context.message=(err) ? err.message : data.message;
                        res.render(res.context);
                    });
                });
            });
        }

    });

    return app;

})(elliptical.module);

/*

 Controller is a factory that behave similar to asp.net controllers.
 The Controller constructor takes the app function and the controller name
 The Controller prototype takes a string route and an singleton(object literal) whose methods correspond to the controller's actions
 The string param is parsed by the Controller. The '@action' param corresponds to the action name, params prefaced by a colon : are route
 variables bound to the req.params object.

 /List/1  --> req.params.page=1

 Like asp/.net mvc, actions views should be named the same as the action and placed under a folder named the same as the controller, all placed
 under the "views" folder in the public root.

 root --> Views-->Orders-->list.html

 dust.js is the template engine.
 {#prop} --> forEach iterator over model property 'prop', acts as both an array and object iterator

 var Controller = new elliptical.Controller(app,'Orders');
 Controller('/@action/:page', {
    List:function(req,res,next){
       var Try=req.service('Try');
       Try(next,function(){
         res.render(res.context);  -->res.render==View, res.context==Model
       });
    }
 });



 */

elliptical.module = (function (app) {
    var container=app.container;
    var Controller = new elliptical.Controller(app,'Settings');

    Controller('/@action', {
        Index:function(req,res,next){
            var Try=container.getType('Try');
            Try(next,function(){
                var Settings=container.getType('Settings');
                res.context.settings=Settings.getDashboard();
                res.render(res.context);
            });
        }

    });

    return app;
})(elliptical.module);
elliptical.module = (function (app) {
    var menuService=null;
    app.history(function(params,container){
        var route=params.route;
        if(!menuService){
            menuService=container.getType('MenuService');
        }
        menuService.show(route);

    });


    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container = app.container;

    function ConfirmDialogProvider(){
        this.element=null;
        this.getElement=function(){
            if(this.element){
                return this.element;
            }else{
                return $('paper-confirm')[0];
            }
        };

        this.show=function(fn){
            var element=this.getElement();
            element.show(fn);
        };

        this.setContent=function(title,message){
            var element=this.getElement();
            element.setContent(title,message,false);
        };
    }

    container.registerType('$ConfirmDialogProvider', new ConfirmDialogProvider());

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container = app.container;
    var EVENT_NAME='db.datapicker.change';
    var FORMATTER='MMMM D, YYYY';

    function $DatePicker(){
        this.type=null;
        this.value=null;
        this.dateValue=null;
        this.dateRange=null;

        this.set=function(type,val){
            var filter='';
            var url='/Order/List/1?$filter=';
            var Location=container.getType('Location');
            var Moment=container.getType('Moment');
            var now=Moment().format('l');
            var _now=Moment(now);
            var strNow=_now.format(FORMATTER);
            if(type==='today'){
                filter=this.setToday(now,_now,strNow);

            }else if(type==='year-to-date'){
                filter=this.setYearToDate(Moment,strNow);

            }else if(type==='month-to-date'){
                filter=this.setMonthToDate(Moment,strNow)

            }else if(type==='range'){
                filter=this.setRange(Moment,val);
            }
            url+=filter;
            var currentPath=Location.path;
            if(currentPath !=='/'){
                Location.redirect(url);
            }else{
                var Event=container.getType('Event');
                Event.emit(EVENT_NAME,this.dateValue);
            }
        };

        this.get=function(){
            return this.value;
        };

        this.getDate=function(){
            return this.dateValue;
        };

        this.getType=function(){
            return this.type;
        };

        this._getDateRange=function(obj){
            var Moment=container.getType('Moment');
            var now=Moment().format('l');
            var _now=Moment(now);
            var strNow=_now.format(FORMATTER);
            return obj.format(FORMATTER) + ' - ' + strNow;
        };

        this.setToday=function(now,_now,strNow){
            var filter='Date eq ' + now;
            this.value='today';
            this.type='today';
            this.dateValue=_now;
            this.dateRange=strNow;
            return filter;
        };

        this.setYearToDate=function(Moment,strNow){
            var currentYear=Moment().format('YYYY');
            var yearDate='1/1/' + currentYear;
            var filter='Date ge ' + yearDate;
            this.value='year to date';
            this.type='year-to-date';
            this.dateValue=Moment(yearDate);
            this.dateRange=this.dateValue.format(FORMATTER) + ' - ' + strNow;
            return filter;
        };

        this.setMonthToDate=function(Moment,strNow){
            var currentMonth=Moment().format('MM');
            var currentYear=Moment().format('YYYY');
            var monthDate=currentMonth + '/1/' + currentYear;
            var filter='Date ge ' + monthDate;
            this.value='month to date';
            this.type='month-to-date';
            this.dateValue=Moment(monthDate);
            this.dateRange=this.dateValue.format(FORMATTER) + ' - ' + strNow;
            return filter;
        };

        this.setRange=function(Moment,val){
            var filter='Date ge ' + val.start + ' le ' + val.end;
            this.value=val.start + ' - ' + val.end;
            this.type='range';
            this.dateValue={
                start:Moment(val.start),
                end:Moment(val.end)
            };
            this.dateRange=this.dateValue.start.format(FORMATTER) + ' - ' + this.dateValue.end.format(FORMATTER);
            return filter;
        };
    }

    container.registerType('$DatePickerProvider',new $DatePicker());

    return app;
})(elliptical.module);
elliptical.module = (function (app) {
    var container = app.container;

    function FabTransformProvider(){
        this.dialog=null;
        this.getDialog=function(element){
            if(this.dialog){
                return this.dialog;
            }else{
                return $('md-dialog');
            }
        };

        this.show=function(element){
            var dialog=this.getDialog(element);
            dialog.mdDialog('show');
        };

        this.hide=function(){};

        this.listen=function(element){
            $(window).on('md.dialog.hide',function(event){
                element.mdFabTransform('reset');
            });
        };


    }

    container.registerType('$FabTransformProvider', new FabTransformProvider());



    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container = app.container;

    function MenuProvider(){
        this.element=null;
        this.show=function(url,suppress){
            var element=this.element;
            element.mdMenu('show',url,suppress);
        };
        this.setElement=function(element){
            this.element=element;
        }
    }

    container.registerType('$MenuProvider', new MenuProvider());

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container = app.container;

    function $ProfileProvider(){
        this.login=function(params,callback){
            var $rest=container.getType('$rest');
            //var $rest=new $Rest();
            $rest.post(params,'Login',callback);
        };

        this.logout=function(params,callback){
            var $rest=container.getType('$rest');
            //var $rest=new $Rest();
            $rest.get({},'Logout',callback);
        }
    }

    container.registerType('$ProfileProvider', new $ProfileProvider());

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container = app.container;

    function SearchMorphProvider(){
        this.toggleStatus=false;
        this.showElement=null;
        this.toggleElement=null;
        this.Event=null;

        this.listen=function(showElement,toggleElement){
            this.showElement=showElement;
            this.toggleElement=toggleElement;
            this.Event=container.getType('Event');
            this._onListen();
        };

        this._onListen=function(){
            this.Event.on('OnRouteDispatch',this._onDispatchHandler.bind(this));
            this.Event.on('route.search.morph',this._onListenHandler.bind(this));
            //var toggleElement=this.toggleElement;
            //toggleElement.on('touchclick',this._toggleElementOut.bind(this));
        };

        this._onListenHandler=function(){
            this.toggleStatus=true;
            this._animateShowElementOut();
        };

        this._onDispatchHandler=function(){
            if(this.toggleStatus){
                this.toggleStatus=false;
                this._animateToggleElementOut();
            }
        };

        this._animateShowElementOut=function(){
            var self=this;
            var showElement=this.showElement;
            var show=showElement[0];
            move(show)
                .set('opacity', 0)
                .duration('.3s')
                .ease('snap')
                .end(function () {
                    self._animateToggleElementIn();
                });
        };

        this._animateToggleElementIn=function(){
            var toggleElement=this.toggleElement;
            var toggle=toggleElement[0];
            toggleElement.addClass('opacity-0')
                .addClass('inline-important');
            move(toggle)
                .set('opacity',1)
                .duration('.3s')
                .ease('snap')
                .end(function(){
                    toggleElement.removeClass('opacity-0');
                });
        };



        this._animateShowElementIn=function(){
            var self=this;
            var showElement=this.showElement;
            var show=showElement[0];
            move(show)
                .set('opacity', 1)
                .duration('.3s')
                .ease('snap')
                .end(function () {
                    self._clearStyles();
                });
        };


        this._animateToggleElementOut=function(){
            var self=this;
            var toggleElement=this.toggleElement;
            var toggle=toggleElement[0];
            move(toggle)
                .set('opacity', 0)
                .duration('.3s')
                .ease('snap')
                .end(function () {
                    toggleElement.removeClass('inline');
                    self._animateShowElementIn();
                });
        };

        this._clearStyles=function(){
            var showElement=this.showElement;
            var toggleElement=this.toggleElement;
            showElement.attr('style','');
            toggleElement.attr('style','');
            toggleElement.removeClass('inline-important');
        };

    }

    container.registerType('$SearchMorphProvider', new SearchMorphProvider());

    return app;
})(elliptical.module);
elliptical.module = (function (app) {
    var container=app.container;
    var Location=container.getType('Location');


    function $SearchProvider(){
        this.find=function(params){
            var url=params.url;
            var val=params.value;
            Location.href=this._getSearchUrl(url,val);
        };

        this._getSearchUrl=function(url,val){
            var $NotifyProvider=container.getType('$NotifyProvider');
            var href;
            if(url.indexOf('/Dealer') > -1) {
                //var custType = Location.url.queryString(url, 'CustType');
                href = '/Dealer/List/1?sw_Dealer1=' + val;
                $NotifyProvider.show("Searching for '" + val + "'", 3000);
                return href;
            }else if(url.indexOf('/Image') > -1){
                href='/Image/List/1?sw_Img=' + val + '&$orderBy=Img';
                $NotifyProvider.show("Searching for '" + val + "'",3000);
                return href;
            }else if(url.indexOf('/Custom') > -1){
                href='/Custom/List/1?sw_Number=' + val.toLowerCase() + '&$orderBy=Number';
                $NotifyProvider.show("Searching for '" + val + "'",3000);
                return href;
            }else{
                href='/Product/List/1?sw_Number=' + val.toUpperCase() + '&$orderBy=Number';
                $NotifyProvider.show("Searching for '" + val + "'",3000);
                return href;
            }

        };


    }

    container.registerType('$SearchProvider', new $SearchProvider());

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var Provider = elliptical.Provider;
    var $Local=elliptical.providers.$Local;
    var container = app.container;


    function _get(model,key){
        return _.find(model,function(obj){
            return obj.key===key;
        })
    }

    function _replace(model,key,newObj){
        var old=_get(model,key);
        for(var k in old){
            if(old.hasOwnProperty(k)){
                if(newObj[k] !==undefined){
                    old[k]=newObj[k];
                }
            }
        }
    }

    function _Settings(){

        this.init=function(){
            var model={
                range:'month-to-date',
                type:'month-to-date',
                dateValue:null,
                dateRange:null,
                now:null,
                dashboard:[]
            };

            model.dashboard.push(this.createComponent('StatisticsGraph','Statistics Graph',true));
            model.dashboard.push(this.createComponent('TrendsGraph','Trends Graph',true));
            model.dashboard.push(this.createComponent('RealTimeGraph','Real Time Graph',true));
            model.dashboard.push(this.createComponent('SocialGraph','Social Graph',true));
            model.dashboard.push(this.createComponent('BrowserUsage','Browser Usage',true));
            model.dashboard.push(this.createComponent('DeviceUsage','Device Usage',true));

            return model;
        };

        this.createComponent=function(key,name,active){
            return{
                key:key,
                name:name,
                active:active
            }
        }
    }


    var $Settings = Provider.extend({
        key:'Settings',
        create:function(){
            var settings=new _Settings();
            var obj=settings.init();
            $Local.set(this.key,obj);
            return obj;
        },

        get: function (key) {
            var settings=$Local.get(this.key);
            if(!settings && settings !==undefined){
                settings=this.create();
            }
            if(key){
                return settings[key];
            }else{
                return settings;
            }
        },

        set:function(key,value){
            var settings=this.get();
            settings[key]=value;
            $Local.set(this.key,settings);
        },

        getDashboard:function(key){
            var settings=this.get();
            if(key===undefined){
                return settings.dashboard;
            }else{
                return _.find(settings.dashboard,function(obj){
                    return obj.key===key;
                });
            }
        },

        setDashboard:function(key,value){
            var settings=this.get();
            var dashboard=settings.dashboard;
            _replace(dashboard,key,value);
            $Local.set(this.key,settings);
        },

        getDisplayModel:function(){
            var settings=this.get();
            var dashboard=settings.dashboard;
            var display={};
            for(var i=0;i<dashboard.length;i++){
                display[dashboard[i].key]= (dashboard[i].active) ? {} : '';
            }

            return display;
        }

    }, {});

    container.registerType('$Settings', $Settings);

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container = app.container;

    function ToastProvider(){
        this.element=null;
        this.getElement=function(){
            if(this.element){
                return this.element;
            }else{
                return $('paper-toast')[0];
            }
        };

        this.show=function(text,duration){
            var element=this.getElement();
            if(duration===undefined){
                duration=3000;
            }
            element.text=text;
            if(!element.visible){
                element.duration=duration;
                element.show();
            }
        };

        this.hide=function(){
            var element=this.getElement();
            element.hide();
        };

        this.visible=function(){
            var element=this.getElement();
            return element.visible;
        }
    }

    container.registerType('$NotifyProvider', new ToastProvider());

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container = app.container;

    container.registerType('Async', window.async.series);

    return app;
})(elliptical.module);
elliptical.module = (function (app) {
    var container = app.container;
    var Dialog=elliptical.Dialog;
    var ConfirmDialog=Dialog.extend({
        '@resource':'ConfirmDialog',
        setContent:function(title,message){return this.$provider.setContent(title,message)}
    },{
        setContent:function(title,message){ return this.constructor.setContent(title,message)}
    });


    container.mapType(ConfirmDialog,'$ConfirmDialogProvider');

    return app;
})(elliptical.module);
elliptical.module = (function (app) {
    var container=app.container;
    var DashboardService=elliptical.DashboardService;

    //// Statistics Graph Service
    var StatisticsGraph=DashboardService.extend({
        "@resource":'StatisticsGraph',
        get:function(params,callback){
            var self=this;
            var datePicker=container.getType('DatePicker');
            var dateValue=datePicker.getDate();
            var type=datePicker.getType();
            var query={};
            query.filter={
                val:dateValue,
                fn:this.$provider.dateRangePredicate(dateValue)
            };
            var viewModel=this._initViewModel();
            this.$provider.get({},query,function(err,data){

                //need to format the data to the chart view model
                switch(type){
                    case 'today':
                        viewModel.data.labels.push('today');
                        viewModel.data.series.push([data[0].visits]);
                        viewModel.data.series.push([data[0].pageViews]);

                        callback(null,viewModel);

                        break;

                    case 'month-to-date':
                        var monthToDate=self._monthToDateData(data);
                        viewModel.data.labels=monthToDate.labels;
                        viewModel.data.series.push(monthToDate.visitSeries);
                        viewModel.data.series.push(monthToDate.pageSeries);

                        callback(null,viewModel);

                        break;

                    case 'year-to-date':
                        var yearToDate=self._yearToDateData(data);
                        viewModel.data.labels=yearToDate.labels;
                        viewModel.data.series.push(yearToDate.visitSeries);
                        viewModel.data.series.push(yearToDate.pageSeries);

                        callback(null,viewModel);
                        break;

                    case 'range':
                        var rangeDates=self._rangeData(data);
                        viewModel.data.labels=rangeDates.labels;
                        viewModel.data.series.push(rangeDates.visitSeries);
                        viewModel.data.series.push(rangeDates.pageSeries);

                        callback(null,viewModel);
                        break;
                }
            });
        },

        _initViewModel:function(){
            var viewModel={
                legend:[{
                    label:'Unique Visits',
                    color:'color-1'
                },{
                    label:'Page Views',
                    color:'color-2'
                }],
                data:{
                    labels:[],
                    series:[]
                }
            };

            return viewModel;
        },

        _monthToDateData:function(data){
            //12 x-coordinates MAX
            var labels=[];
            var pageSeries=[];
            var visitSeries=[];
            var day=parseInt(moment().format('D'));

            if(day > 12){
                incrementDataModels('days 1-7',0,7,data,labels,pageSeries,visitSeries);
                if(day < 14){
                    incrementDataModels('days 8-' + day.toString(),8,day,data,labels,pageSeries,visitSeries);
                }else if(day < 21){
                    incrementDataModels('days 8-14',8,14,data,labels,pageSeries,visitSeries);
                    incrementDataModels('days 14-' + day,14,day,data,labels,pageSeries,visitSeries);
                }else{
                    incrementDataModels('days 8-14',8,14,data,labels,pageSeries,visitSeries);
                    incrementDataModels('days 14-21',14,21,data,labels,pageSeries,visitSeries);
                    incrementDataModels('days 21-' + day,21,day,data,labels,pageSeries,visitSeries);
                }
            }else{
                for(var i=0;i<day;i++){
                    var theDay=i+1;
                    labels.push(theDay.toString());
                    pageSeries.push(data[i].pageViews);
                    visitSeries.push(data[i].visits);
                }
            }

            return{
                labels:labels,
                pageSeries:pageSeries,
                visitSeries:visitSeries
            };

            function calculateSum(arr,prop,start,end){
                var sum=0;
                for(var k=start;k<end;k++){
                    sum+=arr[k][prop];
                }
                return sum;
            }
            function incrementDataModels(label,start,end,data,labelsArray,pageSeries,visitSeries){
                labelsArray.push(label);
                var pageSeriesSum=calculateSum(data,'pageViews',start,end);
                pageSeries.push(pageSeriesSum);
                var visitSeriesSum=calculateSum(data,'visits',start,end);
                visitSeries.push(visitSeriesSum);
            }
        },

        _yearToDateData:function(data){

            var currentMonth=parseInt(moment().format('M'));
            var labels=getLabels(currentMonth);
            var series=getDataSeries(data,currentMonth);
            return{
                labels:labels,
                pageSeries:series.page,
                visitSeries:series.visit
            };

            function getLabels(currentMonth){
                var labels=[];
                for(var i=0;i<currentMonth;i++){
                    var strMonth=(i+1).toString();
                    var strDate=strMonth + '/1/2015';
                    var dte=moment(strDate);
                    var mon=dte.format('MMM');
                    labels.push(mon);
                }

                return labels;
            }

            function getDataSeries(data){
                var _pageSeries=[];
                var _visitSeries=[];
                var length=data.length;
                var curMonth=1;
                var pageSum=0;
                var visitSum=0;
                for(var i=0;i<length;i++){
                    var month=data[i].month;
                    if(month===curMonth){
                        pageSum+=data[i].pageViews;
                        visitSum+=data[i].visits;
                    }else{
                        _pageSeries.push(pageSum);
                        _visitSeries.push(visitSum);
                        pageSum=0;
                        visitSum=0;
                        curMonth++;
                    }
                }
                return{
                    page:_pageSeries,
                    visit:_visitSeries
                }
            }
        },

        _rangeData:function(data){
            var labels=getLabels(data);
            var series=getDataSeries(data);
            return{
                labels:labels,
                pageSeries:series.page,
                visitSeries:series.visit
            };

            function getLabels(data){
                var length=data.length;
                var labels=[];
                var curMonth=null;
                var month_;
                for(var i=0;i<length;i++){
                    var month=data[i].month;
                    var date=data[i].date;
                    if(curMonth){
                        if(month!==curMonth){
                            month_=moment(date).format('MMM');
                            labels.push(month_);
                            curMonth=month;
                        }

                    }else{
                        curMonth=month;
                        month_=moment(date).format('MMM');
                        labels.push(month_);
                    }
                }

                return labels;
            }

            function getDataSeries(data){
                var _pageSeries=[];
                var _visitSeries=[];
                var length=data.length;
                var curMonth=null;
                var pageSum=0;
                var visitSum=0;
                for(var i=0;i<length;i++){
                    var month=data[i].month;
                    if(!curMonth){
                        curMonth=month;
                        pageSum+=data[i].pageViews;
                        visitSum+=data[i].visits;
                    }else{
                        if(month===curMonth){
                            pageSum+=data[i].pageViews;
                            visitSum+=data[i].visits;
                        }else{
                            _pageSeries.push(pageSum);
                            _visitSeries.push(visitSum);
                            pageSum=0;
                            visitSum=0;
                            curMonth++;
                        }
                    }
                }
                if(pageSum >0 && visitSum >0){
                    _pageSeries.push(pageSum);
                    _visitSeries.push(visitSum);
                }
                return{
                    page:_pageSeries,
                    visit:_visitSeries
                }
            }
        },


        //icon cards
        sum:function(dateValue,callback){
            var query={};
            query.filter={
                val:dateValue,
                fn:this.$provider.dateRangePredicate(dateValue)
            };
            this.$provider.get({},query,function(err,data){
                var sum=0;
                var length=data.length;
                for(var i=0;i<length;i++){
                    sum+=data[i].visits;
                }
                return callback(null,sum);
            });
        }

    },{
        sum:function(dateValue,callback){this.constructor.sum(dateValue,callback)}
    });





    var BrowserUsage=DashboardService.extend({
        "@resource":'BrowserUsage'
    },{});

    var DeviceUsage=DashboardService.extend({
        "@resource":'DeviceUsage'
    },{});

    var TrendsGraph=DashboardService.extend({
        "@resource":'TrendsGraph'
    },{});


    var TrendsGraphSales=DashboardService.extend({
        "@resource":'TrendsGraphSales'
    },{});

    var TrendsGraphTraffic=DashboardService.extend({
        "@resource":'TrendsGraphTraffic'
    },{});

    var TrendsGraphUsers=DashboardService.extend({
        "@resource":'TrendsGraphUsers'
    },{});

    var TrendsGraphOrders=DashboardService.extend({
        "@resource":'TrendsGraphOrders'
    },{});



    var SocialGraph=DashboardService.extend({},{});

    var RealTimeGraph=DashboardService.extend({},{});



    /*container.mapType(BrowserUsage, '$BrowserUsageProvider');
    container.mapType(DeviceUsage, '$DeviceUsageProvider');
    container.mapType(TrendsGraph, '$TrendsGraphProvider');
    container.mapType(TrendsGraphSales, '$TrendsGraphSalesProvider');
    container.mapType(TrendsGraphTraffic, '$TrendsGraphTrafficProvider');
    container.mapType(TrendsGraphUsers, '$TrendsGraphUsersProvider');
    container.mapType(TrendsGraphOrders, '$TrendsGraphOrdersProvider');
    container.mapType(StatisticsGraph, '$StatisticsGraphProvider');
    container.mapType('SocialGraph',SocialGraph,'$SocialGraphProvider');
    container.mapType('RealTimeGraph',RealTimeGraph,'$RealTimeGraphProvider');*/

    return app;
})(elliptical.module);
///DatePicker Service:
/// Sets Dates and Date Ranges from Selections made by the FAB Dashboard Datepicker
/// Also returns the current selections, get-->returns a text label for the selected range. getDate-->returns a valid JS date/date range
/// If get returns nothing, the service will set a default 'month-to-date' date range
/// the service will also update Settings values from an injected $Settings provider. This is to allow persistence across sessions
/// Finally, the service will set the Url filter string and notify any listeners of updated values
elliptical.module = (function (app) {

    var container = app.container;
    var FORMATTER='MMMM D, YYYY';

    function DatePicker(){
        this.$provider=this.constructor.$provider;
        this.set=function(type,val){
            this.$provider.set(type,val);
            var Settings=container.getType('$Settings');
            var value=this.$provider.value;
            var dateValue=this.$provider.dateValue;
            var dateRange=this.$provider.dateRange;
            var _type=this.$provider.type;
            var Moment=container.getType('Moment');
            var now=Moment();
            Settings.set('range',value);
            Settings.set('dateValue',dateValue);
            Settings.set('dateRange',dateRange);
            Settings.set('now',now);
            Settings.set('type',_type);
        };
        this.get=function(){
            return this.$provider.get();
        };
        this.getDate=function(){
            ///return dateValue
            var Moment=container.getType('Moment');
            var value=this.$provider.getDate();
            var Settings=container.getType('$Settings');
            var type=Settings.get('type');

            ///if range and value, return value (range is not dependent on a 'to-date' to today calculation)
            if(value && type==='range'){
                return value;
            }else if(type==='range'){
                var _dateValue=Settings.get('dateValue');
                if(_dateValue){
                    var start_=Moment(_dateValue.start);
                    var end_=Moment(_dateValue.end);
                    return {start:start_,end:end_};
                }
            }

            var invalidNow=true;
            var now=Moment().format('l');
            var _now=Moment(now);
            var strNow=_now.format(FORMATTER);
            var settingsNow=Settings.get('now');
            if(settingsNow){
                settingsNow=Moment(settingsNow);
                invalidNow=(_now===settingsNow);
            }

            ///if settings now is a valid now and value exists, return value
            if(value && !invalidNow){
                return value;
            }

            //if no type in settings, defaults to 'month-to-date'
            if(!type){
                type='month-to-date';
            }
            ///else, we need to update the settings now
            ///e.g., avoid Datepicker set for 'today', login a week later and getting 'today' as last week's value
            switch(type){
                case 'today':{
                    this.$provider.setToday(now,_now,strNow);
                    return this.$provider.dateValue;
                }
                case 'month-to-date':{
                    this.$provider.setMonthToDate(Moment,strNow);
                    return this.$provider.dateValue;
                }
                case 'year-to-date':{
                    this.$provider.setYearToDate(Moment,strNow);
                    return this.$provider.dateValue;
                }

            }

            return null;
        };

        this.getType=function(){
            var type=this.$provider.type;
            if(!type){
                var Settings=container.getType('$Settings');
                type=Settings.get('type');
                if(!type){
                    return 'month-to-date';
                }else{
                    return type;
                }
            }else{
                return type;
            }
        };

        this.getDateRange=function(){
            var range=this.$provider.dateRange;
            if(range){
                return range;
            }else{
                var Settings=container.getType('$Settings');
                range=Settings.get('dateRange');
                if(range){
                    this.$provider.dateRange=range;
                }
                return range;
            }
        };


    }


    container.mapType('DatePicker',new DatePicker(), '$DatePickerProvider');

    return app;
})(elliptical.module);
elliptical.module=(function (app) {

    var Dialog = elliptical.Dialog;
    var container=app.container;

    var FabTransform=Dialog.extend({
        '@resource':'FabTransform',
        listen:function(element){return this.$provider.listen(element)}
    },{
        listen:function(element){return this.constructor.listen(element)}
    });


    container.mapType(FabTransform,'$FabTransformProvider');

    return app;

})(elliptical.module);

elliptical.module = (function (app) {
    var container=app.container;
    function MenuService(){
        this.element=null;
        this.$provider=null;
        this.show=function(url,params){this.$provider.show(url,params)};
        this.setElement=function(element){this.$provider.setElement(element)};
    }
    container.mapType('MenuService', new MenuService(),'$MenuProvider');

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container = app.container;

    container.registerType('Moment', window.moment);

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var Notify=elliptical.Notify;
    var container = app.container;

    container.mapType(Notify, '$NotifyProvider');

    return app;
})(elliptical.module);
elliptical.module = (function (app) {
    var Service = elliptical.Service;

    var container = app.container;

    var Profile = Service.extend({
        "@resource": 'Profile',
        get: function(){
            var $Cookie=container.getType('$Cookie');
            return $Cookie.get('profile');
        },

        login: function (params,callback) {
            this.$provider.login(params,function(err,data){
                if(!err){
                    //success
                    var profile=data;
                    var Location=container.getType('Location');
                    var $Cookie=container.getType('$Cookie');
                    $Cookie.set('profile',profile);
                    var Event=container.getType('Event');
                    Event.emit('app.login',profile);
                    Location.redirect('/');

                }else{
                    //failure
                    var notify=container.getType('Notify');
                    notify.show('Invalid Login');
                }
            });
        },

        logout:function(params,callback){
            this.$provider.logout(params,function(err,data){
                if(!err){
                    var $Cookie=container.getType('$Cookie');
                    $Cookie.delete('profile');
                    var Event=container.getType('Event');
                    Event.emit('app.logout',null);
                    if(callback){
                        callback(null,{message:'You have been logged out from your account...'});
                    }
                }else{
                    if(callback){
                        callback(err,null);
                    }
                }

            });
        },

        authenticated:function(){
            var $Cookie=container.getType('$Cookie');
            var profile=$Cookie.get('profile');
            return (profile !==undefined && profile) ? profile : null;
        }

    }, {});


    container.mapType(Profile, '$ProfileProvider');

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container = app.container;

    function SearchMorphService(){
        this.$provider=this.constructor.$provider;
        this.listen=function(showElement,toggleElement){
            this.$provider.listen(showElement,toggleElement);
        }
    }


    container.mapType('SearchMorphService',SearchMorphService, '$SearchMorphProvider');

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container = app.container;
    var Search=elliptical.Search;
    container.mapType('Search',Search,'$SearchProvider');

    return app;
})(elliptical.module);
elliptical.module = (function (app) {
    var Store = elliptical.Store;
    var providers = elliptical.providers;
    var container = app.container;

    var Session=Store.extend({
        "@resource":"Session"
    },{});

    var $Session=providers.$Session;
    container.registerType(Session,$Session);

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var Store=elliptical.Store;
    var container = app.container;

    var Settings=Store.extend({
        "@resource":"Settings",
        getDashboard:function(key){return this.$provider.getDashboard(key)},
        setDashboard:function(key,value){this.$provider.setDashboard(key,value)},
        getDisplayModel:function(){return this.$provider.getDisplayModel()}
    },{
        getDashboard:function(key){return this.constructor.getDashboard(key)},
        setDashboard:function(key,value){this.constructor.setDashboard(key,value)},
        getDisplayModel:function(){return this.constructor.getDisplayModel()}
    });


    container.mapType(Settings, '$Settings');

    return app;
})(elliptical.module);
elliptical.module = (function (app) {

    var container=app.container;
    container.registerType('Try', elliptical.Try);

    return app;
})(elliptical.module);