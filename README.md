# Creates Cred Credentials on the Server Side
# Development Overview

This is a NodeJS + Express app

## Running

Install modules:
`npm install`

To run, do:
`npm run dev`

## Testing 

Create a new QR code using the following command

`curl -X POST -d '{"fullName":"Vitor Pamplona", "dob":"1922-07-27"}' -H 'Content-Type: application/json' http://localhost:8000/status`


## Generating new Version

GitHub Actions generates a new [Release](https://github.com/vitorpamplona/vaccine-certificate-tracking-app/releases) when npm version is run and pushed to the repo.

```
npm version <version number: x.x.x>
```

## Contributing

[Issues](https://github.com/Path-Check/massqr/issues) and [pull requests](https://github.com/Path-Check/massqr/pulls) are very welcome! :)

