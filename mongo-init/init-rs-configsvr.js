print("🚀 Inicializando cfgRS (config server)...");

rs.initiate({
  _id: "cfgRS",
  configsvr: true,
  members: [
    { _id: 0, host: "configsvr:27019" }
  ]
});

print("✔ cfgRS iniciado");