app.controller("AdminController", function ($scope, $http, $timeout, API_URL) {
  var session_id = sessionStorage.getItem("session_id");
  var rol = sessionStorage.getItem("rol");
  console.log("AdminController: session_id=", session_id, "rol=", rol); // Depuración
  if (!session_id || rol !== "admin") {
    console.warn("Acceso denegado, redirigiendo a index.html");
    window.location = "index.html";
    return;
  }

  $scope.tab = "users";
  $scope.alert = { type: "", msg: "" };
  $scope.newUser = {};
  $scope.newCategory = {};
  $scope.newVideo = {};
  $scope.userFilter = "";
  $scope.searchVideo = "";
  $scope.editUser = {};
  $scope.editCategory = {};
  $scope.editVideo = {};
  var listaVideos = [];

  function mostrarVideos(videos) {
    $scope.videos = videos;
  }

  function showMsg(type, msg) {
    $scope.alert.type = type;
    $scope.alert.msg = msg;
    $timeout(function () {
      $scope.alert.msg = "";
    }, 3000);
  }

  function loadAll() {
    console.log("Cargando datos para session_id:", session_id);
    $http
      .get(API_URL + "/users/" + session_id)
      .then(
        (r) => {
          console.log("Usuarios cargados:", r.data);
          $scope.users = r.data;
        },
        (err) => console.error("Error cargando usuarios:", err)
      );
    $http
      .get(API_URL + "/categories/" + session_id)
      .then(
        (r) => {
          console.log("Categorías cargadas:", r.data);
          $scope.categories = r.data;
        },
        (err) => console.error("Error cargando categorías:", err)
      );
    $http
      .get(API_URL + "/videos/" + session_id)
      .then(
        (r) => {
          console.log("Videos cargados:", r.data);
          listaVideos = r.data;
          mostrarVideos(listaVideos);
        },
        (err) => console.error("Error cargando videos:", err)
      );
  }
  loadAll();

  $scope.filtrarUsuario = function (u) {
  if (!$scope.searchUser) return true;
  var s = $scope.searchUser.toLowerCase();
  return (
    (u.name && u.name.toLowerCase().includes(s)) ||
    (u.email && u.email.toLowerCase().includes(s))
    );
  };


  $scope.videoFilter = function (v) {
    if (!$scope.searchVideo) return true;
    var s = $scope.searchVideo.toLowerCase();
    return v.name && v.name.toLowerCase().includes(s);
  };

  $scope.getCategoryName = function (id) {
    var c = ($scope.categories || []).find(function (c) {
      return c.id === id;
    });
    return c ? c.name : "";
  };

  $scope.logout = function () {
    console.log("Cerrando sesión, session_id:", session_id);
    $http
      .put(API_URL + "/logout", { session_id: session_id })
      .then(
        () => {
          sessionStorage.clear();
          window.location = "index.html";
        },
        (err) => console.error("Error durante logout:", err)
      );
  };

  // Usuarios
  $scope.addUser = function () {
    var data = angular.extend({ session_id: session_id }, $scope.newUser || {});
    if (!data.name || !data.email || !data.password || !data.role) {
      showMsg("danger", "Todos los campos son obligatorios");
      return;
    }
    console.log("Creando usuario:", data);
    $http
      .post(API_URL + "/user", data)
      .then(function () {
        $scope.newUser = {};
        loadAll();
        showMsg("success", "Usuario creado correctamente");
      })
      .catch(function (err) {
        console.error("Error creando usuario:", err);
        showMsg("danger", "Error al crear usuario");
      });
  };
  $scope.openEditUser = function (u) {
    $scope.editUser = angular.copy(u);
    $("#editUserModal").modal("show");
  };
  $scope.saveEditUser = function () {
    $scope.updateUser($scope.editUser);
    $("#editUserModal").modal("hide");
  };
  $scope.updateUser = function (u) {
    var data = angular.extend({ session_id: session_id }, u);
    console.log("Actualizando usuario:", data);
    $http
      .put(API_URL + "/user/" + u.id, data)
      .then(function () {
        loadAll();
        showMsg("success", "Usuario actualizado");
      })
      .catch(function (err) {
        console.error("Error actualizando usuario:", err);
        showMsg("danger", "Error al actualizar usuario");
      });
  };
  $scope.deleteUser = function (u) {
    if (!confirm("¿Estás seguro?")) return;
    console.log("Eliminando usuario:", u);
    $http({
      method: "DELETE",
      url: API_URL + "/user/" + u.id,
      data: { session_id: session_id },
      headers: { "Content-Type": "application/json" },
    })
      .then(function () {
        loadAll();
        showMsg("success", "Usuario eliminado");
      })
      .catch(function (err) {
        console.error("Error eliminando usuario:", err);
        showMsg("danger", "Error al eliminar usuario");
      });
  };

  // Categorías
  $scope.addCategory = function () {
    var data = angular.extend({ session_id: session_id }, $scope.newCategory || {});
    if (!data.name) {
      showMsg("danger", "Nombre de categoría requerido");
      return;
    }
    console.log("Creando categoría:", data);
    $http
      .post(API_URL + "/category", data)
      .then(function () {
        $scope.newCategory = {};
        loadAll();
        showMsg("success", "Categoría creada");
      })
      .catch(function (err) {
        console.error("Error creando categoría:", err);
        showMsg("danger", "Error al crear categoría");
      });
  };
  $scope.openEditCategory = function (c) {
    $scope.editCategory = angular.copy(c);
    $("#editCategoryModal").modal("show");
  };
  $scope.saveEditCategory = function () {
    $scope.updateCategory($scope.editCategory);
    $("#editCategoryModal").modal("hide");
  };
  $scope.updateCategory = function (c) {
    var data = angular.extend({ session_id: session_id }, c);
    console.log("Actualizando categoría:", data);
    $http
      .put(API_URL + "/category/" + c.id, data)
      .then(function () {
        loadAll();
        showMsg("success", "Categoría actualizada");
      })
      .catch(function (err) {
        console.error("Error actualizando categoría:", err);
        showMsg("danger", "Error al actualizar categoría");
      });
  };
  $scope.deleteCategory = function (c) {
    if (!confirm("¿Estás seguro?")) return;
    console.log("Eliminando categoría:", c);
    $http({
      method: "DELETE",
      url: API_URL + "/category/" + c.id,
      data: { session_id: session_id },
      headers: { "Content-Type": "application/json" },
    })
      .then(function () {
        loadAll();
        showMsg("success", "Categoría eliminada");
      })
      .catch(function (err) {
        console.error("Error eliminando categoría:", err);
        showMsg("danger", "Error al eliminar categoría");
      });
  };

  // Videos
  $scope.addVideo = function () {
    var data = angular.extend({ session_id: session_id }, $scope.newVideo || {});
    if (!data.name || !data.url || !data.category_id) {
      showMsg("danger", "Todos los campos son obligatorios");
      return;
    }
    console.log("Creando video:", data);
    $http
      .post(API_URL + "/video", data)
      .then(function () {
        $scope.newVideo = {};
        loadAll();
        showMsg("success", "Vídeo creado");
      })
      .catch(function (err) {
        console.error("Error creando video:", err);
        showMsg("danger", "Error al crear vídeo");
      });
  };
  $scope.openEditVideo = function (v) {
    $scope.editVideo = angular.copy(v);
    $("#editVideoModal").modal("show");
  };
  $scope.saveEditVideo = function () {
    $scope.updateVideo($scope.editVideo);
    $("#editVideoModal").modal("hide");
  };
  $scope.updateVideo = function (v) {
    var data = angular.extend({ session_id: session_id }, v);
    console.log("Actualizando video:", data);
    $http
      .put(API_URL + "/video/" + v.id, data)
      .then(function () {
        loadAll();
        showMsg("success", "Vídeo actualizado");
      })
      .catch(function (err) {
        console.error("Error actualizando video:", err);
        showMsg("danger", "Error al actualizar vídeo");
      });
  };
  $scope.deleteVideo = function (v) {
    if (!confirm("¿Estás seguro?")) return;
    console.log("Eliminando video:", v);
    $http({
      method: "DELETE",
      url: API_URL + "/video/" + v.id,
      data: { session_id: session_id },
      headers: { "Content-Type": "application/json" },
    })
      .then(function () {
        loadAll();
        showMsg("success", "Vídeo eliminado");
      })
      .catch(function (err) {
        console.error("Error eliminando video:", err);
        showMsg("danger", "Error al eliminar vídeo");
      });
  };

});
