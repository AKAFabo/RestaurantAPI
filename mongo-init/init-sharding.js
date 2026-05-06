print("Configurando sharding...");

sh.addShard("rsProducts/mongo1:27018,mongo2:27018,mongo3:27018");
sh.addShard("rsReservations/mongo4:27018,mongo5:27018,mongo6:27018");

sh.enableSharding("restaurante");

// Shard para productos (colección menus, campo category)
sh.shardCollection("restaurante.menus", { category: 1 });

// Shard para reservas (colección reservations, campo restaurant_id)
sh.shardCollection("restaurante.reservations", { restaurant_id: "hashed" });

print("🎉 Cluster listo");