FROM denoland/deno:alpine-1.34.2
#ENTRYPOINT ["/tini", "--", "docker-entrypoint.sh"]
WORKDIR /app
RUN apk  update && apk add -f bash
