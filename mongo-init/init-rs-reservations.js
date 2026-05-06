print("Inicializando rsReservations...");

rs.initiate({
  _id: "rsReservations",
  members: [
    { _id: 0, host: "mongo4:27018" },
    { _id: 1, host: "mongo5:27018" },
    { _id: 2, host: "mongo6:27018" }
  ]
});

print("✔ rsReservations iniciado");