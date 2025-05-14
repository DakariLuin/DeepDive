export function showMessage() {
    alert("Кнопка нажата!");
}


document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("myButton");
    btn.addEventListener("click", showMessage);
});