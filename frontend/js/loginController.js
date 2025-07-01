app.controller("LoginController", function ($scope, $http, API_URL) {
  $scope.login = function () {
    $scope.error = ""; // Limpiar errores previos
    $http
      .post(API_URL + "/login", { email: $scope.email, password: $scope.password })
      .then(
        function (resp) {
          console.log("Respuesta de login:", resp.data); // Depuración
          sessionStorage.setItem("session_id", resp.data.session_id);
          sessionStorage.setItem("nombre", resp.data.nombre);
          sessionStorage.setItem("email", resp.data.email);
          sessionStorage.setItem("rol", resp.data.rol);
          if (resp.data.rol === "admin") {
            console.log("Redirigiendo a admin.html");
            window.location = "admin.html";
          } else if (resp.data.rol === "user") {
            console.log("Redirigiendo a user.html");
            window.location = "user.html";
          } else {
            console.error("Rol desconocido:", resp.data.rol);
            $scope.error = "Rol desconocido";
          }
        },
        function (err) {
          console.error("Error en login:", err);
          $scope.error =
            (err.data && err.data.error) ||
            (err.status === -1
              ? "No se pudo conectar con el servidor"
              : "Error al iniciar sesión");
        }
      );
  };
});
