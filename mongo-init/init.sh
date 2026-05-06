#!/bin/bash
set -e

# Función para esperar que un mongod esté listo
wait_for_mongo() {
  local host=$1
  local port=$2
  echo " Esperando $host:$port..."
  until mongosh --host "$host" --port "$port" --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; do
    sleep 2
  done
  echo " $host:$port listo"
}

# Esperar todos los nodos de datos
wait_for_mongo mongo1 27018
wait_for_mongo mongo2 27018
wait_for_mongo mongo3 27018
wait_for_mongo mongo4 27018
wait_for_mongo mongo5 27018
wait_for_mongo mongo6 27018
wait_for_mongo configsvr 27019

# Función para inicializar un replica set solo si no está ya inicializado
init_rs_if_needed() {
  local host=$1
  local port=$2
  local script=$3
  local name=$4

  STATUS=$(mongosh --host "$host" --port "$port" --eval "rs.status().ok" --quiet 2>/dev/null || echo "0")
  if [ "$STATUS" = "1" ]; then
    echo "⏭  $name ya está inicializado, saltando..."
  else
    echo " Iniciando $name..."
    mongosh --host "$host" --port "$port" /scripts/"$script"
  fi
}

# Inicializar replica sets de datos (solo si no están ya inicializados)
init_rs_if_needed mongo1 27018 init-rs-products.js rsProducts
init_rs_if_needed mongo4 27018 init-rs-reservations.js rsReservations
init_rs_if_needed configsvr 27019 init-rs-configsvr.js cfgRS

#  Esperar que los primarios estén elegidos
echo " Esperando elección de primarios..."
sleep 15

#  Esperar que mongos esté listo
wait_for_mongo mongos 27017

#  Configurar sharding solo si no está ya configurado
echo " Verificando sharding..."
SHARD_COUNT=$(mongosh --host mongos --port 27017 --eval "db.adminCommand('listShards').shards.length" --quiet 2>/dev/null || echo "0")
if [ "$SHARD_COUNT" -ge "2" ]; then
  echo " Sharding ya configurado, saltando..."
else
  echo " Configurando sharding..."
  mongosh --host mongos --port 27017 /scripts/init-sharding.js
fi

echo " Todo el cluster está configurado y listo"