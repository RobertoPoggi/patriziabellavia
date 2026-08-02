// Patrizia Bellavia - site script (minimal)
// Mobile menu toggle
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.querySelector('.menu-toggle, [data-menu-toggle]');
    var menu = document.getElementById('mobile-menu');
    if (btn && menu) btn.addEventListener('click', function(e){ e.preventDefault(); menu.classList.toggle('open'); });
    // FAQ accordion
    document.querySelectorAll('.faq-item h3, .faq-item .faq-q').forEach(function(h){
      h.addEventListener('click', function(){
        var item = h.closest('.faq-item');
        if (item) item.classList.toggle('open');
      });
    });
  });
})();
