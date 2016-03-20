# Ascii-shot

Get your latest Instagram shot as an ASCII version to `stdout`.

![ASCIIfeed](./assets/example.png)

## Installing

Install `asciifeed` with `npm`

``` bash
npm install ascii-shot -g
```

## Usage (CLI)

### ascii-shot
Prints your latest Instagram shot as an ASCII version to `stdout`.

``` bash
ascii-shot
```

## Setting up
Instagram API is quite restrictive, so you'll need to jump through some hoops.

1. Setup your client here: https://www.instagram.com/developer/
2. Set your `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` and `INSTAGRAM_REDIRECT_URI` as environment variables. For example

``` bash
  set INSTAGRAM_CLIENT_SECRET=your_secret_here
```

When you run `ascii-feed`, it will automatically fetch your `access_token` and show your newest Instagram shot. If it's your first time running the script, it will most likely ask you to authoritize the app.

After you have successfully gained your `access_token`, check the console and save it as an environment variable `INSTAGRAM_ACCESS_TOKEN` to skip further need to get it again. (The tokens, however, might expire at some point so you might need to get another later).

## Why would I want this?
¯\\\_(ツ)_/¯

Like I said, the API is quite restrictive and this is pretty much all ASCII fun you can have without breaking all or some of the rules.


## License and acknowledgements
MIT Copyright © 2016 Pete Nykänen
