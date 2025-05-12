// Select the home navbar button
document.addEventListener("DOMContentLoaded", () => {
  //   const homeButton = document.getElementById("homeButton");

  //   // Function to handle click event
  //   homeButton.onclick = function () {
  //     // Remove 'active' class from all navbar buttons
  //     document.querySelectorAll(".navbar-button").forEach((button) => {
  //       button.classList.remove("bg-gray-900");
  //     });

  //     // Add 'active' class to the home button
  //     homeButton.classList.add("bg-gray-900");

  //     // Redirect to the home page
  //     window.location.href = "/";
  //   };

  //   // Select the members navbar button
  //   const membersButton = document.getElementById("membersButton");

  //   // Function to handle click event for members
  //   membersButton.onclick = function () {
  //     // Remove 'active' class from all navbar buttons
  //     document.querySelectorAll(".navbar-button").forEach((button) => {
  //       button.classList.remove("bg-gray-900");
  //     });

  //     // Add 'active' class to the members button
  //     membersButton.classList.add("bg-gray-900");

  //     // Redirect to the members page
  //     window.location.href = "/members";
  //   };

  //   // Select the admin navbar button
  //   const adminButton = document.getElementById("adminButton");

  //   // Function to handle click event for admin
  //   adminButton.onclick = function () {
  //     // Remove 'active' class from all navbar buttons
  //     document.querySelectorAll(".navbar-button").forEach((button) => {
  //       button.classList.remove("bg-gray-900");
  //     });

  //     // Add 'active' class to the admin button
  //     adminButton.classList.add("bg-gray-900");

  //     // Redirect to the admin page
  //     window.location.href = "/admin";
  //   };

  const mobileMenuButton = document.getElementById("mobile-menu-button");
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", () => {
      console.log("mobileMenuButton clicked");
      const menuOpenIcon = document.getElementById("menu-open-icon");
      const menuCloseIcon = document.getElementById("menu-close-icon");
      const mobileMenu = document.getElementById("mobile-menu");

      if (menuOpenIcon && menuCloseIcon && mobileMenu) {
        if (menuOpenIcon.classList.contains("block")) {
          menuOpenIcon.classList.remove("block");
          menuOpenIcon.classList.add("hidden");
          menuCloseIcon.classList.remove("hidden");
          menuCloseIcon.classList.add("block");
          mobileMenu.classList.remove("hidden");
          mobileMenu.classList.add("block");
        } else {
          menuOpenIcon.classList.remove("hidden");
          menuOpenIcon.classList.add("block");
          menuCloseIcon.classList.remove("block");
          menuCloseIcon.classList.add("hidden");
          mobileMenu.classList.remove("block");
          mobileMenu.classList.add("hidden");
        }
      }
    });
  }
});
