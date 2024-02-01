// src/scripts/syncnetworkconfig.ts
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';

async function syncNetworkConfig() {
	const capacitorConfigRaw = await fs.readFile('./capacitor.config.json');
	await fs.copyFile('./capacitor.config.json', `./capacitor.config.json.timestamp-${Date.now()}`);
	const config = JSON.parse(String(capacitorConfigRaw));
	if (!config.server) config.server = {};
	config.server.url = `http://${getIp()}:${await getPort()}/`;
	config.server.cleartext = true;
	await fs.writeFile('./capacitor.config.json', JSON.stringify(config));
	await new Promise((resolve, reject) => {
		const child = exec('pnpm cap sync');
		child.addListener('error', reject);
		child.addListener('exit', resolve);
	});
	cleanup();
}
try {
	syncNetworkConfig();
} catch (e) {
	cleanup().then(() => {
		if (e instanceof Error) console.error(e.message);
		else console.error(e);
		process.exit(-1);
	});
}

function getIp() {
	const ifaces = os.networkInterfaces();
	let ip = 'localhost';
	Object.keys(ifaces).forEach((ifname) => {
		let alias = 0;
		const iface = ifaces[ifname];
		if (!iface) return;
		iface.forEach((iface2) => {
			if ('IPv4' !== iface2.family || iface2.internal !== false) return;
			if (alias >= 1) ip = iface2.address;
			else ip = iface2.address;
			++alias;
		});
	});
	return ip;
}

async function getPort() {
	const file = await fs.readFile('./vite.config.ts');
	const match = String(file).match(/port:\s*(\d+)/);
	return match && match[1] ? match[1] : 5173;
}

async function cleanup() {
	const files = await fs.readdir('./');
	for (const file of files) {
		if (file.match(/capacitor\.config\.json\.timestamp-\d+/g)) {
			await fs.copyFile(`./${file}`, './capacitor.config.json');
			await fs.unlink(file);
		}
	}
}
