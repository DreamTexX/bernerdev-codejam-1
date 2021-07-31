# Bernerdev CodeJam

![img](https://cdn.discordapp.com/attachments/794300974247575604/870274118023524402/bernerdev.logo..png)

## Topic and task

> Create a secured web application with a login, registration and at least one protected page.

- store password an user data
- passwords should not get stored in plaintext
- no ajax, no rest
- if a user fails three times giving in a password, his ip should get blocked (be aware of reverse proxies)

## Deadline

> 31. Juli 2021, 24:00 CEST

## Rules

- only native language libraries are allowed, no third party libs
- using external services is not allowed
- downloading libraries and/or code is not allowed, the code must be self written
- source code must get uploaded into a public repo til deadline

## Running
You can view a running demo at [http://1codejam.dreamtexx.fun](http://1codejam.dreamtexx.fun)

With docker:
```bash
docker build -t codejam:1 .
docker run -p 8080:8080 codejam:1
```
With deno:
```bash
deno --unstable run --allow-net --allow-read --allow-write src/main.ts
```

## Disclaimer
> This project is done for fun only, not thougth to be performant, efficient or anything else. It is not production ready.

## Credits

Thank you for Bernerdev to organizing and managing this coding jam. If you want to take part in or have propositions for future jams, join our discord: [https://discord.gg/EGHy5tXBnj](https://discord.gg/EGHy5tXBnj)