import net from 'net';

/**
 * Checks if a specific port is currently occupied on localhost.
 * @param {number} port Port number to test
 * @returns {Promise<boolean>} True if port is occupied, false if free
 */
function isPortOccupied(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(400); // 400ms timeout
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true); // Connected means something is running on port
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false); // Connection refused means port is free
    });

    socket.connect(port, '127.0.0.1');
  });
}

/**
 * Inspects common development ports to find occupied ports.
 * @param {Array<number>} [portsToCheck] List of ports to test
 * @returns {Promise<Array<number>>} Array of occupied port numbers
 */
export async function inspectPorts(portsToCheck = [8080, 5432, 6379, 3000, 5000, 8000]) {
  const results = await Promise.all(
    portsToCheck.map(async (port) => {
      const occupied = await isPortOccupied(port);
      return occupied ? port : null;
    })
  );

  return results.filter(Boolean);
}
