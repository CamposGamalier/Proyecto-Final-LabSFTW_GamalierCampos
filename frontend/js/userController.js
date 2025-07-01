
app.controller("UserController", function ($scope, $http, $sce, API_URL) {
  var session_id = sessionStorage.getItem("session_id");
  if (!session_id || sessionStorage.getItem("rol") !== "user") {
    console.warn("Acceso denegado, redirigiendo a index.html");
    window.location = "index.html";
    return;
  }

  $scope.categories = [];
  $scope.videos = [];
  $scope.selectedCategory = null;
  $scope.noVideos = false;
  $scope.videoFilter = "";

  function loadCategories() {
    $http.get(API_URL + "/categories/" + session_id).then(function (res) {
      $scope.categories = res.data || [];
      if ($scope.categories.length > 0) {
        $scope.selectedCategory = $scope.categories[0].id;
        $scope.search();
      }
    });
  }

  $scope.getEmbedUrl = function (url) {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      var id = url.split("v=")[1] || url.split("youtu.be/")[1];
      if (id) {
        id = id.split("&")[0];
      }
      return $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + id);
    }
    return $sce.trustAsResourceUrl(url);
  };

  $scope.isYoutube = function (url) {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

 $scope.search = function () {
  if (!$scope.selectedCategory) {
    $scope.videos = [];
    $scope.noVideos = true;
    return;
  }

  $http
    .get(API_URL + "/public/category/" + $scope.selectedCategory + "/" + session_id)
    .then(function (res) {
      const allVideos = res.data || [];
      const filterText = $scope.videoFilter.toLowerCase();
      $scope.videos = filterText
        ? allVideos.filter(v => v.name.toLowerCase().includes(filterText))
        : allVideos;

      $scope.noVideos = $scope.videos.length === 0;
    });
  };

  loadCategories();

  $scope.logout = function () {
    $http
      .put(API_URL + "/logout", { session_id: session_id })
      .then(() => {
        sessionStorage.clear();
        window.location = "index.html";
      });
  };
});
