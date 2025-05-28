#ctid=$(docker container run --detach --rm -p 5672:5672 rabbitmq:3.13.7-alpine)
ctid=$(docker container run --detach --rm -p 5672:5672 -p 15672:15672 rabbitmq:3.13.7-management-alpine)

ctrl_c_handler() {
  echo "Se presionó Ctrl+C. Realizando tareas de limpieza..."
  docker container stop $ctid
}

trap ctrl_c_handler INT

npm run start:dev

# curl localhost:3000 -H 'content-type: application/json' -d '{"queue": "q1", "connection": "con1"}' -X POST