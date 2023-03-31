'use strict'

for (let i=1; i <= 200; i++) {
    let elI = document.createElement("i")
        elI.setAttribute("id", "ash_e"+ i)
    document.querySelector(".ashes").append(elI)
}

for (let i=1; i <= 10; i++) {
    let elI = document.createElement("i")
        elI.setAttribute("class", "s"+ i)
    document.querySelector(".cup-steam").append(elI)
}

document.addEventListener("mousemove", (e) => {
    let pos = new Object()

    pos.x = e.pageX - parseInt(window.innerWidth) / 2
    pos.y = e.pageY - parseInt(window.innerHeight) / 2

    document.querySelector(".ashes").style.marginLeft = pos.x*4.25 + "px"
    document.querySelector(".cup").style.marginLeft = -pos.x*.01 + "px"
    document.querySelector(".pencil-paper").style.marginLeft = pos.x*.01 + "px"
}, false)