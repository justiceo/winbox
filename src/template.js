const template = document.createElement("div");
template.innerHTML = (

    //'<div class=winbox>' +

        '<div class=wb-header>' +
            '<div class=wb-control>' +
                '<span title="Minimize" class=wb-min></span>' +
                '<span title="Maximize" class=wb-max></span>' +
                '<span title="Fullscreen" class=wb-full></span>' +
                '<span title="Close" class=wb-close></span>' +
            '</div>' +
            '<div class=wb-drag>'+
                '<div class=wb-icon></div>' +
                '<div class=wb-title></div>' +
            '</div>' +
        '</div>' +

        '<div class=wb-body></div>' +

        '<div class=wb-n></div>' +
        '<div class=wb-s></div>' +
        '<div class=wb-w></div>' +
        '<div class=wb-e></div>' +
        '<div class=wb-nw></div>' +
        '<div class=wb-ne></div>' +
        '<div class=wb-se></div>' +
        '<div class=wb-sw></div>'

    //'</div>'
);

export default function(tpl){

    return (tpl || template).cloneNode(true);
}
