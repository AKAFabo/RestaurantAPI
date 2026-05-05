print("🚀 Inicializando rsProducts...");

rs.initiate({
  _id: "rsProducts",
  members: [
    { _id: 0, host: "mongo1:27018" },
    { _id: 1, host: "mongo2:27018" },
    { _id: 2, host: "mongo3:27018" }
  ]
});

print("✔ rsProducts iniciado");