
/*
 * =============================================================
 * elliptical.GenericRepository
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
        root.elliptical.GenericRepository=factory(root.elliptical,root._);
        root.returnExports = root.elliptical.GenericRepository;
    }
}(this, function (elliptical,_) {

    var utils=elliptical.utils;
    function _getStartEndParams(page,pageSize,count){
        var start = (page-1)*pageSize;
        var end=(page)*pageSize-1;
        if (end > count){
            end=count;
        }
        return{
            start:start,
            end:end
        };
    }

    function _getDataPage(data,params){
        return _.filter(data,function(obj,index){
            return (index>=params.start && index <=params.end);
        })
    }


    function _get(model,id){
        return _.find(model,function(obj){
            return obj.id.toString()===id.toString();
        })
    }

    function _getIndex(model,id){
        return _.findIndex(model,function(obj){
            return obj.id.toString()===id.toString();
        })
    }

    /**
     *
     * @param {array} model - the model to sort
     * @param {array} iterator - array of props to sort by
     * @private
     */
    function _sortAsc(model,iterator){
        return _.sortByOrder(model,iterator,['asc']);
    }

    /**
     *
     * @param {array} model - the model to sort
     * @param {array} iterator - array of props to sort by
     * @private
     */
    function _sortDesc(model,iterator){
        return _.sortByOrder(model,iterator,['desc']);
    }

    function _delete(model,id){
        var index=_getIndex(model,id);
        model.splice(index, 1);
        return model;
    }

    function _deleteRange(model,arr){

        for(var i=0;i<arr.length;i++){
            var id=arr[i];
            _delete(model,id);
        }
    }

    function _replace(model,id,newObj){
        var old=_get(model,id);
        for(var key in old){
            if(old.hasOwnProperty(key)){
                if(newObj[key] !==undefined){
                    old[key]=newObj[key];
                }
            }
        }
    }


    function _find(model,fn,val){
        return _.filter(model,function(obj){
            return fn.call(fn,obj,val);
        });
    }


    function GenericRepository(model,fn){
        var length=arguments.length;
        if(length===0){
            throw 'Generic Repository requires a model injection';
        }

        if(typeof fn !=='function'){
            fn=null;
        }
        this.model=model;
        this.callback=fn;

        this.get=function(params,resource,query,callback){
            if(resource && typeof resource==='object'){
                callback=query;
                query=resource;
            }
            var model=this.model;
            var result;
            if(params && params.id){
                result= _get(model,params.id);

            }else if(query.filter && query.filter !==undefined){
                result=_find(model,query.filter.fn,query.filter.val);
            }else{
                result= model;
            }

            if(query.orderBy && query.orderBy !==undefined){
                var orderByIterator=[];
                orderByIterator.push(query.orderBy);
                result=_sortAsc(result,orderByIterator);
            }

            if(query.orderByDesc && query.orderByDesc !==undefined){
                var orderByDescIterator=[];
                orderByDescIterator.push(query.orderByDesc);
                result=_sortDesc(result,orderByDescIterator);
            }


            if(query.paginate){
                var count=result.length;
                var pageSize=query.paginate.pageSize;
                var page=query.paginate.page;
                var p=_getStartEndParams(page,pageSize,count);
                var data=_getDataPage(result,p);
                result={data:data,count:count};
            }

            if(this.callback){
                this.callback(result,'get',params,callback);
            }else{
                return (callback) ? callback(null,result) : result;
            }
        };

        this.post=function(params,resource,callback){
            var origParams=params;
            if(typeof resource !=='string'){
                callback=resource;
            }
            var model=this.model;
            params.id=utils.guid();
            model.push(params);

            if(this.callback){
                this.callback(params,'post',origParams,callback);
            }else{
                return (callback) ? callback(null,params) : params;
            }
        };

        this.put=function(params,resource,callback){
            if(typeof resource !=='string'){
                callback=resource;
            }
            var model=this.model;
            _replace(model,params.id,params);

            if(this.callback){
                this.callback(params,'put',params,callback);
            }else{
                return (callback) ? callback(null,params) : params;
            }
        };

        this.delete=function(params,resource,callback){
            if(typeof resource !=='string'){
                callback=resource;
            }
            if(params.id){
                _delete(model,params.id);
            }else if(params.ids){
                _deleteRange(model,params.ids);
            }

            if(this.callback){
                this.callback(null,'delete',params,callback);
            }else{
                return (callback) ? callback(null,null) : null;
            }

        };

        this.query=function(params,query,callback){
            var queryResult;
            var model=this.model;
            var search=query.search;
            var props=query.props;
            var result=[];

            for(var i=0;i<props.length;i++){
                result=_find(model,result,search,props[i]);
            }

            if(query.paginate){
                var count=result.length;
                var pageSize=query.paginate.pageSize;
                var page=query.paginate.page;
                var p=_getStartEndParams(page,pageSize,count);
                var data=_getDataPage(model,p);
                queryResult={data:data,count:count};
            }else{
                queryResult=result;
            }

            if(this.callback){
                this.callback(queryResult,'query',params,callback);
            }else{
                return (callback) ? callback(null,queryResult) : queryResult;
            }
        };
    }

    return GenericRepository;

}));
