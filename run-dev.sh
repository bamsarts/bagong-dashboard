docker build -f Dockerfile.dev -t bagong-dashboard .
docker run -p 1018:1018 -v ${PWD}:/app -v /app/node_modules bagong-dashboard