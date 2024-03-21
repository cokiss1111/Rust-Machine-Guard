$(document).ready(function(){
    $('#example').DataTable();
});

fetch('/ip')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to retrieve IP address');
    }
    return response.text();
  })
  .then(ipAddress => {
    console.log('IP Address:', ipAddress);
    const formattedUrl = `ws://${ipAddress}:8080`;
    const webSocket = new WebSocket(formattedUrl);
    webSocket.addEventListener('open', () => {
      console.log('WebSocket connection established');
    });
    webSocket.addEventListener('message', event => {
      console.log('Message from server:', event.data);
      const data = JSON.parse(event.data);
      const ram = data.ramUsage;
      const activetcp = data.activeTCPConnections;
      const activeapp = data.activeAppCount;
      const diskusage = data.diskUsage;
      const cpu = data.cpuUsage;

      // HTML elementlerini güncelle
      $('#status').text("Active");
      $('#ram').text(ram);
      $('#cpu').text(cpu)
      $('#disk').text(diskusage);
      $('#tcp').text(activetcp);
      $('#app').text(activeapp);
    });
  })
  .catch(error => {
    console.error('Error retrieving IP address:', error);
  });

function powershell() {
const scriptValue = document.getElementById('passwordInput1').value;

const data = {
script: scriptValue
};

fetch('/print_script', {
method: 'POST', // Set the method to POST
headers: {
    'Content-Type': 'application/json', // Set the content type header
},
body: JSON.stringify(data), // Convert the JavaScript object to a JSON string
})
.then(response => {
if (response.ok) {
    return response.json(); // or .text() if the response is not JSON
}
throw new Error('Network response was not ok.');
})
.then(data => {
console.log('Success:', data); // Handle the success response
})
.catch((error) => {
console.error('Error:', error); // Handle errors
});
window.location.reload();
}


function restart(){
const data = {
    script: "Restart-Computer -Force"
};

fetch('/print_script', {
    method: 'POST', // Set the method to POST
    headers: {
        'Content-Type': 'application/json', // Set the content type header
    },
    body: JSON.stringify(data), // Convert the JavaScript object to a JSON string
})
.then(response => {
    if (response.ok) {
        return response.json(); // or .text() if the response is not JSON
    }
    throw new Error('Network response was not ok.');
})
.then(data => {
    console.log('Success:', data); // Handle the success response
})
.catch((error) => {
    console.error('Error:', error); // Handle errors
});
window.location.reload();
}

function shutdown(){
    const data = {
    script: "Stop-Computer -Force"
};

fetch('/print_script', {
    method: 'POST', // Set the method to POST
    headers: {
        'Content-Type': 'application/json', // Set the content type header
    },
    body: JSON.stringify(data), // Convert the JavaScript object to a JSON string
})
.then(response => {
    if (response.ok) {
        return response.json(); // or .text() if the response is not JSON
    }
    throw new Error('Network response was not ok.');
})
.then(data => {
    console.log('Success:', data); // Handle the success response
})
.catch((error) => {
    console.error('Error:', error); // Handle errors
});
window.location.reload();

}