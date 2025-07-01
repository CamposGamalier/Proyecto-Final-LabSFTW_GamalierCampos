window.addEventListener('DOMContentLoaded', function () {
  const nombreUsuario = sessionStorage.getItem('nombre');
  const rolUsuario = sessionStorage.getItem('rol');
  const infoEl = document.getElementById('user-info');
  if (infoEl) {
    if (nombreUsuario && rolUsuario) {
      infoEl.textContent = `@${nombreUsuario} (${rolUsuario})`;
    } else {
      infoEl.textContent = '';
    }
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      const sessionId = sessionStorage.getItem('session_id');
      if (sessionId) {
        fetch('http://localhost:3000/logout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        }).finally(() => {
          sessionStorage.clear();
          window.location = 'index.html';
        });
      } else {
        sessionStorage.clear();
        window.location = 'index.html';
      }
    });
  }
});
