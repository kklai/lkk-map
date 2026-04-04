document.querySelectorAll(".nav-arrow").forEach((arrow) => {
    arrow.addEventListener("click", () => {
        const next = document.getElementById(arrow.dataset.next);
        if (next) window.scrollTo({ top: next.offsetTop, behavior: "smooth" });
    });
});

document.querySelectorAll(".info-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const id = btn.dataset.more;
        document.querySelector(".more-" + id).classList.add("open");
        document.documentElement.classList.add("expanded");
    });
});

document.querySelectorAll(".more-x").forEach((closeBtn) => {
    closeBtn.addEventListener("click", (e) => {
        e.currentTarget.closest(".more").classList.remove("open");
        document.documentElement.classList.remove("expanded");
    });
});

document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = document.querySelector(".more.open");
    if (!open) return;
    open.classList.remove("open");
    document.documentElement.classList.remove("expanded");
});
