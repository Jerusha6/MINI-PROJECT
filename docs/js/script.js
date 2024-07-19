document.addEventListener("DOMContentLoaded", function () {
  loadNavbar();
});

function loadNavbar() {
  fetch("navbar.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("main-navbar").innerHTML = data;
      setupNavigation();
      updateNavigation();
    })
    .catch((error) => console.error("Error loading navbar:", error));
}

function setupNavigation() {
  const navbarToggler = document.querySelector(".navbar-toggler");
  const navbarCollapse = document.querySelector(".navbar-collapse");

  if (navbarToggler && navbarCollapse) {
    navbarToggler.addEventListener("click", function () {
      navbarCollapse.classList.toggle("show");
    });
  }

  document.addEventListener("click", function (e) {
    if (
      e.target &&
      (e.target.id === "logout" || e.target.id === "logout-nav")
    ) {
      e.preventDefault();
      logout();
    }
  });

  window.addEventListener("resize", updateNavigation);
}

function updateNavigation() {
  const navMenu = document.getElementById("nav-menu");
  const authLinks = document.querySelector(".auth-links");
  const logoutLink = document.querySelector(".logout-link");

  const currentPage = getCurrentPage();
  const userLoggedIn = isUserLoggedIn();

  if (navMenu) {
    navMenu.innerHTML = "";

    if (currentPage !== "index.html") {
      const menuItems = [
        { href: "Home.html", icon: "fas fa-home", text: "Home" },
        {
          href: "https://steel.gov.in/sites/default/files/Vsp%20overview.pdf",
          icon: "fas fa-info-circle",
          text: "About",
        },
        {
          href: "editprofile.html",
          icon: "fas fa-user-edit",
          text: "Edit Profile",
        },
      ];

      menuItems.forEach((item) => {
        const li = document.createElement("li");
        li.className = "nav-item";
        li.innerHTML = `<a class="nav-link" href="${item.href}"><i class="${item.icon}"></i> ${item.text}</a>`;
        navMenu.appendChild(li);
      });

      if (userLoggedIn) {
        const logoutItem = document.createElement("li");
        logoutItem.className = "nav-item d-lg-none";
        logoutItem.innerHTML = `<a class="nav-link" href="#" id="logout-nav"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
        navMenu.appendChild(logoutItem);
      }
    }
  }

  if (authLinks) {
    authLinks.style.display =
      currentPage === "index.html" || !userLoggedIn ? "flex" : "none";
  }

  if (logoutLink) {
    logoutLink.style.display =
      currentPage !== "index.html" && userLoggedIn ? "block" : "none";
  }
}

function isUserLoggedIn() {
  return (
    localStorage.getItem("userLoggedIn") === "true" &&
    localStorage.getItem("userToken") !== null
  );
}

function getCurrentPage() {
  return window.location.pathname.split("/").pop();
}

function logout() {
  localStorage.removeItem("userLoggedIn");
  localStorage.removeItem("userToken");
  window.location.href = "index.html";
}

function login(userData) {
  localStorage.setItem("userLoggedIn", "true");
  localStorage.setItem("userToken", userData.token);
  localStorage.setItem("userId", userData.userId);
  updateNavigation();
}

function goBack() {
  window.history.back();
}

function navigateTo(page) {
  window.location.href = page;
}

// For demo purposes: Login/Logout toggle
window.toggleLogin = function () {
  const currentStatus = localStorage.getItem("userLoggedIn") === "true";
  const newStatus = !currentStatus;
  localStorage.setItem("userLoggedIn", newStatus.toString());
  if (newStatus) {
    localStorage.setItem("userToken", "dummyToken");
  } else {
    localStorage.removeItem("userToken");
  }
  updateNavigation();
};

login({ token: "actualUserToken", userId: "dummyUserId" });
