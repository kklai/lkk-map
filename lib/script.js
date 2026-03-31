document.querySelectorAll(".info-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const id = btn.dataset.more;
        document.querySelector(".more-" + id).classList.add("open");
    });
});

document.querySelectorAll(".more-x").forEach((closeBtn) => {
    closeBtn.addEventListener("click", (e) => {
        e.currentTarget.closest(".more").classList.remove("open");
    });
});
