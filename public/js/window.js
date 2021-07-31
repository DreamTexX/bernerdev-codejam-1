window.addEventListener("load", () => {
  document.querySelectorAll(".window").forEach((element) => {
    element.style.left = element.offsetLeft || window.innerWidth / 2 + "px";
    element.style.top = element.offsetTop || window.innerHeight / 2 + "px";
    element.style.position = "absolute";

    let offsetX = 0;
    let offsetY = 0;
    const header = element.querySelector(".title");
    header.addEventListener("mousedown", (event) => {
      offsetX = event.clientX - element.offsetLeft;
      offsetY = event.clientY - element.offsetTop;
      document.onmousemove = (event) => {
        element.style.left = (event.clientX - offsetX) + "px";
        element.style.top = (event.clientY - offsetY) + "px";
      };
      document.onmouseup = () => {
        document.onmousemove = null;
        document.onmouseup = null;
      }
    });
  });
});
