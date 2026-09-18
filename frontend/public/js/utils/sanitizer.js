/**
 * XSS SANITIZER & SAFE DOM UTILITY
 * Prevents HTML injection attacks by strictly escaping and generating safe DOM nodes.
 */

(function(window) {
  const Sanitizer = {
    /**
     * Escapes unsafe characters from strings
     * @param {string} str 
     * @returns {string}
     */
    escapeHTML(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /**
     * Safely sets text content on an element
     * @param {HTMLElement} el 
     * @param {string} text 
     */
    setText(el, text) {
      if (!el) return;
      el.textContent = text || '';
    },

    /**
     * Creates a DOM element safely with attributes and children
     * @param {string} tag 
     * @param {Object} attrs 
     * @param {Array|string|HTMLElement} children 
     * @returns {HTMLElement}
     */
    createElement(tag, attrs = {}, children = []) {
      const el = document.createElement(tag);

      Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className' || key === 'class') {
          el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
          el.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key.startsWith('data-')) {
          el.setAttribute(key, value);
        } else if (value !== null && value !== undefined) {
          el.setAttribute(key, value);
        }
      });

      if (typeof children === 'string' || typeof children === 'number') {
        el.textContent = children;
      } else if (Array.isArray(children)) {
        children.forEach(child => {
          if (!child) return;
          if (typeof child === 'string' || typeof child === 'number') {
            el.appendChild(document.createTextNode(child));
          } else if (child instanceof HTMLElement) {
            el.appendChild(child);
          }
        });
      } else if (children instanceof HTMLElement) {
        el.appendChild(children);
      }

      return el;
    }
  };

  window.Sanitizer = Sanitizer;
})(window);
