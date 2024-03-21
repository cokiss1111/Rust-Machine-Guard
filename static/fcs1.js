document.addEventListener("contextmenu", function(e){
    e.preventDefault();
}, false);

document.addEventListener("keydown", function(e){
    if (e.ctrlKey || e.keyCode == 123) {
        e.stopPropagation();
        e.preventDefault();
    }
});

function checkout() {
    document.getElementById('errorMessage').innerText = "An Error Occured. Please try again.";

    setTimeout(function() {
        location.reload();
    }, 1500);
}

// Function to sanitize input by escaping HTML special characters
function sanitizeInput(input) {
const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
};
const reg = /[&<>"'/]/ig;
console.log("aga xss calismiyo mu?");
console.log("calismicak aga deneme bosuna sql acigida yok yanı basıt bıse bu neyın acıgını arıyon a mk?");
console.log("nese aga gıt bi nefes al soluklan oyle dene dsf:qw:qw:qWE:qWE:");
return input.replace(reg, (match)=>(map[match]));
}