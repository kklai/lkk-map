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

document.querySelector(".explore-button").addEventListener('click', function(e) {
    e.currentTarget.classList.toggle("explore");
    document.querySelector('.canvas').classList.toggle("explore");
    document.querySelector('.project-cont').classList.toggle("expanded");
    document.querySelector('html').classList.toggle("expanded");
    document.body.scrollTop = document.documentElement.scrollTop = 0;
});