ctid=$(docker container run --detach --rm -p 5672:5672 rabbitmq:3.13.7-alpine)

ctrl_c_handler() {
  echo "Se presionó Ctrl+C. Realizando tareas de limpieza..."
  docker container stop $ctid
}

trap ctrl_c_handler INT

npm run start:dev