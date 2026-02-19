export function updateNav(id) {

    window.location.hash = '#' + id;

    document.querySelectorAll(".more").forEach(el => {
        el.style.display = "none";
    })
    
    if (document.querySelector(".more-" + id)) {
        document.querySelectorAll(".more-" + id).forEach(el => {
            el.style.display = "block";
        })
    }

    let projects = document.querySelectorAll(".project-list .project");

    projects.forEach(el => {
        if (el && el.classList) {
            el.classList.remove("active");
        }
    })

    document.querySelector("#" + id + "-nav").classList.add("active");

    document.querySelector(".lightbox.projects").style.display = "none";
}