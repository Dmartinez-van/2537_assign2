// Select the home navbar button
document.addEventListener("DOMContentLoaded", () => {
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
