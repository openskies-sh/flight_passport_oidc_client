# Flight Passport Node Client
This is a sample front end for [Flight Passport](https://www.github.com/openskies-sh/flight_passport), using this you can log in to the application and get tokens for your application. This supports the `Authorization Code` grant. 

## Running the Sample

Install the dependencies.

```bash
npm install
```

Rename `.env.example` to `.env` and replace the values with your Flight Passport credentials. If you don't yet have one you can contact your administrator to issue accounts to you. 

```bash
# copy configuration and replace with your own
cp .env.example .env
```

Run the app.

```bash
npm start
```

The app will be served at `localhost:3000`.

## Credits
This repository is a fork of the [Auth0 Node Client](https://github.com/auth0-samples/auth0-nodejs-webapp-sample/tree/master/01-Login), I have modified it to use a generic OAUTH strategy using PassportJS and customized it for Flight Passport. 