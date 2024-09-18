// const si = require('systeminformation');

// console.log("Starting system information and process gathering...");

// // Function to get system and process information
// async function getSystemAndProcessInfo() {
//   try {
//     console.log("Fetching CPU information...");
//     const cpu = await si.cpu();

//     console.log("Fetching memory information...");
//     const mem = await si.mem();

//     console.log("Fetching disk information...");
//     const fsSize = await si.fsSize();

//     console.log("Fetching network information...");
//     const network = await si.networkInterfaces();

//     console.log("Fetching GPU information...");
//     const graphics = await si.graphics();

//     console.log("Fetching running processes information...");
//     const processes = await si.processes();  // Fetching running processes

//     // Display CPU information
//     console.log("\n=== CPU Information ===");
//     console.log(`Manufacturer: ${cpu.manufacturer}`);
//     console.log(`Brand: ${cpu.brand}`);
//     console.log(`Speed: ${cpu.speed} GHz`);
//     console.log(`Cores: ${cpu.cores}`);

//     // Display Memory information
//     console.log("\n=== Memory Information ===");
//     console.log(`Total Memory: ${(mem.total / 1024 ** 3).toFixed(2)} GB`);
//     console.log(`Used Memory: ${(mem.used / 1024 ** 3).toFixed(2)} GB`);
//     console.log(`Free Memory: ${(mem.free / 1024 ** 3).toFixed(2)} GB`);

//     // Display Storage information
//     console.log("\n=== Storage Information ===");
//     fsSize.forEach(disk => {
//       console.log(`Mount: ${disk.mount}, Used: ${(disk.used / 1024 ** 3).toFixed(2)} GB, Total: ${(disk.size / 1024 ** 3).toFixed(2)} GB`);
//     });

//     // Display Network information
//     console.log("\n=== Network Information ===");
//     network.forEach(nw => {
//       console.log(`Interface: ${nw.iface}, IP Address: ${nw.ip4}, MAC Address: ${nw.mac}`);
//     });

//     // Display GPU information
//     console.log("\n=== GPU Information ===");
//     graphics.controllers.forEach(gpu => {
//       console.log(`Model: ${gpu.model}, VRAM: ${(gpu.vram / 1024).toFixed(2)} GB, Bus: ${gpu.bus}`);
//     });

//     // Display Running Processes (including applications and background tasks)
//     console.log("\n=== Running Processes (Applications and Background Processes) ===");
//     processes.list.forEach(proc => {
//       console.log(`Process Name: ${proc.name}, PID: ${proc.pid}, Parent PID: ${proc.ppid}, CPU: ${proc.cpu.toFixed(2)}%, Memory: ${(proc.memVsz / 1024 ** 2).toFixed(2)} MB`);
//     });

//     console.log("\nSystem information and processes fetched successfully!");

//   } catch (error) {
//     console.error('Error fetching system info:', error);
//   }
// }

// // Run the function to display system information and running processes
// getSystemAndProcessInfo();

// const express = require('express');
// const si = require('systeminformation');

// const app = express();
// const port = 7000;
// const cors = require('cors');
// app.use(cors());

// // Route to handle the POST request
// app.get('/api/run', async (req, res) => {
//   try {
//     // Get all processes
//     const processes = await si.processes();
    
//     const processStats = processes.list.map(process => ({
//       name: process.name,
//       pid: process.pid,
//       cpuUsage: `${process.cpu.toFixed(2)}%`,
//       memoryUsage: `${(process.memRss / (1024 * 1024)).toFixed(2)} MB`, // Memory in MB
//       diskIO: process.io
//     }));
    
//     // Send process stats as the response
//     res.json(processStats);
//   } catch (err) {
//     console.error('Error fetching process stats:', err);
//     res.status(500).json({ error: 'Error fetching process stats' });
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

const express = require('express');
const si = require('systeminformation');
const path = require('path');

const app = express();
const port = 7000;
const cors = require('cors');
app.use(cors());

// Serve the static HTML file
app.use(express.static(path.join(__dirname, 'public')));

// Route to handle the process stats API
const pm2 = require('pm2');

app.get('/api/run', async (req, res) => {
  try {
    // Get system process stats
    const processes = await si.processes();
    
    // Get PM2 metrics
    pm2.connect((err) => {
      if (err) {
        console.error('Error connecting to PM2:', err);
        return res.status(500).json({ error: 'Failed to connect to PM2' });
      }
      
      pm2.list((err, list) => {
        if (err) {
          console.error('Error fetching PM2 stats:', err);
          return res.status(500).json({ error: 'Failed to fetch PM2 stats' });
        }

        const processStats = processes.list.map(process => ({
          name: process.name,
          pid: process.pid,
          cpuUsage: `${process.cpu.toFixed(2)}%`,
          memoryUsage: `${(process.memRss / (1024 * 1024)).toFixed(2)} MB`,
          diskIO: process.io
        }));
        
        // Combine PM2 process stats with the system process stats
        const pm2Processes = list.map(pm2Process => ({
          name: pm2Process.name,
          pm_id: pm2Process.pm_id,
          status: pm2Process.pm2_env.status,
          memory: `${(pm2Process.monit.memory / (1024 * 1024)).toFixed(2)} MB`,
          cpu: `${pm2Process.monit.cpu}%`,
        }));

        res.json({ systemProcesses: processStats, pm2Processes });
        
        pm2.disconnect();
      });
    });
    
  } catch (err) {
    console.error('Error fetching process stats:', err);
    res.status(500).json({ error: 'Error fetching process stats' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
