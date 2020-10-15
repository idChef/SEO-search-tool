
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.29.0 */

    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let section;
    	let div0;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let div5;
    	let div2;
    	let label0;
    	let t5;
    	let div1;
    	let input0;
    	let t6;
    	let progress0;
    	let t7;
    	let t8;
    	let t9;
    	let p1;
    	let t10;
    	let t11_value = /*title*/ ctx[0].length + "";
    	let t11;
    	let t12;
    	let t13;
    	let div4;
    	let label1;
    	let t15;
    	let div3;
    	let input1;
    	let t16;
    	let progress1;
    	let t17;
    	let t18;
    	let t19;
    	let p2;
    	let t20;
    	let t21_value = /*description*/ ctx[1].length + "";
    	let t21;
    	let t22;
    	let t23;
    	let div6;
    	let h3;
    	let t24;
    	let t25;
    	let p3;
    	let t26;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "SEO Tool";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Figure out how many characters you need in title and description!";
    			t3 = space();
    			div5 = element("div");
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Title";
    			t5 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t6 = space();
    			progress0 = element("progress");
    			t7 = text(/*titleProgress*/ ctx[2]);
    			t8 = text("%");
    			t9 = space();
    			p1 = element("p");
    			t10 = text("Title is ");
    			t11 = text(t11_value);
    			t12 = text(" characters.");
    			t13 = space();
    			div4 = element("div");
    			label1 = element("label");
    			label1.textContent = "Description";
    			t15 = space();
    			div3 = element("div");
    			input1 = element("input");
    			t16 = space();
    			progress1 = element("progress");
    			t17 = text(/*descriptionProgress*/ ctx[3]);
    			t18 = text("%");
    			t19 = space();
    			p2 = element("p");
    			t20 = text("Description is ");
    			t21 = text(t21_value);
    			t22 = text(" characters.");
    			t23 = space();
    			div6 = element("div");
    			h3 = element("h3");
    			t24 = text(/*title*/ ctx[0]);
    			t25 = space();
    			p3 = element("p");
    			t26 = text(/*description*/ ctx[1]);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file, 30, 6, 816);
    			attr_dev(p0, "class", "subtitle");
    			add_location(p0, file, 33, 6, 870);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file, 29, 4, 786);
    			attr_dev(label0, "class", "label");
    			add_location(label0, file, 39, 2, 1031);
    			attr_dev(input0, "class", "input");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Title");
    			add_location(input0, file, 41, 4, 1094);
    			attr_dev(div1, "class", "control");
    			add_location(div1, file, 40, 2, 1068);
    			attr_dev(div2, "class", "field");
    			add_location(div2, file, 38, 1, 1009);
    			attr_dev(progress0, "class", "progress svelte-1j9ivco");
    			progress0.value = /*titleProgress*/ ctx[2];
    			attr_dev(progress0, "max", "100");
    			toggle_class(progress0, "is-danger", /*title*/ ctx[0].length < 30 || /*title*/ ctx[0].length > 60);
    			toggle_class(progress0, "is-warning", /*title*/ ctx[0].length < 50);
    			toggle_class(progress0, "is-success", /*title*/ ctx[0].length >= 50);
    			add_location(progress0, file, 44, 3, 1189);
    			attr_dev(p1, "class", "subtitle is-6");
    			add_location(p1, file, 45, 2, 1408);
    			attr_dev(label1, "class", "label");
    			add_location(label1, file, 49, 2, 1507);
    			attr_dev(input1, "class", "input");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "Description");
    			add_location(input1, file, 51, 4, 1576);
    			attr_dev(div3, "class", "control");
    			add_location(div3, file, 50, 2, 1550);
    			attr_dev(div4, "class", "field");
    			add_location(div4, file, 48, 3, 1485);
    			attr_dev(progress1, "class", "progress svelte-1j9ivco");
    			progress1.value = /*descriptionProgress*/ ctx[3];
    			attr_dev(progress1, "max", "100");
    			toggle_class(progress1, "is-danger", /*description*/ ctx[1].length < 100 || /*description*/ ctx[1].length > 160);
    			toggle_class(progress1, "is-warning", /*description*/ ctx[1].length < 140);
    			toggle_class(progress1, "is-success", /*title*/ ctx[0].length >= 140);
    			add_location(progress1, file, 54, 3, 1683);
    			attr_dev(p2, "class", "subtitle is-6");
    			add_location(p2, file, 55, 2, 1936);
    			attr_dev(div5, "class", "container mt-4");
    			add_location(div5, file, 37, 1, 979);
    			set_style(h3, "font-size", "20px");
    			set_style(h3, "color", "#1a0dab");
    			add_location(h3, file, 60, 2, 2101);
    			set_style(p3, "font-size", "14px");
    			add_location(p3, file, 61, 2, 2160);
    			attr_dev(div6, "class", "box mt-5");
    			set_style(div6, "max-width", "600px");
    			set_style(div6, "min-height", "142px");
    			add_location(div6, file, 59, 1, 2031);
    			attr_dev(section, "class", "section column is-one-quarter box");
    			add_location(section, file, 28, 0, 730);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(section, t3);
    			append_dev(section, div5);
    			append_dev(div5, div2);
    			append_dev(div2, label0);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*title*/ ctx[0]);
    			append_dev(div5, t6);
    			append_dev(div5, progress0);
    			append_dev(progress0, t7);
    			append_dev(progress0, t8);
    			append_dev(div5, t9);
    			append_dev(div5, p1);
    			append_dev(p1, t10);
    			append_dev(p1, t11);
    			append_dev(p1, t12);
    			append_dev(div5, t13);
    			append_dev(div5, div4);
    			append_dev(div4, label1);
    			append_dev(div4, t15);
    			append_dev(div4, div3);
    			append_dev(div3, input1);
    			set_input_value(input1, /*description*/ ctx[1]);
    			append_dev(div5, t16);
    			append_dev(div5, progress1);
    			append_dev(progress1, t17);
    			append_dev(progress1, t18);
    			append_dev(div5, t19);
    			append_dev(div5, p2);
    			append_dev(p2, t20);
    			append_dev(p2, t21);
    			append_dev(p2, t22);
    			append_dev(section, t23);
    			append_dev(section, div6);
    			append_dev(div6, h3);
    			append_dev(h3, t24);
    			append_dev(div6, t25);
    			append_dev(div6, p3);
    			append_dev(p3, t26);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1 && input0.value !== /*title*/ ctx[0]) {
    				set_input_value(input0, /*title*/ ctx[0]);
    			}

    			if (dirty & /*titleProgress*/ 4) set_data_dev(t7, /*titleProgress*/ ctx[2]);

    			if (dirty & /*titleProgress*/ 4) {
    				prop_dev(progress0, "value", /*titleProgress*/ ctx[2]);
    			}

    			if (dirty & /*title*/ 1) {
    				toggle_class(progress0, "is-danger", /*title*/ ctx[0].length < 30 || /*title*/ ctx[0].length > 60);
    			}

    			if (dirty & /*title*/ 1) {
    				toggle_class(progress0, "is-warning", /*title*/ ctx[0].length < 50);
    			}

    			if (dirty & /*title*/ 1) {
    				toggle_class(progress0, "is-success", /*title*/ ctx[0].length >= 50);
    			}

    			if (dirty & /*title*/ 1 && t11_value !== (t11_value = /*title*/ ctx[0].length + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*description*/ 2 && input1.value !== /*description*/ ctx[1]) {
    				set_input_value(input1, /*description*/ ctx[1]);
    			}

    			if (dirty & /*descriptionProgress*/ 8) set_data_dev(t17, /*descriptionProgress*/ ctx[3]);

    			if (dirty & /*descriptionProgress*/ 8) {
    				prop_dev(progress1, "value", /*descriptionProgress*/ ctx[3]);
    			}

    			if (dirty & /*description*/ 2) {
    				toggle_class(progress1, "is-danger", /*description*/ ctx[1].length < 100 || /*description*/ ctx[1].length > 160);
    			}

    			if (dirty & /*description*/ 2) {
    				toggle_class(progress1, "is-warning", /*description*/ ctx[1].length < 140);
    			}

    			if (dirty & /*title*/ 1) {
    				toggle_class(progress1, "is-success", /*title*/ ctx[0].length >= 140);
    			}

    			if (dirty & /*description*/ 2 && t21_value !== (t21_value = /*description*/ ctx[1].length + "")) set_data_dev(t21, t21_value);
    			if (dirty & /*title*/ 1) set_data_dev(t24, /*title*/ ctx[0]);
    			if (dirty & /*description*/ 2) set_data_dev(t26, /*description*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let title = "";
    	let description = "";

    	// currentValue - x
    	// maxValue - 100%
    	// maxValue * x = currentValue * 100
    	// x = currentValue * 100 / maxValue
    	const countPercent = (currentValue, maxValue) => {
    		return parseInt(currentValue * 100 / maxValue);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		title = this.value;
    		$$invalidate(0, title);
    	}

    	function input1_input_handler() {
    		description = this.value;
    		$$invalidate(1, description);
    	}

    	$$self.$capture_state = () => ({
    		title,
    		description,
    		countPercent,
    		titleProgress,
    		descriptionProgress
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("titleProgress" in $$props) $$invalidate(2, titleProgress = $$props.titleProgress);
    		if ("descriptionProgress" in $$props) $$invalidate(3, descriptionProgress = $$props.descriptionProgress);
    	};

    	let titleProgress;
    	let descriptionProgress;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*title*/ 1) {
    			 $$invalidate(2, titleProgress = countPercent(title.length, 60));
    		}

    		if ($$self.$$.dirty & /*description*/ 2) {
    			 $$invalidate(3, descriptionProgress = countPercent(description.length, 150));
    		}
    	};

    	return [
    		title,
    		description,
    		titleProgress,
    		descriptionProgress,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
