window.toggleDetail = function(btn) {
  var content = btn.parentElement.querySelector('.detail-content');
  if (!content) return;
  var isHidden = content.style.display === 'none';
  content.style.display = isHidden ? 'block' : 'none';
  btn.textContent = isHidden ? 'Ver menos' : btn.getAttribute('data-expanded-text') || 'Ver detalhes';
  setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 100);
};

window.mostrarToast = function(msg) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg || 'Operacao concluida!';
  toast.style.display = 'block';
  toast.style.opacity = '1';
  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() { toast.style.display = 'none'; }, 300);
  }, 2000);
};

window.toggleSidebar = function() {
  document.body.classList.toggle('sidebar-collapsed');
  var collapsed = document.body.classList.contains('sidebar-collapsed');
  saveSidebarState(collapsed);
  setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 310);
};
