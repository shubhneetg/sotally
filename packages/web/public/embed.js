(function() {
  'use strict';

  var SOTALLY_BASE = 'https://sotally.com';

  // Find all sotally embed scripts
  var scripts = document.querySelectorAll('script[data-sotally-tool]');

  scripts.forEach(function(script) {
    var slug = script.getAttribute('data-sotally-tool');
    var theme = script.getAttribute('data-theme') || 'auto';
    var width = script.getAttribute('data-width') || '100%';
    var height = script.getAttribute('data-height') || '600';

    if (!slug) return;

    // Create container
    var container = document.createElement('div');
    container.style.width = typeof width === 'string' && width.includes('%') ? width : width + 'px';
    container.style.maxWidth = '100%';
    container.style.margin = '0 auto';

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = SOTALLY_BASE + '/embed/' + encodeURIComponent(slug) + '?theme=' + theme;
    iframe.style.width = '100%';
    iframe.style.height = height + 'px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.style.overflow = 'hidden';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('title', 'Sotally Tool: ' + slug);

    // Listen for resize messages from iframe
    window.addEventListener('message', function(event) {
      if (event.origin !== SOTALLY_BASE) return;
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'sotally-resize' && data.slug === slug) {
          iframe.style.height = data.height + 'px';
        }
      } catch (e) {}
    });

    container.appendChild(iframe);

    // Powered by footer
    var footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.marginTop = '8px';
    footer.style.fontSize = '12px';
    footer.style.color = '#999';
    footer.innerHTML = 'Powered by <a href="' + SOTALLY_BASE + '" target="_blank" rel="noopener" style="color:#7c3aed;text-decoration:none;">Sotally</a>';
    container.appendChild(footer);

    // Insert after the script tag
    script.parentNode.insertBefore(container, script.nextSibling);
  });
})();
