// document.querySelector(".cloth-scroll-down").addEventListener('click', function() {
// 	console.log("hi")
// 	document.querySelector('.cloth-body').scrollIntoView({ behavior: 'smooth' });
// })

document.querySelector(".menu-item.projects").addEventListener('click', function() {
    document.querySelector(".lightbox.projects").style.display = "block";
    document.querySelector('html').classList.add("expanded");
});

document.querySelector(".menu-item.blogs").addEventListener('click', function() {
    document.querySelector(".lightbox.blogs").style.display = "block";
    document.querySelector('html').classList.add("expanded");


});

document.querySelectorAll(".lightbox-x").forEach((closeBtn) => {
  closeBtn.addEventListener("click", (e) => {
    const lightbox = e.currentTarget.closest(".lightbox");
    if (lightbox) lightbox.style.display = "none";
    document.querySelector('html').classList.remove("expanded");
  });
});

document.querySelector(".explore-button .explore").addEventListener('click', function(e) {
    e.currentTarget.style.display = "none";
    document.querySelector(".explore-button .x").style.display = "block";
    document.querySelector('.canvas').classList.add("explore");
    document.querySelector('.project-cont').classList.add("expanded");
    document.querySelector('html').classList.add("expanded");
    document.body.scrollTop = document.documentElement.scrollTop = 0;
});

document.querySelector(".explore-button .x").addEventListener('click', function(e) {
    e.currentTarget.style.display = "none";
    document.querySelector(".explore-button .explore").style.display = "block";
    e.currentTarget.classList.remove("explore");
    document.querySelector('.canvas').classList.remove("explore");
    document.querySelector('.project-cont').classList.remove("expanded");
    document.querySelector('html').classList.remove("expanded");
    document.body.scrollTop = document.documentElement.scrollTop = 0;
});