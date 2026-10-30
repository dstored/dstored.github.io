// Static site, so these forms open the visitor's email app with everything they
// filled in, addressed to the right inbox (the interim approach until the forms
// connect to HubSpot). Each form names its inbox and subject line:
//   <form data-email-form="sales@joinstored.com" data-email-subject="Book a demo request">
(function () {
  document.querySelectorAll('form[data-email-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lines = [];
      form.querySelectorAll('input, select, textarea').forEach(function (field) {
        var value = field.tagName === 'SELECT'
          ? (field.value ? field.options[field.selectedIndex].text : '')
          : field.value.trim();
        if (!value) return;
        var label = form.querySelector('label[for="' + field.id + '"]');
        var name = label ? label.textContent.replace(/\(optional\)/i, '').trim() : field.name;
        if (!/[?:]$/.test(name)) name += ':';
        lines.push(field.tagName === 'TEXTAREA' ? '\n' + name + '\n' + value : name + ' ' + value);
      });
      window.location.href = 'mailto:' + form.getAttribute('data-email-form') +
        '?subject=' + encodeURIComponent(form.getAttribute('data-email-subject')) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    });
  });
})();
