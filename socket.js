const os = require('os');
const { exec } = require('child_process');
const WebSocket = require('ws');
const process = require('process'); 
const ose = require('os-utils');


// İşletim sistemi bilgilerini al
function getOSInfo() {
  const osInfo = {
    platform: os.platform(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
  };
  return osInfo;
}

// RAM kullanım oranını al
function getRAMUsage() {
  const osInfo = getOSInfo();
  const ramUsage = ((osInfo.totalMemory - osInfo.freeMemory) / osInfo.totalMemory) * 100;
  return parseFloat(ramUsage.toFixed(2)); // İki ondalık basamağa yuvarla ve sayıya dönüştür
}

// Disk kullanım oranını al (C diski için)
function getDiskUsage() {
  return new Promise((resolve, reject) => {
    exec('wmic logicaldisk where "DeviceID=\'C:\'" get FreeSpace,Size /Value', (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }
      const lines = stdout.trim().split(/\s*\n\s*/);
      const diskInfo = {};
      lines.forEach(line => {
        const [key, value] = line.split('=');
        diskInfo[key.trim()] = parseInt(value.trim());
      });
      const diskUsage = ((diskInfo.Size - diskInfo.FreeSpace) / diskInfo.Size) * 100;
      resolve(parseFloat(diskUsage.toFixed(2))); // İki ondalık basamağa yuvarla ve sayıya dönüştür
    });
  });
}

// Aktif TCP bağlantılarını al
function getActiveTCPConnections() {
  return new Promise((resolve, reject) => {
    exec('netstat -n | find /c /i "established"', (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }
      const activeTCPConnections = parseInt(stdout.trim());
      resolve(activeTCPConnections);
    });
  });
}

// Aktif uygulama sayısını al
function getActiveAppCount() {
  return new Promise((resolve, reject) => {
    exec('tasklist /fo csv | find /c /v ""', (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }
      const activeAppCount = parseInt(stdout.trim());
      resolve(activeAppCount);
    });
  });
}

let currentCPUUsage = 0; // CPU kullanımını saklayacak değişken

function printCPUUsage() {
  ose.cpuUsage(function(v){
      currentCPUUsage = parseFloat((v * 100).toFixed(2)); // CPU kullanımını güncelle
  });
}

// Tüm sistem bilgilerini al ve JSON formatında WebSocket'e gönder
function sendSystemInfo(ws) {
  try {
    printCPUUsage(); // CPU kullanımını güncelle

    Promise.all([
      getRAMUsage(),
      getDiskUsage(),
      getActiveTCPConnections(),
      getActiveAppCount(),
    ]).then(([ramUsage, diskUsage, activeTCPConnections, activeAppCount]) => {
      const systemInfo = {
        cpuUsage: currentCPUUsage, // Güncellenmiş CPU kullanımı
        ramUsage,
        diskUsage,
        activeTCPConnections,
        activeAppCount,
      };
      ws.send(JSON.stringify(systemInfo));
    }).catch(error => {
      console.error("Hata oluştu:", error);
    });
  } catch (error) {
    console.error("Hata oluştu:", error);
  }
}
// Yerel IPv4 adresini al ve WebSocket sunucusunu başlat
const interfaces = os.networkInterfaces();
let localIPv4 = null;
Object.keys(interfaces).forEach((iface) => {
  interfaces[iface].forEach((details) => {
    if (details.family === 'IPv4' && !details.internal) {
      localIPv4 = details.address;
    }
  });
});

if (!localIPv4) {
  console.error("Yerel IPv4 adresi bulunamadı.");
} else {
  // WebSocket sunucusunu başlat
  const wss = new WebSocket.Server({ host: localIPv4, port: 8080 });

  // WebSocket sunucusunun başlatıldığı IP adresi ve portunu ekrana yazdır
  wss.on('listening', () => {
    console.log(`WebSocket sunucusu ${localIPv4} IP adresi ve 8080 portunda dinleniyor.`);



  });

  // WebSocket bağlantılarını dinle
  wss.on('connection', ws => {
    console.log('Yeni bir bağlantı kuruldu.');

    // Belirli bir aralıkta sistem bilgilerini gönder
    const intervalId = setInterval(() => {
      sendSystemInfo(ws);
    }, 5000);

    // Bağlantıyı sonlandır
    ws.on('close', () => {
      console.log('Bir bağlantı kesildi.');
      clearInterval(intervalId);
    });
  });
}
