// document.querySelector(".cloth-scroll-down").addEventListener('click', function() {
// 	console.log("hi")
// 	document.querySelector('.cloth-body').scrollIntoView({ behavior: 'smooth' });
// })

document.querySelector(".menu-item.projects").addEventListener('click', function() {
    document.querySelector(".lightbox.projects").style.display = "block";
});

document.querySelector(".menu-item.blogs").addEventListener('click', function() {
    document.querySelector(".lightbox.blogs").style.display = "block";
});

document.querySelectorAll(".lightbox-x").forEach((closeBtn) => {
  closeBtn.addEventListener("click", (e) => {
    const lightbox = e.currentTarget.closest(".lightbox");
    if (lightbox) lightbox.style.display = "none";
  });
});