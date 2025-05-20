# Samsung EMDX

With this module you can show images on a Samsung EMDX E-Paper Display from the command-line.

## Usage

```bash
$ npm i -g @weejewel/samsung-emdx
$ samsung-emdx show-image \
  --mac 00:11:22:33:44:55 \ # Optional. Used for Wake-on-LAN
  --host 192.168.0.123 \
  --pin 123456 \
  --image ~/Photos/Doggy.jpg
```

And ta-da! Within a few seconds your display should start refreshing.

## References

* [node-samsung-mdc](https://github.com/WeeJeWel/node-samsung-mdc)