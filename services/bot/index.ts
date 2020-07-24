import Client from './structures/client/Client';

const client = new Client();

client.launch();

process.on('uncaughtException', console.error);
