window.Elliptical = function (fn) {
    document.addEventListener('WebComponentsReady', function () {
        if(fn.__executed===undefined){
            fn.call(this);
            fn.__executed=true;
        }
    });
};
