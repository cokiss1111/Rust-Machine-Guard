const socket = new WebSocket('ws://192.168.1.111:3000/ws');

socket.onopen = function(event) {
    console.log('WebSocket bağlantısı açıldı');
};

socket.onclose = function(event) {
    console.log('WebSocket bağlantısı kapandı');
};

// WebSocket üzerinden mesaj alındığında çalışacak fonksiyon
socket.onmessage = function(event) {
    console.log('Alınan mesaj: ' + event.data);
};

socket.onerror = function(error) {
    console.log('WebSocket hatası: ' + error);
};