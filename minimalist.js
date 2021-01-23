function evaluateExpression(expression, scope) {
    return eval(`with (scope) { (${expression}); }`);
}

class Minimalist {

    directives = {
        'm-text': (el, value) => {
            el.innerText = value
        }
    }

    constructor({ el, data, methods }) {
        this.root = document.querySelector(el);
        this.methodsAndData = this.observe({ ...data, ...methods });
        this.refreshDom();
        this.scanEventListeners();
    }

    observe(rawData) {

        return new Proxy(rawData, {

            set: (rawData, key, value) => {
                rawData[key] = value;
                this.refreshDom();
            }

        });

    }

    refreshDom() {
        this.walkDom(this.root, el => {

            if (el.hasAttribute('m-text')) {
                let expression = el.getAttribute('m-text');
                this.directives['m-text'](el, evaluateExpression(expression, this.methodsAndData))
            }

        });
    }

    walkDom(el, callback) {

        callback(el);

        el = el.firstElementChild;

        while (el) {

            this.walkDom(el, callback);

            el = el.nextElementSibling;
        }

    }

    scanEventListeners() {

        this.walkDom(this.root, el => {

            Array.from(el.attributes)

                .filter(attribute => attribute.name.startsWith('@'))

                .forEach(attribute => {
                    let event = attribute.name.replace('@', '');
                    this.addEventListener(event, el);
                });

        });

    }

    addEventListener(event, el) {

        let expression = el.getAttribute(`@${event}`);

        if (typeof this.methodsAndData[expression] === 'function') {

            el.addEventListener(event, (eventObject) => {
                this.methodsAndData[expression].apply(this.methodsAndData, [eventObject]);
            });

        } else {

            el.addEventListener(event, () => {
                evaluateExpression(expression, this.methodsAndData);
            });

        }
    }

}