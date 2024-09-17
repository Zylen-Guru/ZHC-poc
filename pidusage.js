const pidusage = require('pidusage');

const pid = '23392'; // This gets stats for the current Node.js process; replace with the PID of Chrome or other apps.

pidusage(pid, (err, stats) => {
  if (err) {
    console.error("Error fetching process stats:", err);
  } else {
    console.log(`CPU Usage: ${stats.cpu.toFixed(2)}%`);
    console.log(`Memory Usage: ${(stats.memory / (1024 * 1024)).toFixed(2)} MB`); // Memory in MB
    console.log(`Disk I/O: ${stats.io}`);
  }
});