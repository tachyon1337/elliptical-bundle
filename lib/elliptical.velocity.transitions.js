/*
 * =============================================================
 * elliptical.$Transitions
 * =============================================================
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        if (typeof window !== 'undefined') {
            module.exports = factory();
        }

    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical = root.elliptical || {};
        root.elliptical.$Velocity = factory(root.elliptical);
        root.returnExports = root.elliptical.$Velocity;
    }
}(this, function (elliptical) {


    var $Velocity;
    $Velocity = elliptical.Class.extend({

        transition: function (selector, html, opts, callback) {
            var element = $(selector);
            var transition = opts.transition || 'none';
            opts.transitionOut = opts.transitionOut || 'none';
            if (transition !== 'none') {
                if (opts.transitionOut !== 'none') {
                    _transitionOut(opts, function () {
                        element.html(html);
                        _transitionIn(opts, callback);
                    });
                } else {
                    element.html(html);
                    _transitionIn(opts, callback);
                }
            } else {
                element.html(html);
                if (callback && callback instanceof Function) {
                    callback.call(this);
                }
            }


            //private
            function _transitionOut(params, callback) {
                var transition = params.transitionOut;
                var duration = params.durationOut || 250;
                var o = {
                    drag: true,
                    duration:duration
                }
                element.velocity('transition.' + transition,o,callback);
            }
            //private
            function _transitionIn(params, callback) {
                var transition = params.transition;
                var duration = params.duration || 1250;
                var o = {
                    drag: true,
                    duration: duration
                }
                element.velocity('transition.' + transition, o, callback);
            }
        }

    }, {

        transition: function (selector, html, transition, callback) {
            this.constructor.transition(selector, html, transition, callback);
        }
    });

    return $Velocity;
}));
