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
let password = document.getElementById('passwordInput').value;

// Sanitize the input to prevent XSS attacks
password = sanitizeInput(password);

fetch('/check_pass', {
method: 'POST',
headers: {
    'Content-Type': 'application/json',
},
body: JSON.stringify({ password: password }),
})
.then(response => {
if (response.ok) {
    var url = "/machine";
    const Toast = Swal.mixin({
        toast: true,
        position: "bottom",
        showConfirmButton: false,
        timer: 1250,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        }
      });
      Toast.fire({
        icon: "success",
        title: "Signed in successfully"
      }).then(() => {
        window.location.href = url;
    }).catch(() => {
        location.reload(); // Hata durumunda da sayfayı yenile
    });
} else {
    const Toast = Swal.mixin({
        toast: true,
        position: "bottom",
        showConfirmButton: false,
        timer: 1250,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
        icon: "error",
        title: "incorrect entry"
    }).then(() => {
        location.reload(); // Sayfayı yenile
    }).catch(() => {
        location.reload(); // Hata durumunda da sayfayı yenile
    });
    throw new Error('Unauthorized');


}
})
.catch((error) => {
console.error('Error:', error.message);
document.getElementById('errorMessage').innerText = "You can not pass this.";
});
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