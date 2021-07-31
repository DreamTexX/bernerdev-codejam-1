FROM denoland/deno:alpine-1.12.2

WORKDIR /tmp/app
ADD . /tmp/app/
RUN deno --unstable bundle src/main.ts app.js

WORKDIR /app
ADD . /app/
RUN rm -rf src
RUN cp /tmp/app/app.js /app/
RUN rm -rf /tmp

CMD [ "deno", "--unstable", "run", "--allow-net", "--allow-read", "--allow-write", "app.js" ]